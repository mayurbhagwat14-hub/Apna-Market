const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  actorType: {
    type: String,
    enum: ['VENDOR', 'ADMIN', 'CUSTOMER', 'SYSTEM'],
    required: true,
    index: true
  },
  actorName: {
    type: String,
    default: 'System'
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  entity: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  previousValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
