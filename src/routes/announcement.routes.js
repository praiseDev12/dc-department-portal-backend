import express from 'express';

import { requireAuth } from '../middleware/auth.js';

import {
  createAnnouncementController,
  deleteAnnouncementController,
  getAdminAnnouncementsController,
  getAnnouncementsController,
} from '../controllers/announcement.controller.js';

export const announcementRouter = express.Router();

announcementRouter.post('/', requireAuth, createAnnouncementController);

announcementRouter.get('/', requireAuth, getAnnouncementsController);

announcementRouter.get('/admin', requireAuth, getAdminAnnouncementsController);

announcementRouter.delete('/:id', requireAuth, deleteAnnouncementController);
