#!/usr/bin/env node

/**
 * Cron Script: Process Recurring Transactions
 * Runs daily at 6 AM to create due recurring transactions
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function processRecurringTransactions() {
  console.log(`[${new Date().toISOString()}] Starting recurring transactions processing...`);
  
  try {
    // Call the database function to process due recurring transactions
    const { data, error } = await supabase.rpc('create_due_recurring_transactions');
    
    if (error) {
      console.error('Database function error:', error);
      process.exit(1);
    }

    const processedCount = data || 0;
    console.log(`[${new Date().toISOString()}] Successfully processed ${processedCount} recurring transactions`);

    // Log the cron job execution
    await supabase
      .from('cron_logs')
      .insert({
        job_name: 'recurring_transactions',
        status: 'success',
        processed_count: processedCount,
        executed_at: new Date().toISOString(),
        server_instance: 'docker-cron',
      });

    console.log(`[${new Date().toISOString()}] Recurring transactions cron job completed successfully`);
    process.exit(0);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Recurring transactions cron job failed:`, error);
    
    // Log the failed execution
    try {
      await supabase
        .from('cron_logs')
        .insert({
          job_name: 'recurring_transactions',
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
processRecurringTransactions();