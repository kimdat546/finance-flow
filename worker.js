#!/usr/bin/env node

/**
 * Production Worker for FinanceFlow Message Processing
 * This runs as a separate service to process the Redis queue
 */

const { Worker } = require('bullmq');
const Redis = require('ioredis');

// Environment check
if (!process.env.REDIS_URL) {
  console.error('❌ REDIS_URL environment variable is required');
  process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

// Redis connection
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  lazyConnect: true,
});

// Import worker class (you may need to adjust the path)
const { MessageProcessor } = require('./dist/workers/message-processor');

console.log('🚀 Starting FinanceFlow Message Worker...');
console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔗 Redis: ${process.env.REDIS_URL.replace(/\/\/.*@/, '//***@')}`);

// Create worker instance
let messageProcessor;

async function startWorker() {
  try {
    await connection.connect();
    console.log('✅ Connected to Redis');

    messageProcessor = new MessageProcessor();
    console.log('🔄 Message processor initialized');
    console.log('👂 Listening for messages...');
    
    // Health monitoring
    setInterval(() => {
      console.log(`💓 Worker heartbeat - ${new Date().toISOString()}`);
    }, 60000); // Every minute

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  try {
    if (messageProcessor) {
      await messageProcessor.close();
      console.log('✅ Message processor closed');
    }
    
    await connection.quit();
    console.log('✅ Redis connection closed');
    
    console.log('👋 Goodbye!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the worker
startWorker().catch((error) => {
  console.error('❌ Failed to start worker:', error);
  process.exit(1);
});