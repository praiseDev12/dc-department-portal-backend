import * as memberService from '../services/member.service.js';
import { cloudinary } from '../middleware/upload.js';

export async function getMembers(req, res) {
  try {
    const members = await memberService.getMembers({
      user: req.user,
      search: req.query.search || '',
    });

    res.status(200).json({
      members,
    });
  } catch (error) {
    console.error('getMembers error:', error);

    res.status(500).json({
      message: error.message || 'Failed to load members',
    });
  }
}

export async function getMember(req, res) {
  try {
    const member = await memberService.getMemberById(req.params.id, req.user);

    res.status(200).json({
      member,
    });
  } catch (error) {
    console.error('getMember error:', error);

    const status = error.message === 'Member not found' ? 404 : 500;

    res.status(status).json({
      message: error.message || 'Failed to load member',
    });
  }
}

export async function updateMember(req, res) {
  try {
    const member = await memberService.updateMember(
      req.params.id,
      req.user,
      req.body,
    );

    res.status(200).json({
      message: 'Member updated successfully',
      member,
    });
  } catch (error) {
    console.error('updateMember error:', error);

    const status = error.message === 'Member not found' ? 404 : 400;

    res.status(status).json({
      message: error.message || 'Failed to update member',
    });
  }
}

export async function changeMemberStatus(req, res) {
  try {
    const member = await memberService.changeMemberStatus(
      req.params.id,
      req.user,
      req.body.status,
    );

    res.status(200).json({
      message: 'Member status updated successfully',
      member,
    });
  } catch (error) {
    console.error('changeMemberStatus error:', error);

    const status = error.message === 'Member not found' ? 404 : 400;

    res.status(status).json({
      message: error.message || 'Failed to change member status',
    });
  }
}

export async function changeMemberUnit(req, res) {
  try {
    const member = await memberService.changeMemberUnit(
      req.params.id,
      req.user,
      req.body.unitId,
      req.body.note,
    );

    res.status(200).json({
      message: 'Member unit updated successfully',
      member,
    });
  } catch (error) {
    console.error('changeMemberUnit error:', error);

    const status = error.message === 'Member not found' ? 404 : 400;

    res.status(status).json({
      message: error.message || 'Failed to change member unit',
    });
  }
}

export async function deleteMember(req, res) {
  try {
    await memberService.deleteMember(req.params.id, req.user);

    res.status(200).json({
      message: 'Member deleted successfully',
    });
  } catch (error) {
    console.error('deleteMember error:', error);

    const status = error.message === 'Member not found' ? 404 : 500;

    res.status(status).json({
      message: error.message || 'Failed to delete member',
    });
  }
}

function uploadBufferToCloudinary(buffer, folder = 'member-photos') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export async function uploadMemberPhoto(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await uploadBufferToCloudinary(req.file.buffer);

    const member = await memberService.updateMember(req.params.id, req.user, {
      photoUrl: result.secure_url,
    });

    res.status(200).json({ message: 'Photo uploaded successfully', member });
  } catch (error) {
    console.error('uploadMemberPhoto error:', error);
    const status = error.message === 'Member not found' ? 404 : 500;
    res
      .status(status)
      .json({ message: error.message || 'Failed to upload photo' });
  }
}
