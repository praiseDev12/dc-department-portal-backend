import express from 'express';

import {
  getMembers,
  getMember,
  updateMember,
  changeMemberStatus,
  changeMemberUnit,
  deleteMember,
  uploadMemberPhoto,
} from '../controllers/members.controller.js';

import upload from '../middleware/upload.js';

import { requireAuth } from '../middleware/auth.js';

export const memberRouter = express.Router();

memberRouter.use(requireAuth);
memberRouter.get('/', getMembers);
memberRouter.get('/:id', getMember);
memberRouter.patch('/:id', updateMember);
memberRouter.patch('/:id/status', changeMemberStatus);
memberRouter.patch('/:id/unit', changeMemberUnit);
memberRouter.delete('/:id', deleteMember);
memberRouter.patch('/:id/photo', upload.single('photo'), uploadMemberPhoto);
