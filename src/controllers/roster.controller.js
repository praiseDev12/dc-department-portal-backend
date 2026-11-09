import mongoose from 'mongoose';

import { Member } from '../models/Member.js';
import { Unit } from '../models/Unit.js';
import { RosterTemplate } from '../models/RosterTemplate.js';
import { MonthlyRoster } from '../models/MonthlyRoster.js';
import { RosterEvent } from '../models/RosterEvent.js';
import { generateRosterOccurrences } from '../services/rosterGenerator.service.js';

export const generateMonthlyRoster = async (req, res) => {
  try {
    const { templateId, month } = req.body;
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!templateId || !mongoose.isValidObjectId(templateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing templateId.',
        receivedTemplateId: templateId ?? null,
      });
    }

    if (typeof month !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing month. Use YYYY-MM, e.g. 2026-10.',
        receivedMonth: month ?? null,
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
        message: 'Only authorised administrators can generate rosters.',
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

    // Do not regenerate an existing roster automatically.
    const existingRoster = await MonthlyRoster.findOne({
      unit: member.unit,
      template: template._id,
      month,
    });

    if (existingRoster) {
      return res.status(409).json({
        success: false,
        message:
          'A roster already exists for this template and month. ' +
          'Open the existing roster instead of generating another.',
        rosterId: existingRoster._id,
        status: existingRoster.status,
      });
    }

    const unit = await Unit.findOne({
      _id: member.unit,
      department: member.department,
    });

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found in your department.',
      });
    }

    const previousRoster = await MonthlyRoster.findOne({
      department: member.department,
      unit: member.unit,
      template: template._id,
      month: { $lt: month },
    })
      .sort({ month: -1 })
      .select('occurrences')
      .lean();

    const generated = await generateRosterOccurrences({
      template,
      month,
      departmentId: member.department,
      unitId: member.unit,
      existingOccurrences: previousRoster?.occurrences || [],
    });

    const roster = await MonthlyRoster.create({
      department: member.department,
      unit: member.unit,
      template: template._id,
      name: template.name,
      month: generated.month,
      timezone: generated.timezone,
      occurrences: generated.occurrences,
      status: 'draft',
      generatedAt: generated.generatedAt,
    });

    return res.status(201).json({
      success: true,
      message: 'Monthly roster generated as a draft.',
      roster,
    });
  } catch (error) {
    // Handle duplicate-key races if two admins generate simultaneously.
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A roster already exists for this template and month.',
      });
    }

    console.error('Generate monthly roster error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to generate the monthly roster.',
    });
  }
};

export const getMonthlyRoster = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!mongoose.isValidObjectId(rosterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rosterId.',
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
        message: 'Only authorised administrators can view rosters.',
      });
    }

    const roster = await MonthlyRoster.findOne({
      _id: rosterId,
      department: member.department,
      unit: member.unit,
    })
      .populate('occurrences.assignments.member', '_id fullName email')
      .populate('publishedBy', '_id fullName')
      .lean();

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Roster not found for your unit.',
      });
    }

    return res.status(200).json({
      success: true,
      roster,
    });
  } catch (error) {
    console.error('Get monthly roster error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve the monthly roster.',
    });
  }
};

export const updateRosterAssignment = async (req, res) => {
  try {
    const { rosterId, occurrenceId, assignmentId } = req.params;
    const { memberId, roleId = null, roleName = '' } = req.body;
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (
      !mongoose.isValidObjectId(rosterId) ||
      !mongoose.isValidObjectId(occurrenceId) ||
      !mongoose.isValidObjectId(assignmentId) ||
      !mongoose.isValidObjectId(memberId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roster, occurrence, assignment, or member ID.',
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
        message: 'Only authorised administrators can edit rosters.',
      });
    }

    const roster = await MonthlyRoster.findOne({
      _id: rosterId,
      department: member.department,
      unit: member.unit,
    });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Roster not found for your unit.',
      });
    }

    if (roster.status !== 'draft') {
      return res.status(409).json({
        success: false,
        message: 'Only draft rosters can be edited.',
      });
    }

    const occurrence = roster.occurrences.id(occurrenceId);

    if (!occurrence) {
      return res.status(404).json({
        success: false,
        message: 'Roster occurrence not found.',
      });
    }

    const assignment = occurrence.assignments.id(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Roster assignment not found.',
      });
    }

    const replacementMember = await Member.findOne({
      _id: memberId,
      department: member.department,
      unit: member.unit,
      status: 'active',
    }).select('_id fullName email');

    if (!replacementMember) {
      return res.status(400).json({
        success: false,
        message: 'The selected member is not an active member of your unit.',
      });
    }

    const alreadyAssigned = occurrence.assignments.some(
      (item) =>
        String(item._id) !== String(assignmentId) &&
        String(item.member) === String(memberId),
    );

    if (alreadyAssigned) {
      return res.status(409).json({
        success: false,
        message: 'This member is already assigned to this occurrence.',
      });
    }

    const previousMemberId = assignment.member;

    assignment.member = replacementMember._id;
    assignment.roleId = roleId;
    assignment.roleName = typeof roleName === 'string' ? roleName.trim() : '';
    assignment.manuallyAssigned = true;
    assignment.replacedMember = previousMemberId;
    assignment.notificationStatus = {
      dayBefore: 'pending',
      sameDay: 'pending',
    };
    assignment.dayBeforeSentAt = null;
    assignment.sameDaySentAt = null;

    const assignedCount = occurrence.assignments.length;

    occurrence.shortageCount = Math.max(
      0,
      occurrence.membersNeeded - assignedCount,
    );

    occurrence.needsAttention = occurrence.shortageCount > 0;

    roster.revision += 1;

    await roster.save();

    const updatedRoster = await MonthlyRoster.findById(roster._id)
      .populate('occurrences.assignments.member', '_id fullName email')
      .populate('publishedBy', '_id fullName')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Roster assignment updated successfully.',
      roster: updatedRoster,
    });
  } catch (error) {
    console.error('Update roster assignment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update the roster assignment.',
    });
  }
};

export const addRosterAssignment = async (req, res) => {
  try {
    const { rosterId, occurrenceId } = req.params;
    const { memberId, roleId = null, roleName = '' } = req.body;
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (
      !mongoose.isValidObjectId(rosterId) ||
      !mongoose.isValidObjectId(occurrenceId) ||
      !mongoose.isValidObjectId(memberId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roster, occurrence, or member ID.',
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
        message: 'Only authorised administrators can edit rosters.',
      });
    }

    const roster = await MonthlyRoster.findOne({
      _id: rosterId,
      department: member.department,
      unit: member.unit,
    });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Roster not found for your unit.',
      });
    }

    if (roster.status !== 'draft') {
      return res.status(409).json({
        success: false,
        message: 'Only draft rosters can be edited.',
      });
    }

    const occurrence = roster.occurrences.id(occurrenceId);

    if (!occurrence) {
      return res.status(404).json({
        success: false,
        message: 'Roster occurrence not found.',
      });
    }

    if (occurrence.assignments.length >= occurrence.membersNeeded) {
      return res.status(409).json({
        success: false,
        message: 'This occurrence already has all required assignments.',
      });
    }

    const selectedMember = await Member.findOne({
      _id: memberId,
      department: member.department,
      unit: member.unit,
      status: 'active',
    }).select('_id fullName email');

    if (!selectedMember) {
      return res.status(400).json({
        success: false,
        message: 'The selected member is not an active member of your unit.',
      });
    }

    const alreadyAssigned = occurrence.assignments.some(
      (assignment) => String(assignment.member) === String(memberId),
    );

    if (alreadyAssigned) {
      return res.status(409).json({
        success: false,
        message: 'This member is already assigned to this occurrence.',
      });
    }

    occurrence.assignments.push({
      member: selectedMember._id,
      roleId,
      roleName: typeof roleName === 'string' ? roleName.trim() : '',
      manuallyAssigned: true,
      replacedMember: null,
      notificationStatus: {
        dayBefore: 'pending',
        sameDay: 'pending',
      },
      dayBeforeSentAt: null,
      sameDaySentAt: null,
    });

    const assignedCount = occurrence.assignments.length;

    occurrence.shortageCount = Math.max(
      0,
      occurrence.membersNeeded - assignedCount,
    );

    occurrence.needsAttention = occurrence.shortageCount > 0;

    roster.revision += 1;

    await roster.save();

    const updatedRoster = await MonthlyRoster.findById(roster._id)
      .populate('occurrences.assignments.member', '_id fullName email')
      .populate('publishedBy', '_id fullName')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Roster assignment added successfully.',
      roster: updatedRoster,
    });
  } catch (error) {
    console.error('Add roster assignment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to add the roster assignment.',
    });
  }
};

export const removeRosterAssignment = async (req, res) => {
  try {
    const { rosterId, occurrenceId, assignmentId } = req.params;

    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (
      !mongoose.isValidObjectId(rosterId) ||
      !mongoose.isValidObjectId(occurrenceId) ||
      !mongoose.isValidObjectId(assignmentId)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roster, occurrence, or assignment ID.',
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
        message: 'Only authorised administrators can edit rosters.',
      });
    }

    const roster = await MonthlyRoster.findOne({
      _id: rosterId,
      department: member.department,
      unit: member.unit,
    });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Roster not found for your unit.',
      });
    }

    if (roster.status !== 'draft') {
      return res.status(409).json({
        success: false,
        message: 'Only draft rosters can be edited.',
      });
    }

    const occurrence = roster.occurrences.id(occurrenceId);

    if (!occurrence) {
      return res.status(404).json({
        success: false,
        message: 'Roster occurrence not found.',
      });
    }

    const assignment = occurrence.assignments.id(assignmentId);

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Roster assignment not found.',
      });
    }

    assignment.deleteOne();

    occurrence.shortageCount = Math.max(
      0,
      occurrence.membersNeeded - occurrence.assignments.length,
    );

    occurrence.needsAttention = occurrence.shortageCount > 0;

    roster.revision += 1;

    await roster.save();

    const updatedRoster = await MonthlyRoster.findById(roster._id)
      .populate('occurrences.assignments.member', '_id fullName email')
      .populate('publishedBy', '_id fullName')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Roster assignment removed successfully.',
      roster: updatedRoster,
    });
  } catch (error) {
    console.error('Remove roster assignment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to remove the roster assignment.',
    });
  }
};

export const publishMonthlyRoster = async (req, res) => {
  try {
    const { rosterId } = req.params;
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!mongoose.isValidObjectId(rosterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rosterId.',
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
        message: 'Only authorised administrators can publish rosters.',
      });
    }

    const roster = await MonthlyRoster.findOne({
      _id: rosterId,
      department: member.department,
      unit: member.unit,
    });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Roster not found for your unit.',
      });
    }

    if (roster.status === 'published') {
      return res.status(409).json({
        success: false,
        message: 'This roster has already been published.',
      });
    }

    if (roster.status === 'archived') {
      return res.status(409).json({
        success: false,
        message: 'Archived rosters cannot be published.',
      });
    }

    if (!roster.occurrences.length) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish a roster with no occurrences.',
      });
    }

    const occurrencesNeedingAttention = roster.occurrences.filter(
      (occurrence) =>
        occurrence.needsAttention ||
        occurrence.assignments.length < occurrence.membersNeeded,
    );

    if (occurrencesNeedingAttention.length) {
      return res.status(409).json({
        success: false,
        message:
          'This roster still has unfilled assignments. ' +
          'Resolve all shortages before publishing.',
        occurrencesNeedingAttention: occurrencesNeedingAttention.map(
          (occurrence) => ({
            occurrenceId: occurrence._id,
            eventName: occurrence.eventName,
            date: occurrence.date,
            membersNeeded: occurrence.membersNeeded,
            assigned: occurrence.assignments.length,
            shortageCount: occurrence.shortageCount,
          }),
        ),
      });
    }

    roster.status = 'published';
    roster.publishedAt = new Date();
    roster.publishedBy = member._id;
    roster.revision += 1;

    await roster.save();

    const publishedRoster = await MonthlyRoster.findById(roster._id)
      .populate('occurrences.assignments.member', '_id fullName email')
      .populate('publishedBy', '_id fullName')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Roster published successfully.',
      roster: publishedRoster,
    });
  } catch (error) {
    console.error('Publish monthly roster error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to publish the monthly roster.',
    });
  }
};

export const getRosterTemplates = async (req, res) => {
  try {
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
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
        message: 'Only authorised administrators can view roster templates.',
      });
    }

    const templates = await RosterTemplate.find({
      department: member.department,
      unit: member.unit,
      active: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Get roster templates error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch roster templates.',
    });
  }
};

export const getMonthlyRosterByTemplateMonth = async (req, res) => {
  try {
    const user = req.user;
    const { templateId, month } = req.params;

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

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      return res.status(400).json({
        success: false,
        message: 'month must use YYYY-MM.',
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
        message: 'Only authorised administrators can view monthly rosters.',
      });
    }

    const roster = await MonthlyRoster.findOne({
      department: member.department,
      unit: member.unit,
      template: templateId,
      month,
    }).select('_id name month status revision');

    return res.status(200).json({
      success: true,
      roster: roster || null,
    });
  } catch (error) {
    console.error('Get monthly roster by template and month error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to check for an existing monthly roster.',
    });
  }
};

export const deleteDraftRoster = async (req, res) => {
  try {
    const user = req.user;
    const { rosterId } = req.params;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
      });
    }

    if (!mongoose.isValidObjectId(rosterId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rosterId.',
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
        message: 'Only authorised administrators can delete draft rosters.',
      });
    }

    const roster = await MonthlyRoster.findOne({
      _id: rosterId,
      department: member.department,
      unit: member.unit,
      status: 'draft',
    });

    if (!roster) {
      return res.status(404).json({
        success: false,
        message: 'Draft roster not found.',
      });
    }

    await roster.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Draft roster deleted successfully.',
    });
  } catch (error) {
    console.error('Delete draft roster error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete the draft roster.',
    });
  }
};

export const getPublishedRosters = async (req, res) => {
  try {
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
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
        message: 'Only authorised administrators can view published rosters.',
      });
    }

    const rosters = await MonthlyRoster.find({
      department: member.department,
      unit: member.unit,
      status: 'published',
    })
      .sort({ month: -1 })
      .select('_id name month status publishedAt publishedBy revision');

    return res.status(200).json({
      success: true,
      rosters,
    });
  } catch (error) {
    console.error('Get published rosters error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch published rosters.',
    });
  }
};

export const resetRosterData = async (req, res) => {
  try {
    const user = req.user;

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication is required.',
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
        message: 'Only authorised administrators can reset roster data.',
      });
    }

    const filter = {
      department: member.department,
      unit: member.unit,
    };

    const [rostersResult, eventsResult, templatesResult] = await Promise.all([
      MonthlyRoster.deleteMany(filter),
      RosterEvent.deleteMany(filter),
      RosterTemplate.deleteMany(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: 'All roster data has been reset successfully.',
      deleted: {
        rosters: rostersResult.deletedCount || 0,
        events: eventsResult.deletedCount || 0,
        templates: templatesResult.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error('Reset roster data error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to reset roster data.',
    });
  }
};
