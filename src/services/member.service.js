import { Member } from '../models/Member.js';

export async function getMembers({ departmentId, search = '' }) {
  const query = {
    department: departmentId,
  };

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
      select: 'fullName',
    })
    .sort({ fullName: 1 })
    .lean();

  return members;
}

export async function getMemberById(memberId, departmentId) {
  const member = await Member.findOne({
    _id: memberId,
    department: departmentId,
  })
    .populate('department', 'name')
    .populate('unit', 'name')
    .populate({
      path: 'unitHistory.unit',
      select: 'name',
    })
    .populate({
      path: 'unitHistory.movedBy',
      select: 'fullName',
    })
    .lean();

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}

export async function updateMember(memberId, departmentId, updates) {
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
    {
      _id: memberId,
      department: departmentId,
    },
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
      select: 'fullName',
    });

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}

export async function changeMemberStatus(memberId, departmentId, status) {
  if (!['active', 'inactive'].includes(status)) {
    throw new Error('Invalid member status');
  }

  const member = await Member.findOneAndUpdate(
    {
      _id: memberId,
      department: departmentId,
    },
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

export async function changeMemberUnit(
  memberId,
  departmentId,
  newUnitId,
  movedBy,
  note,
) {
  const member = await Member.findOne({
    _id: memberId,
    department: departmentId,
  });

  if (!member) {
    throw new Error('Member not found');
  }

  if (member.unit?.toString() === newUnitId) {
    throw new Error('Member is already assigned to this unit');
  }

  member.unit = newUnitId;

  member.unitHistory.push({
    unit: newUnitId,
    movedAt: new Date(),
    movedBy,
    note: note || undefined,
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
    select: 'fullName',
  });

  return member;
}

export async function deleteMember(memberId, departmentId) {
  const member = await Member.findOneAndDelete({
    _id: memberId,
    department: departmentId,
  });

  if (!member) {
    throw new Error('Member not found');
  }

  return member;
}
