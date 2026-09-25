import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    priority: {
      type: String,
      enum: ['normal', 'important'],
      default: 'normal',
      index: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    publishAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

announcementSchema.index({
  department: 1,
  active: 1,
  publishAt: -1,
});

export const Announcement =
  mongoose.models.Announcement ||
  mongoose.model('Announcement', announcementSchema);
