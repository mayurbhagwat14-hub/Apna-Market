const AuditLog = require('../models/AuditLog');

/**
 * Log an audit event
 * @param {Object} params
 * @param {String} params.actorId
 * @param {'VENDOR'|'ADMIN'|'CUSTOMER'|'SYSTEM'} params.actorType
 * @param {String} [params.actorName]
 * @param {String} params.action
 * @param {String} params.entity
 * @param {String} params.entityId
 * @param {Object} [params.previousValue]
 * @param {Object} [params.newValue]
 * @param {Object} [params.req] Express request object to capture IP and user-agent
 */
const logAudit = async ({
  actorId,
  actorType,
  actorName = 'System',
  action,
  entity,
  entityId,
  previousValue = null,
  newValue = null,
  req = null
}) => {
  try {
    const ipAddress = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip) : null;
    const userAgent = req ? req.headers['user-agent'] : null;

    await AuditLog.create({
      actorId,
      actorType,
      actorName,
      action,
      entity,
      entityId: String(entityId),
      previousValue,
      newValue,
      ipAddress,
      userAgent
    });
  } catch (err) {
    console.error('AuditLog Creation Error:', err.message);
  }
};

module.exports = { logAudit };
