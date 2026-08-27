import * as memberService from '../services/member.service.js';

export async function getMembers(req, res) {
  try {
    const departmentId = req.user.department;

    const members = await memberService.getMembers({
      departmentId,
      search: req.query.search || '',
    });

    res.json({
      success: true,
      members,
    });
  } catch (error) {
    console.error('getMembers error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load members',
    });
  }
}

export async function getMember(req, res) {
  try {
    const departmentId = req.user.department;

    const member = await memberService.getMemberById(
      req.params.id,
      departmentId,
    );

    res.json({
      success: true,
      member,
    });
  } catch (error) {
    console.error('getMember error:', error);

    const status = error.message === 'Member not found' ? 404 : 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Failed to load member',
    });
  }
}

export async function updateMember(req, res) {
  try {
    const departmentId = req.user.department;

    const member = await memberService.updateMember(
      req.params.id,
      departmentId,
      req.body,
    );

    res.json({
      success: true,
      message: 'Member updated successfully',
      member,
    });
  } catch (error) {
    console.error('updateMember error:', error);

    const status = error.message === 'Member not found' ? 404 : 400;

    res.status(status).json({
      success: false,
      message: error.message || 'Failed to update member',
    });
  }
}

export async function changeMemberStatus(req, res) {
  try {
    const departmentId = req.user.department;

    const member = await memberService.changeMemberStatus(
      req.params.id,
      departmentId,
      req.body.status,
    );

    res.json({
      success: true,
      message: 'Member status updated successfully',
      member,
    });
  } catch (error) {
    console.error('changeMemberStatus error:', error);

    const status = error.message === 'Member not found' ? 404 : 400;

    res.status(status).json({
      success: false,
      message: error.message || 'Failed to change member status',
    });
  }
}

export async function changeMemberUnit(req, res) {
  try {
    const departmentId = req.user.department;

    const member = await memberService.changeMemberUnit(
      req.params.id,
      departmentId,
      req.body.unitId,
      req.user._id,
      req.body.note,
    );

    res.json({
      success: true,
      message: 'Member unit updated successfully',
      member,
    });
  } catch (error) {
    console.error('changeMemberUnit error:', error);

    const status = error.message === 'Member not found' ? 404 : 400;

    res.status(status).json({
      success: false,
      message: error.message || 'Failed to change member unit',
    });
  }
}

export async function deleteMember(req, res) {
  try {
    const departmentId = req.user.department;

    await memberService.deleteMember(req.params.id, departmentId);

    res.json({
      success: true,
      message: 'Member deleted successfully',
    });
  } catch (error) {
    console.error('deleteMember error:', error);

    const status = error.message === 'Member not found' ? 404 : 500;

    res.status(status).json({
      success: false,
      message: error.message || 'Failed to delete member',
    });
  }
}
