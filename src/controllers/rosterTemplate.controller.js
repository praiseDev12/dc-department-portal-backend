import { Member } from '../models/Member.js';
import { Unit } from '../models/Unit.js';
import mongoose from 'mongoose';
import { RosterTemplate } from '../models/RosterTemplate.js';
import { MonthlyRoster } from '../models/MonthlyRoster.js';
import { RosterEvent } from '../models/RosterEvent.js';

export const createRosterTemplate = async (req, res) => {
  try {
    const user = req.user;
    const { name, description = '', duties, settings = {} } = req.body;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!name?.trim() || !Array.isArray(duties) || !duties.length) {
      return res.status(400).json({
        success: false,
        message: 'A template name and at least one duty are required.',
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
        message: 'Only authorised administrators can create roster templates.',
      });
    }

    if (!member.unit || !member.department) {
      return res.status(400).json({
        success: false,
        message: 'Your account must be assigned to a department and unit.',
      });
    }

    const unit = await Unit.findOne({
      _id: member.unit,
      department: member.department,
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Your unit was not found in your department.',
      });
    }

    // Validate duty fields before saving.
    for (const [index, duty] of duties.entries()) {
      if (
        !duty.name?.trim() ||
        !Number.isInteger(duty.dayOfWeek) ||
        duty.dayOfWeek < 0 ||
        duty.dayOfWeek > 6 ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(duty.startTime || '') ||
        !Number.isInteger(duty.membersNeeded) ||
        duty.membersNeeded < 1
      ) {
        return res.status(400).json({
          success: false,
          message: `Duty ${index + 1} has invalid required fields.`,
        });
      }

      if (duty.endTime) {
        const [startHours, startMinutes] = duty.startTime
          .split(':')
          .map(Number);
        const [endHours, endMinutes] = duty.endTime.split(':').map(Number);

        if (
          !/^([01]\d|2[0-3]):[0-5]\d$/.test(duty.endTime) ||
          endHours * 60 + endMinutes <= startHours * 60 + startMinutes
        ) {
          return res.status(400).json({
            success: false,
            message: `Duty ${index + 1} must have an end time after its start time.`,
          });
        }
      }

      if (duty.rolesEnabled && Array.isArray(duty.roles)) {
        const roleNames = duty.roles.map((role) => role.name?.trim());

        if (roleNames.some((roleName) => !roleName)) {
          return res.status(400).json({
            success: false,
            message: `Every role in duty ${index + 1} must have a name.`,
          });
        }

        if (duty.roles.length > duty.membersNeeded) {
          return res.status(400).json({
            success: false,
            message: `Duty ${index + 1} cannot have more roles than required members.`,
          });
        }
      }
    }

    const template = await RosterTemplate.create({
      department: member.department,
      unit: member.unit,
      name: name.trim(),
      description,
      duties,
      settings: {
        avoidOverlappingAssignments:
          settings.avoidOverlappingAssignments !== false,
        balanceAssignments: settings.balanceAssignments !== false,
        rotateRoles: settings.rotateRoles !== false,
      },
      createdBy: member._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Roster template created successfully.',
      template,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A template with this name already exists in your unit.',
      });
    }

    console.error('Create roster template error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create the roster template.',
    });
  }
};

export const updateRosterTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const { name, description, duties, settings } = req.body;

    if (!templateId) {
      return res.status(400).json({
        message: 'Template ID is required.',
      });
    }

    if (!name?.trim()) {
      return res.status(400).json({
        message: 'Roster name is required.',
      });
    }

    if (!Array.isArray(duties) || duties.length === 0) {
      return res.status(400).json({
        message: 'A roster must contain at least one duty.',
      });
    }

    for (let index = 0; index < duties.length; index += 1) {
      const duty = duties[index];

      if (!duty.name?.trim()) {
        return res.status(400).json({
          message: `Duty ${index + 1} must have a name.`,
        });
      }

      if (
        typeof duty.dayOfWeek !== 'number' ||
        duty.dayOfWeek < 0 ||
        duty.dayOfWeek > 6
      ) {
        return res.status(400).json({
          message: `Duty ${index + 1} has an invalid day.`,
        });
      }

      if (!duty.startTime) {
        return res.status(400).json({
          message: `Duty ${index + 1} must have a start time.`,
        });
      }

      if (duty.endTime && duty.endTime <= duty.startTime) {
        return res.status(400).json({
          message: `Duty ${index + 1} must end after it starts.`,
        });
      }

      if (Number(duty.membersNeeded) < 1) {
        return res.status(400).json({
          message: `Duty ${index + 1} must require at least one member.`,
        });
      }

      if (duty.rolesEnabled) {
        if (!Array.isArray(duty.roles)) {
          return res.status(400).json({
            message: `Duty ${index + 1} has invalid roles.`,
          });
        }

        const hasEmptyRole = duty.roles.some((role) => !role?.name?.trim());

        if (hasEmptyRole) {
          return res.status(400).json({
            message: `Duty ${index + 1} contains an empty role.`,
          });
        }
      }
    }

    const template = await RosterTemplate.findOne({
      _id: templateId,
      department: req.user.department,
      unit: req.user.unit,
    });

    if (!template) {
      return res.status(404).json({
        message: 'Roster template not found.',
      });
    }

    template.name = name.trim();
    template.description = description?.trim() || '';

    template.duties = duties.map((duty) => ({
      ...(duty._id ? { _id: duty._id } : {}),
      name: duty.name.trim(),
      dayOfWeek: Number(duty.dayOfWeek),
      startTime: duty.startTime,
      endTime: duty.endTime || null,
      membersNeeded: Number(duty.membersNeeded),
      rolesEnabled: Boolean(duty.rolesEnabled),
      roles: duty.rolesEnabled
        ? (duty.roles || []).map((role, index) => ({
            ...(role._id ? { _id: role._id } : {}),
            name: role.name.trim(),
            order: index,
          }))
        : [],
      location: duty.location?.trim() || '',
      active: duty.active !== false,
    }));

    if (settings) {
      template.settings = {
        avoidOverlappingAssignments:
          settings.avoidOverlappingAssignments !== false,
        balanceAssignments: settings.balanceAssignments !== false,
        rotateRoles: settings.rotateRoles !== false,
      };
    }

    await template.save();

    return res.status(200).json({
      success: true,
      message: 'Roster template updated successfully.',
      template,
    });
  } catch (error) {
    console.error('Update roster template error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A roster with this name already exists in this unit.',
      });
    }

    return res.status(500).json({
      message: 'Failed to update roster template.',
    });
  }
};

export const deleteRosterTemplate = async (req, res) => {
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
        message: 'Only authorised administrators can delete roster templates.',
      });
    }

    const template = await RosterTemplate.findOne({
      _id: templateId,
      department: member.department,
      unit: member.unit,
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Roster template not found.',
      });
    }

    const existingRoster = await MonthlyRoster.findOne({
      template: template._id,
    }).select('_id status month');

    if (existingRoster) {
      return res.status(409).json({
        success: false,
        message:
          'This roster template cannot be deleted because monthly rosters already exist for it.',
      });
    }

    const existingEvent = await RosterEvent.findOne({
      template: template._id,
    }).select('_id');

    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message:
          'This roster template cannot be deleted because programs are linked to it.',
      });
    }

    await template.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Roster template deleted successfully.',
    });
  } catch (error) {
    console.error('Delete roster template error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete the roster template.',
    });
  }
};
