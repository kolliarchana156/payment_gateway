const db = require('../config/db');
const { webhookQueue } = require('../config/queue');

module.exports = async (job) => {
  const { refundId } = job.data;

  // 1. Fetch Refund
  const res = await db.query('SELECT * FROM refunds WHERE id = $1', [refundId]);
  const refund = res.rows[0];
  if (!refund) throw new Error('Refund not found');

  // 2. Simulate Delay (3-5s)
  const delay = Math.floor(Math.random() * 2000) + 3000;
  await new Promise(r => setTimeout(r, delay));

  // 3. Mark Processed
  await db.query(
    `UPDATE refunds SET status = 'processed', processed_at = NOW() WHERE id = $1`,
    [refundId]
  );

  // 4. Trigger Webhook
  await webhookQueue.add('send-webhook', {
    merchantId: refund.merchant_id,
    event: 'refund.processed',
    payload: {
      event: 'refund.processed',
      data: refund
    }
  });
};