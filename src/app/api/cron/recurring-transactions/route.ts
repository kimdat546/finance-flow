import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Process recurring transactions (runs daily)
export async function GET(request: NextRequest) {
  // Verify this is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🔄 Processing recurring transactions...');
    
    // Call the database function to process due recurring transactions
    const { data, error } = await supabase.rpc('create_due_recurring_transactions');
    
    if (error) {
      console.error('Database function error:', error);
      return NextResponse.json({ 
        error: 'Failed to process recurring transactions',
        details: error.message 
      }, { status: 500 });
    }

    const processedCount = data || 0;
    console.log(`✅ Processed ${processedCount} recurring transactions`);

    // Log the cron job execution
    await supabase
      .from('cron_logs')
      .insert({
        job_name: 'recurring_transactions',
        status: 'success',
        processed_count: processedCount,
        executed_at: new Date().toISOString(),
      });

    return NextResponse.json({ 
      success: true, 
      processed: processedCount,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Cron job error:', error);
    
    // Log the failed execution
    await supabase
      .from('cron_logs')
      .insert({
        job_name: 'recurring_transactions',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        executed_at: new Date().toISOString(),
      });

    return NextResponse.json({ 
      error: 'Internal error',
      timestamp: new Date().toISOString() 
    }, { status: 500 });
  }
}