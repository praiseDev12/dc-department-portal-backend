import { asyncHandler } from '../utils/asyncHandler.js';
import * as checkInService from '../services/checkIn.service.js';
import { Service } from '../models/Service.js';

export const getServices = asyncHandler(async (req, res) => {
  try {
    const services = await checkInService.getServices({
      user: req.user,
    });

    res.json({ services });
  } catch (err) {
    console.error('getServices error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to load services' });
  }
});

export const createService = asyncHandler(async (req, res) => {
  try {
    const service = await checkInService.createService({
      user: req.user,
      ...req.body,
    });

    res.status(201).json({
      message: 'Service created successfully',
      service,
    });
  } catch (err) {
    console.error('createService error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to create service' });
  }
});

export const updateService = asyncHandler(async (req, res) => {
  try {
    const service = await checkInService.updateService({
      user: req.user,
      serviceId: req.params.serviceId,
      ...req.body,
    });

    res.json({
      message: 'Service updated successfully',
      service,
    });
  } catch (err) {
    console.error('updateService error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to update service' });
  }
});

export const deleteService = asyncHandler(async (req, res) => {
  try {
    const service = await checkInService.deleteService({
      user: req.user,
      serviceId: req.params.serviceId,
    });

    res.json({
      message: 'Service deactivated successfully',
      service,
    });
  } catch (err) {
    console.error('deleteService error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to deactivate service' });
  }
});

export const activateService = asyncHandler(async (req, res) => {
  try {
    const service = await checkInService.activateService({
      user: req.user,
      serviceId: req.params.serviceId,
    });

    res.json({
      message: 'Service activated successfully',
      service,
    });
  } catch (err) {
    console.error('activateService error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to activate service' });
  }
});

export const generateCheckInCode = asyncHandler(async (req, res) => {
  try {
    const session = await checkInService.generateCheckInCode({
      user: req.user,
      serviceId: req.params.serviceId,
    });

    res.json({
      session,
    });
  } catch (err) {
    console.error('generateCheckInCode error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to generate check-in code' });
  }
});

export const getTodaySessions = asyncHandler(async (req, res) => {
  try {
    const sessions = await checkInService.getTodaySessions({
      user: req.user,
    });

    res.json({ sessions });
  } catch (err) {
    console.error('getTodaySessions error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || "Failed to load today's sessions" });
  }
});

export const checkIn = asyncHandler(async (req, res) => {
  try {
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
  } catch (err) {
    console.error('checkIn error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to check in' });
  }
});

export const getMyAttendance = asyncHandler(async (req, res) => {
  try {
    const attendance = await checkInService.getMyAttendance({
      user: req.user,
    });

    res.json({ attendance });
  } catch (err) {
    console.error('getMyAttendance error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to load your attendance' });
  }
});

export const getLastServiceAttendance = asyncHandler(async (req, res) => {
  try {
    const breakdown = await checkInService.getLastServiceAttendance({
      user: req.user,
    });

    res.json(breakdown);
  } catch (err) {
    console.error('getLastServiceAttendance error:', err);
    res
      .status(err.statusCode || err.status || 500)
      .json({ message: err.message || 'Failed to load attendance breakdown' });
  }
});
