import { Member } from '../models/Member.js';
import { Unit } from '../models/Unit.js';

function buildMemberScope(user) {
  const scope = {
    department: user.department,
  };

  // Unit admins can only access members in their own unit
  if (user.role === 'unit_admin') {
    scope.unit = user.unit;
  }

  return scope;
}

export async function getMembers({ user, search = '' }) {
  const query = buildMemberScope(user);

  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');

    query.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { phoneNumber: searchRegex },
      { whatsappNumber: searchRegex },
    ];
  }

  const members = await Member.find(query)
    .populate('department', 'name')
    .populate('unit', 'name')
    .populate({
      path: 'unitHistory.unit',
      select: 'name',
    })
    .populate({
      path: 'unitHistory.movedBy',
      select: 'name',
    })
    .sort({ fullName: 1 })
    .lean();

  return members;
}

export async function getMemberById(memberId, user) {
  const query = {
    _id: memberId,
    ...buildMemberScope(user),
  };

  const member = await Member.findOne(query)
    .populate('department', 'name')
    .populate('unit', 'name')
    .populate({
      path: 'unitHistory.unit',
      select: 'name',
    })
    .populate({
      path: 'unitHistory.movedBy',
      select: 'name',
    })
    .lean();

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}

export async function updateMember(memberId, user, updates) {
  const query = {
    _id: memberId,
    ...buildMemberScope(user),
  };

  const allowedFields = [
    'fullName',
    'dateOfBirth',
    'gender',
    'maritalStatus',
    'photoUrl',
    'phoneNumber',
    'whatsappNumber',
    'email',
    'address',
    'occupation',
    'roleInUnit',
    'dateJoinedDepartment',
  ];

  const filteredUpdates = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const member = await Member.findOneAndUpdate(
    query,
    {
      $set: filteredUpdates,
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate('department', 'name')
    .populate('unit', 'name')
    .populate({
      path: 'unitHistory.unit',
      select: 'name',
    })
    .populate({
      path: 'unitHistory.movedBy',
      select: 'name',
    });

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}

export async function changeMemberStatus(memberId, user, status) {
  if (!['active', 'inactive'].includes(status)) {
    throw new Error('Invalid member status');
  }

  const query = {
    _id: memberId,
    ...buildMemberScope(user),
  };

  const member = await Member.findOneAndUpdate(
    query,
    {
      $set: {
        status,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .populate('department', 'name')
    .populate('unit', 'name');

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}

export async function changeMemberUnit(memberId, user, newUnitId, note) {
  if (!newUnitId) {
    throw new Error('Unit is required');
  }

  // Only main admins should be able to move members
  if (user.role !== 'main_admin') {
    throw new Error("Only main admins can change a member's unit");
  }

  const member = await Member.findOne({
    _id: memberId,
    department: user.department,
  });

  if (!member) {
    throw new Error('Member not found');
  }

  const newUnit = await Unit.findOne({
    _id: newUnitId,
    department: user.department,
  });

  if (!newUnit) {
    throw new Error('Unit not found');
  }

  if (member.unit?.toString() === newUnitId.toString()) {
    throw new Error('Member is already assigned to this unit');
  }

  member.unit = newUnitId;

  member.unitHistory.push({
    unit: newUnitId,
    movedAt: new Date(),
    movedBy: user._id,
    note: note?.trim() || undefined,
  });

  await member.save();

  await member.populate('department', 'name');
  await member.populate('unit', 'name');
  await member.populate({
    path: 'unitHistory.unit',
    select: 'name',
  });
  await member.populate({
    path: 'unitHistory.movedBy',
    select: 'name',
  });

  return member;
}

export async function deleteMember(memberId, user) {
  const query = {
    _id: memberId,
    ...buildMemberScope(user),
  };

  const member = await Member.findOneAndDelete(query);

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}

const SELF_EDITABLE_FIELDS = [
  'fullName',
  'dateOfBirth',
  'gender',
  'maritalStatus',
  'phoneNumber',
  'whatsappNumber',
  'email',
  'address',
  'occupation',
  // Deliberately excludes: roleInUnit, dateJoinedDepartment, status, role,
  // unit, department, photoUrl (photoUrl already goes through the
  // dedicated /members/:id/photo upload endpoint) — those stay admin-only.
];

export async function updateOwnProfile(user, updates) {
  const filteredUpdates = {};
  for (const field of SELF_EDITABLE_FIELDS) {
    if (updates[field] !== undefined) {
      filteredUpdates[field] = updates[field];
    }
  }

  const member = await Member.findByIdAndUpdate(
    user._id,
    { $set: filteredUpdates },
    { new: true, runValidators: true },
  )
    .populate('department', 'name')
    .populate('unit', 'name');

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}

export async function getOwnProfile(user) {
  const member = await Member.findById(user._id)
    .populate('department', 'name')
    .populate('unit', 'name');

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}
