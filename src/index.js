import app from './app.js';
import { connectDb } from './config/db.js';
import { env } from './config/env.js';
import './config/firebaseAdmin.js';
import { startAnnouncementScheduler } from './jobs/announcementScheduler.js';

connectDb()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`API listening on http://localhost:${env.port}`);

      startAnnouncementScheduler();
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
