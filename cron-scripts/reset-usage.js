#!/usr/bin/env node

/**
 * Cron Script: Reset Monthly Usage Counts
 * Runs monthly on the 1st at midnight
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetUsageCounts() {
  console.log(`[${new Date().toISOString()}] Starting monthly usage reset...`);
  
  try {
    // Call the database function to reset monthly counts
    const { data, error } = await supabase.rpc('reset_monthly_message_counts');
    
    if (error) {
      console.error('Database function error:', error);
      process.exit(1);
    }

    console.log(`[${new Date().toISOString()}] Successfully reset monthly usage counts`);

    // Log the cron job execution
    await supabase
      .from('cron_logs')
      .insert({
        job_name: 'reset_usage',
        status: 'success',
        executed_at: new Date().toISOString(),
        server_instance: 'docker-cron',
      });

    console.log(`[${new Date().toISOString()}] Usage reset cron job completed successfully`);
    process.exit(0);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Usage reset cron job failed:`, error);
    
    // Log the failed execution
    try {
      await supabase
        .from('cron_logs')
        .insert({
          job_name: 'reset_usage',
          status: 'failed',
          error_message: error.message,
          executed_at: new Date().toISOString(),
          server_instance: 'docker-cron',
        });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    process.exit(1);
  }
}

// Run the function
resetUsageCounts();