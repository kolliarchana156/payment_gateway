const axios = require('axios');
const crypto = require('crypto');
const db = require('../config/db');
const { webhookQueue } = require('../config/queue');

module.exports = async (job) => {
  const { merchantId, event, payload, attempt = 1, webhookLogId } = job.data;

  // 1. Get Merchant Config
  const res = await db.query(
    'SELECT webhook_url, webhook_secret FROM merchants WHERE id = $1', 
    [merchantId]
  );
  const merchant = res.rows[0];

  if (!merchant || !merchant.webhook_url) return; // Nothing to do

  // 2. Generate HMAC Signature
  // This proves to the merchant that the request came from US
  const signature = crypto
    .createHmac('sha256', merchant.webhook_secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  // 3. Log Initial Attempt (if first try)
  let logId = webhookLogId;
  if (!logId) {
    const logRes = await db.query(
      `INSERT INTO webhook_logs (merchant_id, event, payload, status) 
       VALUES ($1, $2, $3, 'pending') RETURNING id`,
      [merchantId, event, payload]
    );
    logId = logRes.rows[0].id;
  }

  try {
    // 4. Send Request
    const response = await axios.post(merchant.webhook_url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature
      },
      timeout: 5000
    });

    // 5. Success!
    await db.query(
      `UPDATE webhook_logs SET status = 'success', response_code = $1, attempts = $2, last_attempt_at = NOW() WHERE id = $3`,
      [response.status, attempt, logId]
    );

  } catch (error) {
    // 6. Failed - Handle Retry
    const responseCode = error.response ? error.response.status : 0;
    
    if (attempt < 5) {
      // Calculate delay (Backoff: 1m, 5m, 30m...)
      // For testing, we use small numbers (5s, 10s...)
      const delays = process.env.TEST_MODE === 'true' 
        ? [5000, 10000, 15000, 20000, 25000] 
        : [60000, 300000, 1800000, 7200000];
      
      const delay = delays[attempt - 1] || 60000;
      const nextRetry = new Date(Date.now() + delay);

      // Update Log
      await db.query(
        `UPDATE webhook_logs SET attempts = $1, last_attempt_at = NOW(), next_retry_at = $2 WHERE id = $3`,
        [attempt, nextRetry, logId]
      );

      // Re-queue the job
      await webhookQueue.add('send-webhook', {
        ...job.data,
        attempt: attempt + 1,
        webhookLogId: logId
      }, { delay });
      
    } else {
      // Give up after 5 tries
      await db.query(
        `UPDATE webhook_logs SET status = 'failed', attempts = $1, last_attempt_at = NOW() WHERE id = $2`,
        [attempt, logId]
      );
    }
    
    // Throw error to mark job as failed in Redis
    throw error;
  }
};