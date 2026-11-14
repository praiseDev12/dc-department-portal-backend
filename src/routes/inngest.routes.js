import express from 'express';
import { serve } from 'inngest/express';

import { inngest } from '../config/inngest.js';
import { sendRosterNotification } from '../inngest/functions/sendNotification.js';
import { scheduleRosterNotifications } from '../inngest/functions/scheduleRosterNotifications.js';
import { sendBirthdaySummary } from '../inngest/functions/sendBirthdaySummary.js';
import { scheduleMonthlyBirthdays } from '../inngest/functions/scheduleMonthlyBirthdays.js';

export const inngestRouter = express.Router();

inngestRouter.use(
  '/',
  serve({
    client: inngest,
    functions: [
      sendRosterNotification,
      scheduleRosterNotifications,
      sendBirthdaySummary,
      scheduleMonthlyBirthdays,
    ],
  }),
);
