const db = require('../config/db');
const { webhookQueue } = require('../config/queue');

module.exports = async (job) => {
  const { paymentId } = job.data;
  // console.log(`💸 Processing Payment: ${paymentId}`);

  // 1. Fetch Payment
  const res = await db.query('SELECT * FROM payments WHERE id = $1', [paymentId]);
  const payment = res.rows[0];

  if (!payment) {
    throw new Error('Payment not found');
  }

  // 2. Simulate Bank Delay
  // In test mode (Docker), this is fast. In prod, it takes 5-10s.
  const isTest = process.env.TEST_MODE === 'true';
  const delay = isTest ? 1000 : Math.floor(Math.random() * 5000) + 5000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // 3. Determine Outcome (Success or Fail)
  let status = 'success';
  if (!isTest) {
    // 90% success rate for UPI, 95% for Cards
    const threshold = payment.method === 'upi' ? 0.9 : 0.95;
    status = Math.random() < threshold ? 'success' : 'failed';
  }

  // 4. Update Database
  await db.query(
    'UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2',
    [status, paymentId]
  );

  // 5. Trigger Webhook Job
  // We add this to the *webhookQueue* so it happens separately
  await webhookQueue.add('send-webhook', {
    merchantId: payment.merchant_id,
    event: `payment.${status}`,
    payload: {
      event: `payment.${status}`,
      data: {
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: status,
          order_id: payment.order_id
        }
      }
    }
  });

  return { status };
};