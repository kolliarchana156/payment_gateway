const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const idempotency = require('../middleware/idempotency');
const { paymentQueue } = require('../config/queue');

// Payments
router.post('/payments', idempotency, paymentController.createPayment);
router.post('/payments/:paymentId/capture', paymentController.capturePayment);

// Refunds
router.post('/payments/:paymentId/refunds', paymentController.createRefund);

// Job Queue Status (Test Endpoint)
router.get('/test/jobs/status', async (req, res) => {
  const pending = await paymentQueue.getJobCounts('wait', 'active', 'completed', 'failed');
  res.json({
    pending: pending.wait,
    processing: pending.active,
    completed: pending.completed,
    failed: pending.failed,
    worker_status: 'running'
  });
});

module.exports = router;