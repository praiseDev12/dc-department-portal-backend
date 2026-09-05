import { Contribution } from '../models/Contribution.js';
import { ContributionEntry } from '../models/ContributionEntry.js';
import { Member } from '../models/Member.js';
import { AppError } from '../utils/errors.js';

function ensureMainAdmin(user) {
  if (!user?.department) {
    throw new AppError('Department not found', 400);
  }

  if (user.role !== 'main_admin') {
    throw new AppError('Only main admins can manage contributions', 403);
  }
}

export async function createContribution({ user, title }) {
  ensureMainAdmin(user);

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('Contribution title is required', 400);
  }

  const contribution = await Contribution.create({
    department: user.department,
    title: title.trim(),
    createdBy: user._id,
  });

  return {
    ...contribution.toObject(),
    entries: [],
    totalAmount: 0,
  };
}

export async function addContributionEntry({
  user,
  contributionId,
  memberId,
  amount,
  contributedAt,
}) {
  ensureMainAdmin(user);

  const contribution = await Contribution.findOne({
    _id: contributionId,
    department: user.department,
  });

  if (!contribution) {
    throw new AppError('Contribution not found', 404);
  }

  const member = await Member.findOne({
    _id: memberId,
    department: user.department,
    status: 'active',
  });

  if (!member) {
    throw new AppError('Member not found', 404);
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new AppError('Amount must be greater than zero', 400);
  }

  const entry = await ContributionEntry.create({
    contribution: contribution._id,
    department: user.department,
    member: member._id,
    amount: numericAmount,
    contributedAt: contributedAt || new Date(),
    recordedBy: user._id,
  });

  await entry.populate('member', 'fullName');

  return entry;
}

export async function getContributions({ user }) {
  ensureMainAdmin(user);

  const contributions = await Contribution.find({
    department: user.department,
  })
    .populate('createdBy', 'fullName')
    .sort({ createdAt: -1 })
    .lean();

  const contributionIds = contributions.map((contribution) => contribution._id);

  const entries = await ContributionEntry.find({
    department: user.department,
    contribution: { $in: contributionIds },
  })
    .populate('member', 'fullName')
    .populate('recordedBy', 'fullName')
    .sort({ contributedAt: -1 })
    .lean();

  return contributions.map((contribution) => {
    const contributionEntries = entries.filter(
      (entry) => entry.contribution.toString() === contribution._id.toString(),
    );

    const totalAmount = contributionEntries.reduce(
      (total, entry) => total + entry.amount,
      0,
    );

    return {
      ...contribution,
      entries: contributionEntries,
      totalAmount,
    };
  });
}

export async function getContribution({ user, contributionId }) {
  ensureMainAdmin(user);

  const contribution = await Contribution.findOne({
    _id: contributionId,
    department: user.department,
  })
    .populate('createdBy', 'fullName')
    .lean();

  if (!contribution) {
    throw new AppError('Contribution not found', 404);
  }

  const entries = await ContributionEntry.find({
    contribution: contribution._id,
    department: user.department,
  })
    .populate('member', 'fullName phoneNumber photoUrl')
    .populate('recordedBy', 'fullName')
    .sort({ contributedAt: -1 })
    .lean();

  const totalAmount = entries.reduce((total, entry) => total + entry.amount, 0);

  return {
    ...contribution,
    entries,
    totalAmount,
  };
}

export async function updateContributionEntry({
  user,
  contributionId,
  entryId,
  memberId,
  amount,
  contributedAt,
}) {
  ensureMainAdmin(user);

  const entry = await ContributionEntry.findOne({
    _id: entryId,
    contribution: contributionId,
    department: user.department,
  });

  if (!entry) {
    throw new AppError('Contribution entry not found', 404);
  }

  if (memberId !== undefined) {
    const member = await Member.findOne({
      _id: memberId,
      department: user.department,
      status: 'active',
    });

    if (!member) {
      throw new AppError('Member not found', 404);
    }

    entry.member = member._id;
  }

  if (amount !== undefined) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      throw new AppError('Amount must be greater than zero', 400);
    }

    entry.amount = numericAmount;
  }

  if (contributedAt !== undefined) {
    const date = new Date(contributedAt);

    if (Number.isNaN(date.getTime())) {
      throw new AppError('Invalid contribution date', 400);
    }

    entry.contributedAt = date;
  }

  await entry.save();

  await entry.populate('member', 'fullName');

  return entry;
}

export async function deleteContributionEntry({
  user,
  contributionId,
  entryId,
}) {
  ensureMainAdmin(user);

  const entry = await ContributionEntry.findOneAndDelete({
    _id: entryId,
    contribution: contributionId,
    department: user.department,
  });

  if (!entry) {
    throw new AppError('Contribution entry not found', 404);
  }

  return entry;
}

export async function updateContribution({ user, contributionId, title }) {
  ensureMainAdmin(user);

  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new AppError('Contribution title is required', 400);
  }

  const contribution = await Contribution.findOneAndUpdate(
    {
      _id: contributionId,
      department: user.department,
    },
    {
      $set: {
        title: title.trim(),
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate('createdBy', 'fullName')
    .lean();

  if (!contribution) {
    throw new AppError('Contribution not found', 404);
  }

  const entries = await ContributionEntry.find({
    contribution: contribution._id,
    department: user.department,
  })
    .populate('member', 'fullName')
    .populate('recordedBy', 'fullName')
    .sort({ contributedAt: -1 })
    .lean();

  const totalAmount = entries.reduce(
    (total, entry) => total + Number(entry.amount || 0),
    0,
  );

  return {
    ...contribution,
    entries,
    totalAmount,
  };
}

export async function deleteContribution({ user, contributionId }) {
  ensureMainAdmin(user);

  const contribution = await Contribution.findOne({
    _id: contributionId,
    department: user.department,
  });

  if (!contribution) {
    throw new AppError('Contribution not found', 404);
  }

  await ContributionEntry.deleteMany({
    contribution: contribution._id,
    department: user.department,
  });

  await Contribution.deleteOne({
    _id: contribution._id,
    department: user.department,
  });

  return {
    message: 'Contribution record deleted successfully',
    contributionId: contribution._id,
  };
}
