import app from '../src/app.js';
import { connectDb } from '../src/config/db.js';

let connectionPromise;

export default async function handler(req, res) {
  try {
    if (!connectionPromise) {
      connectionPromise = connectDb();
    }

    await connectionPromise;

    return app(req, res);
  } catch (error) {
    console.error('❌ Database connection failed:', error);

    connectionPromise = null;

    return res.status(500).json({
      message: 'Database connection failed',
    });
  }
}
