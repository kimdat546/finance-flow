import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { smartRulesEngine, recurringManager, AUTO_PATTERNS } from '@/lib/auto-patterns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get available automatic patterns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get user's current smart rules and recurring transactions
    const [smartRules, recurringTx] = await Promise.all([
      supabase
        .from('smart_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true),
      supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
    ]);

    return NextResponse.json({
      availablePatterns: AUTO_PATTERNS,
      currentSmartRules: smartRules.data || [],
      currentRecurring: recurringTx.data || [],
    });

  } catch (error) {
    console.error('Get auto patterns error:', error);
    return NextResponse.json({ error: 'Failed to fetch patterns' }, { status: 500 });
  }
}

// Setup automatic patterns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, patternType, config } = body;

    if (!userId || !patternType || !config) {
      return NextResponse.json({ 
        error: 'userId, patternType, and config are required' 
      }, { status: 400 });
    }

    let result;

    switch (patternType) {
      case 'smart_rule':
        result = await setupSmartRule(userId, config);
        break;
      case 'recurring_transaction':
        result = await setupRecurringTransaction(userId, config);
        break;
      case 'quick_setup':
        result = await quickSetupForUser(userId, config);
        break;
      default:
        return NextResponse.json({ error: 'Invalid pattern type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error('Setup auto pattern error:', error);
    return NextResponse.json({ error: 'Setup failed' }, { status: 500 });
  }
}

// Setup a smart rule
async function setupSmartRule(userId: string, config: {
  name: string;
  keywords?: string[];
  merchants?: string[];
  amountRange?: [number, number];
  category: string;
  account?: string;
  paymentMethod?: string;
}) {
  const conditions: Record<string, any> = {};
  const actions: Record<string, any> = {
    category: config.category,
  };

  if (config.keywords) conditions.keywords = config.keywords;
  if (config.merchants) conditions.merchants = config.merchants;
  if (config.amountRange) conditions.amount_range = config.amountRange;
  
  if (config.account) actions.account = config.account;
  if (config.paymentMethod) actions.payment_method = config.paymentMethod;

  return await smartRulesEngine.createSmartRule(userId, {
    name: config.name,
    conditions,
    actions,
  });
}

// Setup recurring transaction
async function setupRecurringTransaction(userId: string, config: {
  name: string;
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
  auto_create?: boolean;
}) {
  return await recurringManager.createRecurring(userId, config);
}

// Quick setup with common patterns
async function quickSetupForUser(userId: string, config: { patterns: string[] }) {
  const results = [];

  for (const patternId of config.patterns) {
    switch (patternId) {
      case 'salary_income':
        results.push(await recurringManager.createRecurring(userId, {
          type: 'income',
          amount: 0, // User will update this
          category: 'Lương',
          description: 'Lương hàng tháng',
          account_name: 'Tài khoản chính',
          payment_method: 'chuyển khoản',
          frequency: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          day_of_month: 1,
          auto_create: false, // Let user confirm first
        }));
        break;

      case 'rent_expense':
        results.push(await recurringManager.createRecurring(userId, {
          type: 'expense',
          amount: 0,
          category: 'Thuê nhà',
          description: 'Tiền thuê nhà hàng tháng',
          account_name: 'Tài khoản chính',
          payment_method: 'chuyển khoản',
          frequency: 'monthly',
          start_date: new Date().toISOString().split('T')[0],
          day_of_month: 1,
          auto_create: false,
        }));
        break;

      case 'food_rules':
        results.push(await smartRulesEngine.createSmartRule(userId, {
          name: 'Nhận diện đồ ăn',
          conditions: {
            keywords: ['ăn', 'cơm', 'phở', 'bún', 'bánh', 'quán', 'nhà hàng', 'food', 'restaurant', 'coffee', 'starbucks', 'kfc', 'mcdonald'],
          },
          actions: {
            category: 'Ăn uống',
          },
        }));
        break;

      case 'transport_rules':
        results.push(await smartRulesEngine.createSmartRule(userId, {
          name: 'Nhận diện giao thông',
          conditions: {
            keywords: ['grab', 'taxi', 'xe ôm', 'xăng', 'gas', 'petrol', 'bus', 'metro', 'uber'],
          },
          actions: {
            category: 'Giao thông',
          },
        }));
        break;

      case 'shopping_rules':
        results.push(await smartRulesEngine.createSmartRule(userId, {
          name: 'Nhận diện mua sắm',
          conditions: {
            keywords: ['mua', 'shopping', 'mall', 'amazon', 'lazada', 'shopee', 'tiki', 'siêu thị', 'coopmart', 'lotte'],
          },
          actions: {
            category: 'Mua sắm',
          },
        }));
        break;

      case 'entertainment_rules':
        results.push(await smartRulesEngine.createSmartRule(userId, {
          name: 'Nhận diện giải trí',
          conditions: {
            keywords: ['phim', 'movie', 'cinema', 'cgv', 'netflix', 'spotify', 'game', 'karaoke'],
          },
          actions: {
            category: 'Giải trí',
          },
        }));
        break;
    }
  }

  return results;
}