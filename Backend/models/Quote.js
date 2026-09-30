const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    default: null
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  serviceListingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceListing',
    required: true
  },
  serviceCategory: {
    type: String,
    required: true
  },
  eventDate: {
    type: Date,
    required: true
  },
  guestCount: {
    type: Number,
    default: 0
  },
  durationHours: {
    type: Number,
    default: 1
  },
  location: {
    type: String,
    required: true
  },
  requirements: {
    type: String,
    default: ''
  },
  proposedAmount: {
    type: Number,
    default: 0
  },
  includedServices: [{
    type: String
  }],
  terms: {
    type: String,
    default: ''
  },
  validUntil: {
    type: Date
  },
  status: {
    type: String,
    enum: ['PENDING', 'OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
    default: 'PENDING',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quote', quoteSchema);
