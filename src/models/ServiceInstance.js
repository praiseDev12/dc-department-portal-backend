import mongoose from 'mongoose';

const serviceInstanceSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      index: true,
    },
    serviceDate: { type: Date, required: true },
    startsAt: { type: Date, required: true },
    verificationCodeHash: { type: String, required: true },
    codeExpiresAt: { type: Date, required: true },
    qrPayload: String,
  },
  { timestamps: true },
);

serviceInstanceSchema.index(
  { department: 1, service: 1, serviceDate: 1 },
  { unique: true },
);

export const ServiceInstance =
  mongoose.models.ServiceInstance ||
  mongoose.model('ServiceInstance', serviceInstanceSchema);
