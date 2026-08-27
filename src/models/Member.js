import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const unitHistorySchema = new mongoose.Schema(
  {
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    movedAt: { type: Date, default: Date.now },
    movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  },
  { _id: false },
);

const memberSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
      index: true,
    },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['female', 'male', 'other', 'prefer_not_to_say'],
    },
    maritalStatus: {
      type: String,
      enum: ['single', 'married', 'widowed', 'divorced', 'prefer_not_to_say'],
    },
    photoUrl: String,
    phoneNumber: String,
    whatsappNumber: String,
    email: { type: String, lowercase: true, trim: true },
    address: String,
    occupation: String,
    roleInUnit: String,
    dateJoinedDepartment: Date,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
    unitHistory: [unitHistorySchema],
    consentAcceptedAt: Date,

    password: { type: String, select: false },
  },
  { timestamps: true },
);
memberSchema.index({ department: 1, email: 1 }, { unique: true, sparse: true });

memberSchema.index({
  department: 1,
  unit: 1,
  fullName: 'text',
  email: 'text',
  phoneNumber: 'text',
});

memberSchema.methods.setPassword = async function (plainPassword) {
  this.password = await bcrypt.hash(plainPassword, 10);
};

memberSchema.methods.verifyPassword = async function (plainPassword) {
  if (!this.password) return false;
  return bcrypt.compare(plainPassword, this.password);
};

export const Member =
  mongoose.models.Member || mongoose.model('Member', memberSchema);
