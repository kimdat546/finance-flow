import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ================================
// AUTOMATIC USAGE PATTERNS FOR SAAS
// ================================

export interface AutoPattern {
  id: string;
  name: string;
  description: string;
  setup: () => Promise<void>;
  example: string;
}

export const AUTO_PATTERNS: AutoPattern[] = [
  {
    id: 'sms_forwarding',
    name: '📱 SMS Bank Notifications',
    description: 'Forward bank SMS notifications to get instant transaction tracking',
    setup: async () => {},
    example: 'Forward SMS: "Your card ending 1234 was charged $45.67 at STARBUCKS" → Auto-categorized as Food & Dining'
  },
  {
    id: 'email_parsing',
    name: '📧 Email Receipt Processing',
    description: 'Forward email receipts and invoices for automatic expense tracking',
    setup: async () => {},
    example: 'Forward email from Amazon with order details → Auto-creates Shopping transaction'
  },
  {
    id: 'recurring_setup',
    name: '🔄 Smart Recurring Transactions',
    description: 'Set up monthly bills, salary, and subscriptions to auto-create',
    setup: async () => {},
    example: 'Netflix $15.99 every month → Auto-creates Entertainment expense on billing date'
  },
  {
    id: 'location_rules',
    name: '📍 Location-Based Smart Rules',
    description: 'Auto-categorize based on merchant or location patterns',
    setup: async () => {},
    example: '"Paid at McDonald\'s" → Auto-categorized as Food & Dining with fast-food tag'
  },
  {
    id: 'whatsapp_integration',
    name: '💬 WhatsApp Business Integration',
    description: 'Connect WhatsApp Business API for customer payment notifications',
    setup: async () => {},
    example: 'Business receives: "Payment received $100 from John" → Auto-creates Income'
  },
  {
    id: 'api_webhooks',
    name: '🔗 Payment Gateway Webhooks',
    description: 'Connect Stripe, PayPal, or local payment providers directly',
    setup: async () => {},
    example: 'Stripe webhook → Auto-creates transaction with customer and product details'
  }
];

// Smart Rules Engine
export class SmartRulesEngine {
  async createSmartRule(userId: string, rule: {
    name: string;
    conditions: Record<string, any>;
    actions: Record<string, any>;
    priority?: number;
  }) {
    const { data, error } = await supabase
      .from('smart_rules')
      .insert({
        user_id: userId,
        name: rule.name,
        conditions: rule.conditions,
        actions: rule.actions,
        priority: rule.priority || 1,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async processMessageWithRules(userId: string, message: string): Promise<any> {
    // Get active rules for user
    const { data: rules } = await supabase
      .from('smart_rules')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (!rules) return null;

    for (const rule of rules) {
      if (this.matchesConditions(message, rule.conditions)) {
        // Update trigger count
        await supabase
          .from('smart_rules')
          .update({
            trigger_count: rule.trigger_count + 1,
            last_triggered_at: new Date().toISOString(),
          })
          .eq('id', rule.id);

        return rule.actions;
      }
    }

    return null;
  }

  private matchesConditions(message: string, conditions: Record<string, any>): boolean {
    const lowerMessage = message.toLowerCase();

    // Keyword matching
    if (conditions.keywords) {
      const keywords = Array.isArray(conditions.keywords) ? conditions.keywords : [conditions.keywords];
      const hasKeyword = keywords.some((keyword: string) => 
        lowerMessage.includes(keyword.toLowerCase())
      );
      if (!hasKeyword) return false;
    }

    // Amount range matching
    if (conditions.amount_range) {
      const amounts = message.match(/\d+(?:\.\d{2})?/g);
      if (amounts) {
        const amount = parseFloat(amounts[0]);
        const [min, max] = conditions.amount_range;
        if (amount < min || amount > max) return false;
      } else if (conditions.amount_range) {
        return false; // No amount found but range specified
      }
    }

    // Merchant/location matching
    if (conditions.merchants) {
      const merchants = Array.isArray(conditions.merchants) ? conditions.merchants : [conditions.merchants];
      const hasMerchant = merchants.some((merchant: string) =>
        lowerMessage.includes(merchant.toLowerCase())
      );
      if (!hasMerchant) return false;
    }

    return true;
  }
}

// Recurring Transactions Manager
export class RecurringTransactionManager {
  async createRecurring(userId: string, template: {
    type: string;
    amount: number;
    category: string;
    description: string;
    account_name: string;
    payment_method: string;
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    interval_count?: number;
    start_date: string;
    day_of_month?: number;
    day_of_week?: number;
    auto_create?: boolean;
  }) {
    const nextDueDate = this.calculateNextDueDate(
      template.start_date,
      template.frequency,
      template.interval_count || 1,
      template.day_of_month,
      template.day_of_week
    );

    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        user_id: userId,
        ...template,
        next_due_date: nextDueDate,
        interval_count: template.interval_count || 1,
        auto_create: template.auto_create !== false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private calculateNextDueDate(
    startDate: string,
    frequency: string,
    intervalCount: number,
    dayOfMonth?: number,
    dayOfWeek?: number
  ): string {
    const start = new Date(startDate);
    const now = new Date();
    let nextDate = new Date(start);

    // If start date is in the future, use it
    if (start > now) {
      return start.toISOString().split('T')[0];
    }

    // Calculate next occurrence
    switch (frequency) {
      case 'daily':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + intervalCount);
        }
        break;
        
      case 'weekly':
        while (nextDate <= now) {
          nextDate.setDate(nextDate.getDate() + (7 * intervalCount));
        }
        break;
        
      case 'monthly':
        while (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + intervalCount);
          if (dayOfMonth) {
            nextDate.setDate(Math.min(dayOfMonth, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
          }
        }
        break;
        
      case 'quarterly':
        while (nextDate <= now) {
          nextDate.setMonth(nextDate.getMonth() + (3 * intervalCount));
        }
        break;
        
      case 'yearly':
        while (nextDate <= now) {
          nextDate.setFullYear(nextDate.getFullYear() + intervalCount);
        }
        break;
    }

    return nextDate.toISOString().split('T')[0];
  }

  async processDueRecurring(): Promise<number> {
    // This would be called by a cron job
    const { data } = await supabase.rpc('create_due_recurring_transactions');
    return data || 0;
  }
}

// Bank SMS Parser
export class BankSMSParser {
  private bankPatterns = [
    {
      bank: 'Vietcombank',
      patterns: [
        /TK (.+) GD (.+) So tien (.+)VND tai (.+) luc (.+)/,
        /Your card ending (\d{4}) was charged (.+) at (.+)/,
      ]
    },
    {
      bank: 'BIDV',
      patterns: [
        /TK (.+) da bi tru (.+)VND.*tai (.+)/,
      ]
    },
    // Add more bank patterns
  ];

  parseBankSMS(message: string): {
    amount?: number;
    merchant?: string;
    account?: string;
    timestamp?: Date;
    type: 'expense' | 'income';
  } | null {
    for (const bank of this.bankPatterns) {
      for (const pattern of bank.patterns) {
        const match = message.match(pattern);
        if (match) {
          return this.extractTransactionData(match, bank.bank);
        }
      }
    }
    return null;
  }

  private extractTransactionData(match: RegExpMatchArray, bankName: string) {
    // Parse common transaction data from regex matches
    // This would be customized per bank format
    return {
      amount: this.extractAmount(match[0]),
      merchant: this.extractMerchant(match[0]),
      account: bankName,
      type: 'expense' as const,
      timestamp: new Date(),
    };
  }

  private extractAmount(text: string): number {
    const amounts = text.match(/[\d,]+(?:\.\d{2})?/g);
    return amounts ? parseFloat(amounts[0].replace(/,/g, '')) : 0;
  }

  private extractMerchant(text: string): string {
    // Extract merchant name from transaction text
    const merchantMatch = text.match(/tai (.+?)(?:\s|$)/);
    return merchantMatch ? merchantMatch[1].trim() : 'Unknown';
  }
}

export const smartRulesEngine = new SmartRulesEngine();
export const recurringManager = new RecurringTransactionManager();
export const bankSMSParser = new BankSMSParser();