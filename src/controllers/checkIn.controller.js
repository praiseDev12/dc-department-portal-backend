import { asyncHandler } from '../utils/asyncHandler.js';
import * as checkInService from '../services/checkIn.service.js';

export const getServices = asyncHandler(async (req, res) => {
  const services = await checkInService.getServices({
    user: req.user,
  });

  res.json({ services });
});

export const createService = asyncHandler(async (req, res) => {
  const service = await checkInService.createService({
    user: req.user,
    ...req.body,
  });

  res.status(201).json({
    message: 'Service created successfully',
    service,
  });
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await checkInService.updateService({
    user: req.user,
    serviceId: req.params.serviceId,
    ...req.body,
  });

  res.json({
    message: 'Service updated successfully',
    service,
  });
});

export const deleteService = asyncHandler(async (req, res) => {
  await checkInService.deleteService({
    user: req.user,
    serviceId: req.params.serviceId,
  });

  res.json({
    message: 'Service deleted successfully',
  });
});

export const generateCheckInCode = asyncHandler(async (req, res) => {
  const session = await checkInService.generateCheckInCode({
    user: req.user,
    serviceId: req.params.serviceId,
  });

  res.json({
    session,
  });
});

export const getTodaySessions = asyncHandler(async (req, res) => {
  const sessions = await checkInService.getTodaySessions({
    user: req.user,
  });

  res.json({ sessions });
});

export const checkIn = asyncHandler(async (req, res) => {
  const attendance = await checkInService.checkIn({
    user: req.user,
    code: req.body.code,
  });

  res.status(201).json({
    message:
      attendance.status === 'late'
        ? 'Checked in late'
        : 'Checked in successfully',
    attendance,
  });
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  const attendance = await checkInService.getMyAttendance({
    user: req.user,
  });

  res.json({ attendance });
});

export const getLastServiceAttendance = asyncHandler(async (req, res) => {
  const breakdown = await checkInService.getLastServiceAttendance({
    user: req.user,
  });

  res.json(breakdown);
});
