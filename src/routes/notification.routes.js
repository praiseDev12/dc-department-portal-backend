import express from 'express';
import webPush from 'web-push';
import { body } from 'express-validator';
import { NotificationSubscription } from '../models/NotificationSubscription.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';
import { unitScopedFilter } from '../utils/scope.js';

if (env.vapid.publicKey && env.vapid.privateKey) {
  webPush.setVapidDetails('mailto:no-reply@example.com', env.vapid.publicKey, env.vapid.privateKey);
}

export const notificationRouter = express.Router();
notificationRouter.use(requireAuth);

notificationRouter.post('/subscribe', [body('endpoint').notEmpty()], validate, asyncHandler(async (req, res) => {
  const subscription = await NotificationSubscription.findOneAndUpdate(
    { department: req.user.department, endpoint: req.body.endpoint },
    { department: req.user.department, unit: req.user.unit, endpoint: req.body.endpoint, keys: req.body.keys },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.status(201).json(subscription);
}));

notificationRouter.post('/announce', [body('title').trim().notEmpty(), body('body').trim().notEmpty()], validate, asyncHandler(async (req, res) => {
  const filter = unitScopedFilter(req);
  if (req.body.unit && req.user.role === 'main_admin') filter.unit = req.body.unit;
  const subscriptions = await NotificationSubscription.find(filter);
  if (!env.vapid.publicKey) {
    res.json({ sent: 0, skipped: subscriptions.length, reason: 'VAPID keys are not configured' });
    return;
  }
  const payload = JSON.stringify({ title: req.body.title, body: req.body.body });
  const settled = await Promise.allSettled(subscriptions.map((sub) => webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload)));
  res.json({ sent: settled.filter((item) => item.status === 'fulfilled').length, attempted: settled.length });
}));
