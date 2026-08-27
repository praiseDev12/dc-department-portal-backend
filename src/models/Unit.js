import mongoose from 'mongoose';

const unitSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    adminUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

unitSchema.index({ department: 1, name: 1 }, { unique: true });

export const Unit = mongoose.models.Unit || mongoose.model('Unit', unitSchema);
