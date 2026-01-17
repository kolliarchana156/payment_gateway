require('dotenv').config();
const { Worker } = require('bullmq');
const { connection } = require('./config/queue');

// Import Job Processors
const paymentProcessor = require('./jobs/paymentJob');
const webhookProcessor = require('./jobs/webhookJob');
const refundProcessor = require('./jobs/refundJob');

console.log('🚀 Worker Service Starting...');

// 1. Payment Worker
const paymentWorker = new Worker('payment-queue', paymentProcessor, { 
  connection,
  concurrency: 5 
});

// 2. Webhook Worker
const webhookWorker = new Worker('webhook-queue', webhookProcessor, { 
  connection,
  concurrency: 10
});

// 3. Refund Worker
const refundWorker = new Worker('refund-queue', refundProcessor, { 
  connection 
});

// Logging
paymentWorker.on('completed', job => console.log(`✅ Payment ${job.id} processed`));
paymentWorker.on('failed', (job, err) => console.error(`❌ Payment ${job.id} failed: ${err.message}`));

webhookWorker.on('completed', job => console.log(`✅ Webhook ${job.id} sent`));
webhookWorker.on('failed', (job, err) => console.error(`❌ Webhook ${job.id} failed: ${err.message}`));