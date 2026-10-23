import mongoose from 'mongoose';

import { Member } from '../models/Member.js';
import { RosterTemplate } from '../models/RosterTemplate.js';
import { RosterEvent } from '../models/RosterEvent.js';
import { syncDraftRostersForEvent } from '../services/rosterDraftSync.service.js';

const isValidDate = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTime = (value) =>
  typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const timeToMinutes = (value) => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

export const createRosterEvent = async (req, res) => {
  try {
    const user = req.user;

    const {
      templateId,
      name,
      description = '',
      startDate,
      endDate,
      startTime,
      endTime = null,
      location = '',
      membersNeeded,
      rolesEnabled = true,
      roles = [],
    } = req.body;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!mongoose.isValidObjectId(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid templateId.',
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required.',
      });
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate must use YYYY-MM-DD.',
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'endDate cannot be before startDate.',
      });
    }

    if (!isValidTime(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'startTime must use HH:mm.',
      });
    }

    if (endTime !== null && !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'endTime must use HH:mm.',
      });
    }

    if (
      endTime !== null &&
      timeToMinutes(endTime) <= timeToMinutes(startTime)
    ) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be after startTime.',
      });
    }

    if (!Number.isInteger(membersNeeded) || membersNeeded < 1) {
      return res.status(400).json({
        success: false,
        message: 'membersNeeded must be at least 1.',
      });
    }

    if (rolesEnabled && !Array.isArray(roles)) {
      return res.status(400).json({
        success: false,
        message: 'roles must be an array when roles are enabled.',
      });
    }

    if (rolesEnabled && roles.length > membersNeeded) {
      return res.status(400).json({
        success: false,
        message: 'You cannot have more roles than required members.',
      });
    }

    if (rolesEnabled) {
      for (const [index, role] of roles.entries()) {
        if (!role?.name?.trim()) {
          return res.status(400).json({
            success: false,
            message: `Role ${index + 1} must have a name.`,
          });
        }
      }
    }

    const member = await Member.findById(user._id).select(
      '_id department unit role status',
    );

    if (!member || member.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active.',
      });
    }

    if (!['unit_admin', 'main_admin'].includes(member.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only authorised administrators can create roster events.',
      });
    }

    const template = await RosterTemplate.findOne({
      _id: templateId,
      department: member.department,
      unit: member.unit,
      active: true,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Active roster template not found for your unit.',
      });
    }

    const event = await RosterEvent.create({
      department: member.department,
      unit: member.unit,
      template: template._id,
      name: name.trim(),
      description: description.trim(),
      startDate,
      endDate,
      startTime,
      endTime,
      location: location.trim(),
      membersNeeded,
      rolesEnabled,
      roles: rolesEnabled
        ? roles.map((role, index) => ({
            name: role.name.trim(),
            order: Number.isInteger(role.order) ? role.order : index,
          }))
        : [],
      createdBy: member._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Roster event created successfully.',
      event,
    });
  } catch (error) {
    console.error('Create roster event error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create the roster event.',
    });
  }
};

export const getRosterEvents = async (req, res) => {
  try {
    const user = req.user;
    const { templateId } = req.params;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!mongoose.isValidObjectId(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid templateId.',
      });
    }

    const member = await Member.findById(user._id).select(
      '_id department unit role status',
    );

    if (!member || member.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active.',
      });
    }

    if (!['unit_admin', 'main_admin'].includes(member.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only authorised administrators can view roster events.',
      });
    }

    const template = await RosterTemplate.findOne({
      _id: templateId,
      department: member.department,
      unit: member.unit,
      active: true,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Active roster template not found for your unit.',
      });
    }

    const events = await RosterEvent.find({
      department: member.department,
      unit: member.unit,
      template: template._id,
      active: true,
    }).sort({
      startDate: 1,
      startTime: 1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Get roster events error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch roster events.',
    });
  }
};

export const updateRosterEvent = async (req, res) => {
  try {
    const user = req.user;
    const { eventId } = req.params;

    const {
      name,
      description = '',
      startDate,
      endDate,
      startTime,
      endTime = null,
      location = '',
      membersNeeded,
      rolesEnabled = true,
      roles = [],
    } = req.body;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid eventId.',
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Event name is required.',
      });
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate must use YYYY-MM-DD.',
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: 'endDate cannot be before startDate.',
      });
    }

    if (!isValidTime(startTime)) {
      return res.status(400).json({
        success: false,
        message: 'startTime must use HH:mm.',
      });
    }

    if (endTime !== null && !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: 'endTime must use HH:mm.',
      });
    }

    if (
      endTime !== null &&
      timeToMinutes(endTime) <= timeToMinutes(startTime)
    ) {
      return res.status(400).json({
        success: false,
        message: 'endTime must be after startTime.',
      });
    }

    if (!Number.isInteger(membersNeeded) || membersNeeded < 1) {
      return res.status(400).json({
        success: false,
        message: 'membersNeeded must be at least 1.',
      });
    }

    if (rolesEnabled && !Array.isArray(roles)) {
      return res.status(400).json({
        success: false,
        message: 'roles must be an array when roles are enabled.',
      });
    }

    if (rolesEnabled && roles.length > membersNeeded) {
      return res.status(400).json({
        success: false,
        message: 'You cannot have more roles than required members.',
      });
    }

    if (rolesEnabled) {
      for (const [index, role] of roles.entries()) {
        if (!role?.name?.trim()) {
          return res.status(400).json({
            success: false,
            message: `Role ${index + 1} must have a name.`,
          });
        }
      }
    }

    const member = await Member.findById(user._id).select(
      '_id department unit role status',
    );

    if (!member || member.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active.',
      });
    }

    if (!['unit_admin', 'main_admin'].includes(member.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only authorised administrators can update roster events.',
      });
    }

    const event = await RosterEvent.findOne({
      _id: eventId,
      department: member.department,
      unit: member.unit,
      active: true,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Active roster event not found for your unit.',
      });
    }

    const oldEvent = {
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      name: event.name,
    };

    event.name = name.trim();
    event.description = description.trim();
    event.startDate = startDate;
    event.endDate = endDate;
    event.startTime = startTime;
    event.endTime = endTime;
    event.location = location.trim();
    event.membersNeeded = membersNeeded;
    event.rolesEnabled = rolesEnabled;
    event.roles = rolesEnabled
      ? roles.map((role, index) => ({
          name: role.name.trim(),
          order: Number.isInteger(role.order) ? role.order : index,
        }))
      : [];

    await event.save();

    await syncDraftRostersForEvent(event, oldEvent);

    return res.status(200).json({
      success: true,
      message: 'Roster event updated successfully.',
      event,
    });
  } catch (error) {
    console.error('Update roster event error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update the roster event.',
    });
  }
};

export const deactivateRosterEvent = async (req, res) => {
  try {
    const user = req.user;
    const { eventId } = req.params;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!mongoose.isValidObjectId(eventId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid eventId.',
      });
    }

    const member = await Member.findById(user._id).select(
      '_id department unit role status',
    );

    if (!member || member.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active.',
      });
    }

    if (!['unit_admin', 'main_admin'].includes(member.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only authorised administrators can deactivate roster events.',
      });
    }

    const event = await RosterEvent.findOne({
      _id: eventId,
      department: member.department,
      unit: member.unit,
      active: true,
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Active roster event not found for your unit.',
      });
    }

    event.active = false;

    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Roster event deactivated successfully.',
      event,
    });
  } catch (error) {
    console.error('Deactivate roster event error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate the roster event.',
    });
  }
};
