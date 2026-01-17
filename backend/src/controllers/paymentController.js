const db = require('../config/db');
const { paymentQueue } = require('../config/queue');

// 1. Create Payment
exports.createPayment = async (req, res) => {
  const { amount, currency, method, order_id } = req.body;
  
  // Basic Validation
  if (!amount || !method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get test merchant ID (In real code, use req.user.id)
    const merchantRes = await db.query("SELECT id FROM merchants WHERE email = 'test@example.com'");
    const merchantId = merchantRes.rows[0].id;

    // A. Create DB Record (Status: PENDING)
    const result = await db.query(
      `INSERT INTO payments (amount, currency, method, order_id, merchant_id, status) 
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [amount, currency || 'INR', method, order_id, merchantId]
    );
    const payment = result.rows[0];

    // B. Add to Redis Queue
    await paymentQueue.add('process-payment', { paymentId: payment.id });

    // C. Respond Immediately
    res.status(201).json(payment);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// 2. Capture Payment (New Requirement)
exports.capturePayment = async (req, res) => {
  const { paymentId } = req.params;
  
  try {
    // Update captured = true only if status is success
    const result = await db.query(
      `UPDATE payments SET captured = true, updated_at = NOW() 
       WHERE id = $1 AND status = 'success' RETURNING *`,
      [paymentId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: { code: "BAD_REQUEST_ERROR", description: "Payment not in capturable state" } 
      });
    }

    res.json({ ...result.rows[0], status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Create Refund
exports.createRefund = async (req, res) => {
  const { paymentId } = req.params;
  const { amount, reason } = req.body;

  try {
    // Get Merchant ID
    const merchantRes = await db.query("SELECT id FROM merchants LIMIT 1");
    const merchantId = merchantRes.rows[0].id;

    // Check Payment is success
    const payRes = await db.query("SELECT * FROM payments WHERE id = $1", [paymentId]);
    if (payRes.rows.length === 0 || payRes.rows[0].status !== 'success') {
      return res.status(400).json({ error: "Payment not refundable" });
    }
    
    // Check Amount available
    const refundRes = await db.query("SELECT SUM(amount) as total FROM refunds WHERE payment_id = $1", [paymentId]);
    const totalRefunded = parseInt(refundRes.rows[0].total || 0);
    
    if (amount + totalRefunded > payRes.rows[0].amount) {
      return res.status(400).json({ error: "Refund amount exceeds available amount" });
    }

    // Generate ID: "rfnd_" + 16 random chars
    const refundId = "rfnd_" + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

    // Create Refund Record
    const newRefund = await db.query(
      `INSERT INTO refunds (id, payment_id, merchant_id, amount, reason, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [refundId, paymentId, merchantId, amount, reason]
    );

    // Add to Queue (Async processing)
    const { refundQueue } = require('../config/queue');
    await refundQueue.add('process-refund', { refundId });

    res.status(201).json(newRefund.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};