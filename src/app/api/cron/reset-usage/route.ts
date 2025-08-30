import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Reset monthly usage counts (runs on 1st of each month)
export async function GET(request: NextRequest) {
  // Verify this is from Vercel Cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('📊 Resetting monthly usage counts...');
    
    // Call the database function to reset monthly counts
    const { data, error } = await supabase.rpc('reset_monthly_message_counts');
    
    if (error) {
      console.error('Database function error:', error);
      return NextResponse.json({ 
        error: 'Failed to reset usage counts',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Monthly usage counts reset successfully');

    // Log the cron job execution
    await supabase
      .from('cron_logs')
      .insert({
        job_name: 'reset_usage',
        status: 'success',
        executed_at: new Date().toISOString(),
      });

    return NextResponse.json({ 
      success: true,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('Usage reset cron error:', error);
    
    // Log the failed execution
    await supabase
      .from('cron_logs')
      .insert({
        job_name: 'reset_usage',
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