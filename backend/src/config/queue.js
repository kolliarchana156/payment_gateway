const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// 1. Setup Redis Connection
// "maxRetriesPerRequest: null" is required by BullMQ
const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, 
});

// 2. Define our Queues
// These names ('payment-queue', etc.) must match exactly in the Worker
const paymentQueue = new Queue('payment-queue', { connection });
const webhookQueue = new Queue('webhook-queue', { connection });
const refundQueue = new Queue('refund-queue', { connection });

// Log connection errors
connection.on('error', (err) => {
  console.error('Redis connection error:', err);
});

module.exports = {
  connection,
  paymentQueue,
  webhookQueue,
  refundQueue
};