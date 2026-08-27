import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: { type: String, required: true },
    recordType: { type: String, required: true },
    recordId: mongoose.Schema.Types.ObjectId,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true },
);

export const AuditLog =
  mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
