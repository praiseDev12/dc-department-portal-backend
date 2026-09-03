import crypto from 'crypto';

import { Service } from '../models/Service.js';
import { CheckInSession } from '../models/CheckInSession.js';
import { Attendance } from '../models/Attendance.js';
import { Member } from '../models/Member.js';
import { AppError } from '../utils/errors.js';
import {
  getLagosDateParts,
  lagosDateTimeToUtc,
  addMinutes,
} from '../utils/lagosTime.js';

function ensureDepartment(user) {
  if (!user?.department) {
    throw new AppError('Department not found', 400);
  }
}

function generateCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function getServices({ user }) {
  ensureDepartment(user);

  return Service.find({
    department: user.department,
    active: true,
  })
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean();
}

export async function createService({
  user,
  name,
  dayOfWeek,
  startTime,
  openBeforeMinutes = 60,
  closeAfterMinutes = 60,
  graceMinutes = 15,
}) {
  ensureDepartment(user);

  if (user.role !== 'main_admin') {
    throw new AppError('Only main admins can create services', 403);
  }

  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AppError('Service name is required', 400);
  }

  if (
    !Number.isInteger(Number(dayOfWeek)) ||
    Number(dayOfWeek) < 0 ||
    Number(dayOfWeek) > 6
  ) {
    throw new AppError('Invalid day of week', 400);
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    throw new AppError('Invalid start time', 400);
  }

  const service = await Service.create({
    department: user.department,
    name: name.trim(),
    dayOfWeek: Number(dayOfWeek),
    startTime,
    openBeforeMinutes: Number(openBeforeMinutes),
    closeAfterMinutes: Number(closeAfterMinutes),
    graceMinutes: Number(graceMinutes),
  });

  return service;
}

export async function updateService({
  user,
  serviceId,
  name,
  dayOfWeek,
  startTime,
  openBeforeMinutes,
  closeAfterMinutes,
  graceMinutes,
}) {
  ensureDepartment(user);

  if (user.role !== 'main_admin') {
    throw new AppError('Only main admins can edit services', 403);
  }

  const service = await Service.findOne({
    _id: serviceId,
    department: user.department,
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) {
      throw new AppError('Service name is required', 400);
    }

    service.name = name.trim();
  }

  if (dayOfWeek !== undefined) {
    const day = Number(dayOfWeek);

    if (!Number.isInteger(day) || day < 0 || day > 6) {
      throw new AppError('Invalid day of week', 400);
    }

    service.dayOfWeek = day;
  }

  if (startTime !== undefined) {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
      throw new AppError('Invalid start time', 400);
    }

    service.startTime = startTime;
  }

  if (openBeforeMinutes !== undefined) {
    service.openBeforeMinutes = Number(openBeforeMinutes);
  }

  if (closeAfterMinutes !== undefined) {
    service.closeAfterMinutes = Number(closeAfterMinutes);
  }

  if (graceMinutes !== undefined) {
    service.graceMinutes = Number(graceMinutes);
  }

  await service.save();

  return service;
}

export async function deleteService({ user, serviceId }) {
  ensureDepartment(user);

  if (user.role !== 'main_admin') {
    throw new AppError('Only main admins can delete services', 403);
  }

  const service = await Service.findOneAndDelete({
    _id: serviceId,
    department: user.department,
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  return service;
}

export async function generateCheckInCode({ user, serviceId }) {
  ensureDepartment(user);

  const service = await Service.findOne({
    _id: serviceId,
    department: user.department,
    active: true,
  });

  if (!service) {
    throw new AppError('Service not found', 404);
  }

  const today = getLagosDateParts();

  if (today.weekday !== service.dayOfWeek) {
    throw new AppError('This service is not scheduled for today', 400);
  }

  const existing = await CheckInSession.findOne({
    service: service._id,
    serviceDate: today.dateString,
  });

  if (existing) {
    return existing;
  }

  const scheduledStart = lagosDateTimeToUtc(
    today.dateString,
    service.startTime,
  );

  const opensAt = addMinutes(scheduledStart, -service.openBeforeMinutes);

  const closesAt = addMinutes(scheduledStart, service.closeAfterMinutes);

  const graceEndsAt = addMinutes(scheduledStart, service.graceMinutes);

  try {
    return await CheckInSession.create({
      service: service._id,
      department: user.department,
      serviceDate: today.dateString,
      code: generateCode(),
      scheduledStart,
      opensAt,
      closesAt,
      graceEndsAt,
      active: true,
    });
  } catch (error) {
    // Another admin may have generated it at exactly the same time.
    if (error.code === 11000) {
      return CheckInSession.findOne({
        service: service._id,
        serviceDate: today.dateString,
      });
    }

    throw error;
  }
}

export async function getTodaySessions({ user }) {
  ensureDepartment(user);

  const today = getLagosDateParts();

  return CheckInSession.find({
    department: user.department,
    serviceDate: today.dateString,
  })
    .populate('service', 'name dayOfWeek startTime')
    .sort({ scheduledStart: 1 })
    .lean();
}

export async function checkIn({ user, code }) {
  ensureDepartment(user);

  if (!code || typeof code !== 'string') {
    throw new AppError('Check-in code is required', 400);
  }

  const now = new Date();

  const session = await CheckInSession.findOne({
    code: code.trim(),
    department: user.department,
    active: true,
  }).populate('service', 'name');

  if (!session) {
    throw new AppError('Invalid check-in code', 400);
  }

  if (now < session.opensAt) {
    throw new AppError('Check-in has not opened yet', 400);
  }

  if (now > session.closesAt) {
    throw new AppError('Check-in has closed', 400);
  }

  const status = now <= session.graceEndsAt ? 'on_time' : 'late';

  try {
    const attendance = await Attendance.create({
      session: session._id,
      service: session.service._id,
      department: user.department,
      member: user._id,
      unit: user.unit,
      status,
      checkedInAt: now,
    });

    return attendance;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError('You have already checked in for this service', 409);
    }

    throw error;
  }
}

export async function getMyAttendance({ user }) {
  ensureDepartment(user);

  return Attendance.find({
    member: user._id,
    department: user.department,
  })
    .populate('service', 'name dayOfWeek startTime')
    .populate('unit', 'name')
    .sort({ checkedInAt: -1 })
    .lean();
}
