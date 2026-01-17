const db = require('../config/db');

module.exports = async (req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (!key) return next(); // If no key, just continue normally

  // We assume req.merchantId is set by auth middleware (we'll add that later)
  // For now, we'll just use the test merchant ID from the prompt
  // In a real app, this comes from the API Key check
  const merchantId = req.merchantId || 'default-merchant-uuid'; 

  try {
    // 1. Check if key exists
    const result = await db.query(
      `SELECT response FROM idempotency_keys 
       WHERE key = $1 AND merchant_id = (SELECT id FROM merchants LIMIT 1) 
       AND expires_at > NOW()`,
      [key]
    );

    if (result.rows.length > 0) {
      console.log('🔄 Idempotency Hit! Returning cached response.');
      return res.status(201).json(result.rows[0].response);
    }

    // 2. Intercept the Response
    // We override res.json so we can save the data before sending it back
    const originalJson = res.json;
    res.json = function (body) {
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Save to DB (Fire and forget, don't await)
      db.query(
        `INSERT INTO idempotency_keys (key, merchant_id, response, expires_at) 
         VALUES ($1, (SELECT id FROM merchants LIMIT 1), $2, $3)
         ON CONFLICT (key, merchant_id) DO NOTHING`,
        [key, body, expiresAt]
      ).catch(err => console.error('Idempotency save failed:', err));

      return originalJson.call(this, body);
    };

    next();
  } catch (err) {
    console.error(err);
    next();
  }
};