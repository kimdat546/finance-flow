import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { MessageJobData } from '@/lib/queue';
import { aiProcessor } from '@/lib/ai-processor';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export class MessageProcessor {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'message-processing',
      this.processJob.bind(this),
      {
        connection,
        concurrency: 5, // Process 5 jobs concurrently
        removeOnComplete: 10,
        removeOnFail: 20,
      }
    );

    this.worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed successfully`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed:`, err);
    });

    this.worker.on('error', (err) => {
      console.error('Worker error:', err);
    });
  }

  private async processJob(job: Job<MessageJobData>) {
    const { userId, message, source, chatId, messageId } = job.data;

    try {
      console.log(`Processing message for user ${userId}: "${message}"`);

      // Process message with AI
      const transactions = await aiProcessor.processMessage(message);

      if (transactions.length === 0) {
        // No transactions found, send helpful message
        await this.sendResponseMessage(chatId, source, 
          '🤔 I couldn\'t find any financial transactions in your message. Try something like:\n\n' +
          '💡 "Paid $25 for lunch at McDonald\'s"\n' +
          '💡 "Got $1000 salary today"\n' +
          '💡 "Spent 500k for groceries"'
        );
        return;
      }

      // Save transactions to database
      const savedTransactions = [];
      for (const transaction of transactions) {
        try {
          const saved = await aiProcessor.saveTransaction(userId, transaction, source, message);
          savedTransactions.push(saved);
        } catch (error) {
          console.error('Failed to save transaction:', error);
          // Continue with other transactions
        }
      }

      if (savedTransactions.length > 0) {
        // Send success message
        const summary = this.generateSummaryMessage(savedTransactions);
        await this.sendResponseMessage(chatId, source, summary);
        
        // Track successful processing
        await this.trackProcessingSuccess(userId, savedTransactions.length);
      } else {
        await this.sendResponseMessage(chatId, source, 
          '❌ Sorry, I had trouble saving your transactions. Please try again.'
        );
      }

    } catch (error) {
      console.error('Job processing error:', error);
      
      // Send error message to user
      await this.sendResponseMessage(chatId, source,
        '⚠️ Something went wrong processing your message. Please try again in a moment.'
      );

      throw error; // Let BullMQ handle retries
    }
  }

  private generateSummaryMessage(transactions: any[]): string {
    if (transactions.length === 1) {
      const t = transactions[0];
      const emoji = this.getTransactionEmoji(t.type);
      return `✅ ${emoji} Saved: ${this.formatCurrency(t.amount)} for ${t.description}\n` +
             `📂 Category: ${t.category}\n` +
             `💳 Account: ${t.account_name}`;
    }

    const totalAmount = transactions.reduce((sum, t) => {
      return sum + (t.type === 'expense' ? t.amount : -t.amount);
    }, 0);

    return `✅ Saved ${transactions.length} transactions\n` +
           `💰 Total impact: ${this.formatCurrency(Math.abs(totalAmount))}\n` +
           `📊 View details in your dashboard`;
  }

  private getTransactionEmoji(type: string): string {
    const emojis = {
      income: '💰',
      expense: '💸',
      transfer: '🔄',
      investment: '📈',
      debt_payment: '💳',
      debt_charge: '⚠️',
    };
    return emojis[type as keyof typeof emojis] || '💰';
  }

  private formatCurrency(amount: number): string {
    // Simple currency formatting - you can enhance this based on user preferences
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M VND`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}k VND`;
    }
    return `${amount.toFixed(0)} VND`;
  }

  private async sendResponseMessage(chatId: string | undefined, source: string, message: string) {
    if (!chatId || source !== 'telegram') return;

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return;

    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
    } catch (error) {
      console.error('Failed to send response message:', error);
    }
  }

  private async trackProcessingSuccess(userId: string, transactionCount: number) {
    // You can add analytics tracking here
    console.log(`User ${userId} successfully processed ${transactionCount} transactions`);
  }

  async close() {
    await this.worker.close();
  }
}

// Create and export the worker instance
export const messageProcessor = new MessageProcessor();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await messageProcessor.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await messageProcessor.close();
  process.exit(0);
});