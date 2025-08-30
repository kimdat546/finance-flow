import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
});

// Message processing queue
export const messageQueue = new Queue('message-processing', { connection });

// Types for queue jobs
export interface MessageJobData {
  userId: string;
  message: string;
  timestamp: number;
  source: 'telegram' | 'whatsapp' | 'sms' | 'web';
  chatId?: string;
  messageId?: string;
}

export interface TransactionJobData {
  userId: string;
  rawMessage: string;
  extractedData: any;
  source: string;
}

// Rate limiting per user
export class RateLimit {
  private redis: Redis;
  
  constructor() {
    this.redis = connection;
  }

  async checkLimit(userId: string, limit: number = 100, windowMs: number = 60000): Promise<boolean> {
    const key = `rate_limit:${userId}:${Math.floor(Date.now() / windowMs)}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
    }
    
    return current <= limit;
  }

  async getUsage(userId: string, windowMs: number = 60000): Promise<number> {
    const key = `rate_limit:${userId}:${Math.floor(Date.now() / windowMs)}`;
    const current = await this.redis.get(key);
    return parseInt(current || '0');
  }
}

export const rateLimiter = new RateLimit();

// Add job to queue with user context
export async function addMessageJob(data: MessageJobData) {
  return await messageQueue.add('process-message', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
}

// Subscription limits per plan
export const PLAN_LIMITS = {
  free: { messagesPerMonth: 50, messagesPerMinute: 5 },
  pro: { messagesPerMonth: 1000, messagesPerMinute: 20 },
  business: { messagesPerMonth: -1, messagesPerMinute: 100 }, // -1 = unlimited
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;