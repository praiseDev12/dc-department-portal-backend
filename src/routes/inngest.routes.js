import express from 'express';
import { serve } from 'inngest/express';

import { inngest } from '../config/inngest.js';
import { sendRosterNotification } from '../inngest/functions/sendNotification.js';
import { scheduleRosterNotifications } from '../inngest/functions/scheduleRosterNotifications.js';

export const inngestRouter = express.Router();

inngestRouter.use(
  '/',
  serve({
    client: inngest,
    functions: [sendRosterNotification, scheduleRosterNotifications],
  }),
);
