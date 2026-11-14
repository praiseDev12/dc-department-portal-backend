import express from 'express';

import { inngest } from '../config/inngest.js';

const router = express.Router();

router.post('/send-summary', async (req, res) => {
  try {
    const { departmentId, month } = req.body;

    if (!departmentId || !month) {
      return res.status(400).json({
        success: false,
        message: 'departmentId and month are required.',
      });
    }

    const result = await inngest.send({
      name: 'birthday/summary.requested',
      data: {
        departmentId,
        month,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Birthday summary event sent to Inngest.',
      result,
    });
  } catch (error) {
    console.error('Birthday test event error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send birthday test event.',
    });
  }
});

export default router;
