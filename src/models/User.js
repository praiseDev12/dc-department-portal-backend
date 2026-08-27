import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['main_admin', 'unit_admin'], required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.index({ department: 1, email: 1 }, { unique: true });

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 12);
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.models.User || mongoose.model('User', userSchema);
