// Socket.io initialization
const { Server } = require('socket.io');
const { authenticateSocket } = require('../middleware/authMiddleware');

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    pingTimeout: 60000,
    pingInterval: 25000,
    cors: {
      origin: [
        ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : []),
        'http://localhost:5173', 
        'http://127.0.0.1:5173'
      ],
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ['polling', 'websocket']
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token using the same method as HTTP middleware
      const { verifyAccessToken } = require('../utils/tokenService');
      const decoded = verifyAccessToken(token);

      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`);

    // Join user-specific room for notifications
    if (socket.userRole === 'USER') {
      socket.join(`user_${socket.userId.toString()}`);
    } else if (socket.userRole === 'VENDOR') {
      socket.join(`vendor_${socket.userId.toString()}`);
      // Update vendor online status
      updateVendorOnlineStatus(socket.userId, true, socket.id);
    } else if (socket.userRole === 'WORKER') {
      socket.join(`worker_${socket.userId.toString()}`);
      // Update worker online status
      updateWorkerOnlineStatus(socket.userId, true, socket.id);
    } else if (socket.userRole === 'ADMIN') {
      socket.join(`admin_${socket.userId.toString()}`);
    }

    // Explicit Room Join Events (Fallback/Frontend Initiated)
    socket.on('join_vendor_room', (vendorId) => {
      // Security check: ensure the socket user actually IS this vendor
      if (socket.userRole === 'VENDOR' && socket.userId.toString() === vendorId.toString()) {
        socket.join(`vendor_${vendorId.toString()}`);
        console.log(`Socket ${socket.id} explicitly joined room vendor_${vendorId}`);
      }
    });

    socket.on('join_user_room', (userId) => {
      // Ensure strings for comparison
      if (socket.userRole === 'USER' && socket.userId.toString() === userId.toString()) {
        socket.join(`user_${userId.toString()}`);
        console.log(`Socket ${socket.id} explicitly joined room user_${userId}`);
      }
    });

    socket.on('join_worker_room', (workerId) => {
      if (socket.userRole === 'WORKER' && socket.userId === workerId) {
        socket.join(`worker_${workerId}`);
        console.log(`Socket ${socket.id} explicitly joined room worker_${workerId}`);
      }
    });

    // Live Tracking Events
    socket.on('join_tracking', async (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log(`User ${socket.userId} joined tracking for booking_${bookingId}`);

      try {
        const Booking = require('../models/Booking');
        const { usesLiveLocation, trackingTypeOf } = require('../utils/trackingType');
        const booking = await Booking.findById(bookingId).select('trackingType tracking status vendorId workerId userId').lean();
        if (!booking || !usesLiveLocation(trackingTypeOf(booking))) return;

        const { getLiveLocation } = require('../services/redisService');
        const cachedLocation = await getLiveLocation(bookingId);
        if (cachedLocation) {
          socket.emit('live_location_update', cachedLocation);
        }
      } catch (error) {
        console.error('[Socket] Error fetching cached location:', error);
      }
    });

    // Vendor acknowledges receiving booking alert
    socket.on('booking_alert_received', async (data) => {
      try {
        const BookingRequest = require('../models/BookingRequest');
        await BookingRequest.findOneAndUpdate(
          { bookingId: data.bookingId, vendorId: socket.userId },
          { status: 'VIEWED', viewedAt: new Date(), socketDelivered: true }
        );
        console.log(`[Socket] Vendor ${socket.userId} viewed booking ${data.bookingId}`);
      } catch (error) {
        console.error('[Socket] Error updating booking request:', error);
      }
    });

    // Worker/Vendor sets availability
    socket.on('set_availability', async (data) => {
      try {
        const Vendor = require('../models/Vendor');


        if (socket.userRole === 'VENDOR') {
          await Vendor.findByIdAndUpdate(socket.userId, {
            availability: data.status // 'AVAILABLE', 'BUSY', etc.
          });
        } else if (socket.userRole === 'WORKER') {
          await Worker.findByIdAndUpdate(socket.userId, {
            status: data.status // 'ONLINE', 'BUSY', etc.
          });
        }
        console.log(`[Socket] ${socket.userRole} ${socket.userId} set availability to ${data.status}`);
      } catch (error) {
        console.error('[Socket] Error setting availability:', error);
      }
    });

    // Rate limiting maps for location updates
    const locationUpdateTimestamps = new Map();
    const locationDbWriteTimestamps = new Map();

    socket.on('update_location', async (data) => {
      const bookingId = data?.bookingId;
      const lat = parseFloat(data.lat);
      const lng = parseFloat(data.lng);
      const heading = parseFloat(data.heading) || 0;

      if (!bookingId || isNaN(lat) || isNaN(lng)) return;
      if (socket.userRole !== 'VENDOR' && socket.userRole !== 'WORKER') return;

      const rateLimitKey = `${socket.userId}:${bookingId}`;
      const lastUpdate = locationUpdateTimestamps.get(rateLimitKey) || 0;
      const now = Date.now();
      if (now - lastUpdate < 2000) {
        return;
      }
      locationUpdateTimestamps.set(rateLimitKey, now);

      let booking = null;
      try {
        const Booking = require('../models/Booking');
        const { canEmitLiveLocation, usesLiveLocation, trackingTypeOf } = require('../utils/trackingType');
        booking = await Booking.findById(bookingId).select('vendorId workerId trackingType tracking status').lean();
        if (!booking) return;

        const isOwner =
          (socket.userRole === 'VENDOR' && booking.vendorId && booking.vendorId.toString() === socket.userId.toString())
          || (socket.userRole === 'WORKER' && booking.workerId && booking.workerId.toString() === socket.userId.toString());
        if (!isOwner) return;
        if (!usesLiveLocation(trackingTypeOf(booking)) || !canEmitLiveLocation(booking)) {
          return;
        }
      } catch (error) {
        console.error('[Socket] Error validating live location booking:', error);
        return;
      }

      const locationPayload = {
        lat,
        lng,
        heading,
        role: socket.userRole,
        updatedAt: new Date().toISOString()
      };

      socket.to(`booking_${bookingId}`).emit('live_location_update', locationPayload);

      try {
        const { setLiveLocation, setVendorLocation } = require('../services/redisService');
        await setLiveLocation(bookingId, locationPayload, 30);

        if (socket.userRole === 'VENDOR') {
          await setVendorLocation(socket.userId, lat, lng);
        }
      } catch (error) {
        console.error('[Socket] Error caching live location:', error);
      }

      const lastDbWrite = locationDbWriteTimestamps.get(rateLimitKey) || 0;
      const shouldWriteDb = now - lastDbWrite >= 10000;
      if (!shouldWriteDb) return;
      locationDbWriteTimestamps.set(rateLimitKey, now);

      try {
        const Vendor = require('../models/Vendor');
        const Booking = require('../models/Booking');

        const updateData = {
          location: {
            lat,
            lng,
            heading,
            updatedAt: new Date()
          },
          geoLocation: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        };

        if (socket.userRole === 'VENDOR') {
          await Vendor.findByIdAndUpdate(socket.userId, updateData);
        }

        await Booking.findByIdAndUpdate(bookingId, {
          'tracking.live.lat': lat,
          'tracking.live.lng': lng,
          'tracking.live.heading': heading,
          'tracking.live.lastUpdatedAt': new Date()
        });
      } catch (error) {
        console.error('Error saving live location:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      // Update online status
      if (socket.userRole === 'VENDOR') {
        updateVendorOnlineStatus(socket.userId, false, null);
      } else if (socket.userRole === 'WORKER') {
        updateWorkerOnlineStatus(socket.userId, false, null);
      }
    });
  });

  console.log('Socket.io initialized successfully');
};

// Helper function to update vendor online status
const updateVendorOnlineStatus = async (vendorId, isOnline, socketId) => {
  try {
    const Vendor = require('../models/Vendor');
    const { setVendorOnline, setVendorAvailability } = require('../services/redisService');

    const updateData = {
      isOnline,
      currentSocketId: socketId
    };

    if (isOnline) {
      updateData.availability = 'AVAILABLE';
    } else {
      updateData.lastSeenAt = new Date();
      updateData.availability = 'OFFLINE';
    }

    // Update MongoDB
    await Vendor.findByIdAndUpdate(vendorId, updateData);

    // Update Redis cache (fast lookup)
    await setVendorOnline(vendorId, isOnline);
    await setVendorAvailability(vendorId, updateData.availability);

    console.log(`[Socket] Vendor ${vendorId} is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`);
  } catch (error) {
    console.error('[Socket] Error updating vendor online status:', error);
  }
};

// Get io instance for emitting notifications
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };

