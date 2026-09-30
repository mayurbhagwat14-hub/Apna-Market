const Quote = require('../../models/Quote');
const ServiceListing = require('../../models/ServiceListing');
const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const { logAudit } = require('../../utils/auditLogger');

/**
 * Customer submits custom quote request (DJ, Photography, Marriage Hall, etc.)
 */
const requestQuote = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { serviceListingId, eventDate, guestCount, durationHours, location, requirements } = req.body;

    if (!serviceListingId || !eventDate || !location) {
      return res.status(400).json({ success: false, message: 'Service, event date, and location are required.' });
    }

    const listing = await ServiceListing.findById(serviceListingId);
    if (!listing || !require('../../utils/serviceListingPublic').isListingBookable(listing)) {
      return res.status(404).json({ success: false, message: 'Service listing not found or not active.' });
    }

    const quote = await Quote.create({
      customerId,
      vendorId: listing.vendorId,
      serviceListingId: listing._id,
      serviceCategory: listing.categoryName,
      eventDate,
      guestCount: guestCount || 0,
      durationHours: durationHours || 1,
      location: location.trim(),
      requirements: requirements ? requirements.trim() : '',
      status: 'PENDING'
    });

    res.status(201).json({
      success: true,
      message: 'Quote request submitted to provider!',
      quote
    });
  } catch (error) {
    console.error('Request quote error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quote request.' });
  }
};

/**
 * Vendor retrieves quotes for their services
 */
const getVendorQuotes = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status } = req.query;

    const query = { vendorId };
    if (status) query.status = status;

    const quotes = await Quote.find(query)
      .populate('customerId', 'name phone email')
      .populate('serviceListingId', 'title categoryName pricing')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, quotes });
  } catch (error) {
    console.error('Get vendor quotes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotes.' });
  }
};

/**
 * Customer retrieves their quote requests
 */
const getCustomerQuotes = async (req, res) => {
  try {
    const customerId = req.user.id;

    const quotes = await Quote.find({ customerId })
      .populate('vendorId', 'name businessName phone profilePhoto')
      .populate('serviceListingId', 'title categoryName')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, quotes });
  } catch (error) {
    console.error('Get customer quotes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotes.' });
  }
};

/**
 * Vendor sends quote offer/proposal
 */
const proposeQuote = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { quoteId } = req.params;
    const { proposedAmount, includedServices, terms, validUntil } = req.body;

    if (!proposedAmount || proposedAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid proposed amount.' });
    }

    const quote = await Quote.findOne({ _id: quoteId, vendorId });
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote request not found.' });
    }

    quote.proposedAmount = Number(proposedAmount);
    quote.includedServices = Array.isArray(includedServices) ? includedServices : [];
    quote.terms = terms ? terms.trim() : '';
    quote.validUntil = validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    quote.status = 'OFFERED';

    await quote.save();

    await logAudit({
      actorId: vendorId,
      actorType: 'VENDOR',
      action: 'QUOTE_PROPOSED',
      entity: 'Quote',
      entityId: quote._id,
      newValue: { proposedAmount, validUntil: quote.validUntil },
      req
    });

    res.status(200).json({
      success: true,
      message: 'Quote proposal sent to customer!',
      quote
    });
  } catch (error) {
    console.error('Propose quote error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quote proposal.' });
  }
};

/**
 * Customer responds to quote (Accept / Reject)
 */
const respondQuote = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { quoteId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const quote = await Quote.findOne({ _id: quoteId, customerId });
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found.' });
    }

    if (quote.status !== 'OFFERED') {
      return res.status(400).json({ success: false, message: 'Quote is not in offered status.' });
    }

    if (action === 'accept') {
      quote.status = 'ACCEPTED';

      // Create a confirmed booking automatically
      const listing = await ServiceListing.findById(quote.serviceListingId).populate('categoryId', 'slug trackingType allowVendorBilling');
      const { resolveTrackingType, buildTrackingSubdoc } = require('../../utils/trackingType');
      const trackingType = resolveTrackingType({ category: listing?.categoryId, listing });
      const booking = await Booking.create({
        userId: customerId,
        vendorId: quote.vendorId,
        serviceListingId: listing?._id || quote.serviceListingId,
        serviceName: listing ? listing.title : quote.serviceCategory,
        serviceCategory: quote.serviceCategory,
        scheduledDate: quote.eventDate,
        totalAmount: quote.proposedAmount,
        finalAmount: quote.proposedAmount,
        address: { fullAddress: quote.location },
        status: 'confirmed',
        trackingType,
        tracking: buildTrackingSubdoc(trackingType),
        allowVendorBilling: listing?.categoryId?.allowVendorBilling !== false
      });

      quote.bookingId = booking._id;
      await quote.save();

      return res.status(200).json({
        success: true,
        message: 'Quote accepted and booking confirmed!',
        quote,
        booking
      });
    } else {
      quote.status = 'REJECTED';
      await quote.save();

      return res.status(200).json({
        success: true,
        message: 'Quote proposal declined.',
        quote
      });
    }
  } catch (error) {
    console.error('Respond quote error:', error);
    res.status(500).json({ success: false, message: 'Failed to respond to quote.' });
  }
};

module.exports = {
  requestQuote,
  getVendorQuotes,
  getCustomerQuotes,
  proposeQuote,
  respondQuote
};
