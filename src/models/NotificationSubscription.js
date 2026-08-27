import mongoose from 'mongoose';

const notificationSubscriptionSchema = new mongoose.Schema(
  {
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', index: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: String,
      auth: String,
    },
  },
  { timestamps: true },
);

notificationSubscriptionSchema.index(
  { department: 1, endpoint: 1 },
  { unique: true },
);

export const NotificationSubscription =
  mongoose.models.NotificationSubscription ||
  mongoose.model('NotificationSubscription', notificationSubscriptionSchema);
