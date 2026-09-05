import mongoose from 'mongoose';

const contributionEntrySchema = new mongoose.Schema(
  {
    contribution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contribution',
      required: true,
      index: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    contributedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

contributionEntrySchema.index({
  contribution: 1,
  member: 1,
});

export const ContributionEntry =
  mongoose.models.ContributionEntry ||
  mongoose.model('ContributionEntry', contributionEntrySchema);
