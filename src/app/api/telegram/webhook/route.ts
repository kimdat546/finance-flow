import { NextRequest, NextResponse } from 'next/server';
import { addMessageJob, rateLimiter, PLAN_LIMITS } from '@/lib/queue';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TelegramUpdate {
  message?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
    };
    from?: {
      id: number;
      first_name: string;
      username?: string;
    };
    text?: string;
    date: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    
    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    const telegramUserId = message.from?.id.toString();
    const chatId = message.chat.id.toString();

    if (!telegramUserId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    // Find user by Telegram ID
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('id, subscription_plan, telegram_user_id')
      .eq('telegram_user_id', telegramUserId)
      .single();

    if (userError || !user) {
      // Send registration message
      await sendTelegramMessage(chatId, 
        '👋 Welcome to FinanceFlow! Please register at https://financeflow.app to start tracking your expenses.'
      );
      return NextResponse.json({ ok: true });
    }

    // Check subscription limits
    const userPlan = (user.subscription_plan || 'free') as keyof typeof PLAN_LIMITS;
    const limits = PLAN_LIMITS[userPlan];
    
    // Rate limiting check
    const withinLimit = await rateLimiter.checkLimit(
      user.id,
      limits.messagesPerMinute,
      60000
    );

    if (!withinLimit) {
      await sendTelegramMessage(chatId, 
        '⚠️ Rate limit exceeded. Please wait a moment before sending another message.'
      );
      return NextResponse.json({ ok: true });
    }

    // Check monthly limits (except for business plan)
    if (limits.messagesPerMonth !== -1) {
      const monthlyUsage = await getMonthlyUsage(user.id);
      if (monthlyUsage >= limits.messagesPerMonth) {
        await sendTelegramMessage(chatId,
          '📊 You\'ve reached your monthly message limit. Upgrade your plan to continue: https://financeflow.app/upgrade'
        );
        return NextResponse.json({ ok: true });
      }
    }

    // Add message to processing queue
    await addMessageJob({
      userId: user.id,
      message: message.text,
      timestamp: message.date * 1000,
      source: 'telegram',
      chatId,
      messageId: message.message_id.toString(),
    });

    // Send processing confirmation
    await sendTelegramMessage(chatId, '⚡ Processing your transaction...');

    // Track usage
    await trackUsage(user.id, 'telegram', message.text);

    return NextResponse.json({ ok: true });

  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function sendTelegramMessage(chatId: string, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
}

async function getMonthlyUsage(userId: string): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  return count || 0;
}

async function trackUsage(userId: string, source: string, message: string) {
  await supabase
    .from('usage_logs')
    .insert({
      user_id: userId,
      source,
      message_length: message.length,
      created_at: new Date().toISOString(),
    });
}