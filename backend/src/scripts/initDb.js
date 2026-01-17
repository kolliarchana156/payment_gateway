const { Pool } = require('pg');

// HARDCODED URL to ensure no environment variable mistakes
const connectionString = "postgresql://gateway_user:gateway_pass@localhost:5433/payment_gateway";

const pool = new Pool({
  connectionString: connectionString,
});

const createTables = async () => {
  console.log('⏳ Connecting to:', connectionString);
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connected! Creating tables...');

    // 1. Merchants Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        webhook_url VARCHAR(255),
        webhook_secret VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Payments Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        amount INTEGER NOT NULL,
        currency VARCHAR(3) DEFAULT 'INR',
        status VARCHAR(20) DEFAULT 'pending',
        method VARCHAR(20),
        order_id VARCHAR(100),
        merchant_id UUID REFERENCES merchants(id),
        captured BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Refunds Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS refunds (
        id VARCHAR(64) PRIMARY KEY,
        payment_id UUID NOT NULL REFERENCES payments(id),
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        amount INTEGER NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
      );
    `);

    // 4. Webhook Logs Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        event VARCHAR(50) NOT NULL,
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_attempt_at TIMESTAMP,
        next_retry_at TIMESTAMP,
        response_code INTEGER,
        response_body TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Idempotency Keys Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key VARCHAR(255),
        merchant_id UUID NOT NULL REFERENCES merchants(id),
        response JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        PRIMARY KEY (key, merchant_id)
      );
    `);

    // 6. Seed a Test Merchant
    await client.query(`
      INSERT INTO merchants (email, password_hash, webhook_secret)
      VALUES ('test@example.com', 'hashed_secret_123', 'whsec_test_abc123')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('✅ All tables created successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    if (client) client.release();
    pool.end();
  }
};

createTables();