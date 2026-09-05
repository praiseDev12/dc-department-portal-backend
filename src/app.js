import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
// import { departmentRouter } from './routes/department.routes.js';
import { memberRouter } from './routes/members.routes.js';
// import { serviceRouter } from './routes/service.routes.js';
// import { contributionRouter } from './routes/contribution.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { reportsRouter } from './routes/report.routes.js';
// import { notificationRouter } from './routes/notification.routes.js';
import { AppError } from './utils/errors.js';
// import { memberAuthRouter } from './routes/memberAuth.route.js';
import { publicRouter } from './routes/public.route.js';
import { unitRouter } from './routes/unit.route.js';
import { roleRouter } from './routes/role.route.js';
import { checkInRouter } from './routes/checkIn.route.js';
import { contributionRouter } from './routes/contribution.routes.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(__dirname, '../../client/dist');

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 80 }));

app.get('/api/health', async (_req, res) => {
  try {
    const mongoose = await import('mongoose');

    const state = mongoose.default.connection.readyState;

    res.json({
      ok: true,
      database: state === 1 ? 'connected' : `not connected (state: ${state})`,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: 'error',
      message: error.message,
    });
  }
});
app.use('/api/auth', authRouter);
// app.use('/api/departments', departmentRouter);
app.use('/api/members', memberRouter);
// app.use('/api/services', serviceRouter);
app.use('/api/check-in', checkInRouter);
app.use('/api/contributions', contributionRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);
// app.use('/api/notifications', notificationRouter);
// app.use('/api/member-auth', memberAuthRouter);
app.use('/api/public', publicRouter);
app.use('/api/units', unitRouter);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api/roles', roleRouter);

app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) next();
  });
});

app.use((_req, _res, next) => next(new AppError('Route not found', 404)));

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || 'Unexpected server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
});

export default app;
