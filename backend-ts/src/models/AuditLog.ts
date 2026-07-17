import mongoose, { Schema, type Model } from 'mongoose';
import type { IAuditLog } from '../types/index.js';
import { AuditStatus } from '../types/enums.js';

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    adminEmail: { type: String, required: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, required: true },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    resourceDetails: String,
    changes: { before: Schema.Types.Mixed, after: Schema.Types.Mixed },
    reason: String,
    ipAddress: String,
    userAgent: String,
    status: { type: String, enum: Object.values(AuditStatus), default: AuditStatus.Success },
    errorMessage: String,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true, collection: 'auditlogs' },
);

auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ resourceId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog: Model<IAuditLog> = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
