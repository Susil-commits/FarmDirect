import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    adminEmail: {
      type: String,
      required: true
    },
    action: {
      type: String,
      enum: [
        'USER_CREATED',
        'USER_UPDATED',
        'USER_DELETED',
        'USER_ROLE_CHANGED',
        'USER_SUSPENDED',
        'USER_BANNED',
        'CROP_APPROVED',
        'CROP_REJECTED',
        'CROP_DELETED',
        'ORDER_STATUS_CHANGED',
        'ORDER_RESOLVED',
        'REFUND_ISSUED',
        'KYC_APPROVED',
        'KYC_REJECTED',
        'LOGIN',
        'LOGOUT'
      ],
      required: true,
      index: true
    },
    resourceType: {
      type: String,
      enum: ['User', 'Crop', 'Order', 'Review', 'KYC'],
      required: true
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    resourceDetails: {
      type: String // Original name/email/identifier of resource
    },
    changes: {
      before: mongoose.Schema.Types.Mixed,
      after: mongoose.Schema.Types.Mixed
    },
    reason: String, // e.g., rejection reason, ban reason
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    },
    errorMessage: String,
    timestamp: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true,
    collection: 'auditlogs'
  }
);

// Index for efficient querying
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
