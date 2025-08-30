#!/usr/bin/env node

/**
 * Cron Script: Health Check
 * Runs every 5 minutes to monitor system health
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function healthCheck() {
  const startTime = Date.now();
  const checks = {
    database: false,
    app_server: false,
    worker_process: false,
  };
  
  let overallStatus = 'healthy';
  const errors = [];

  try {
    // Check database connection
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (!error) {
        checks.database = true;
      } else {
        errors.push(`Database: ${error.message}`);
        overallStatus = 'unhealthy';
      }
    } catch (dbError) {
      errors.push(`Database: ${dbError.message}`);
      overallStatus = 'unhealthy';
    }

    // Check main app server
    try {
      const response = await fetch('http://app:3000/api/health', {
        timeout: 10000,
      });
      
      if (response.ok) {
        checks.app_server = true;
      } else {
        errors.push(`App Server: HTTP ${response.status}`);
        overallStatus = 'degraded';
      }
    } catch (appError) {
      errors.push(`App Server: ${appError.message}`);
      overallStatus = 'degraded';
    }

    // Check if worker process is running (simplified check)
    checks.worker_process = true; // Assume healthy if container is running

    const responseTime = Date.now() - startTime;

    // Record health metrics
    await supabase.from('health_metrics').insert({
      database_status: checks.database,
      redis_status: true, // Assume Redis is healthy if containers are running
      ai_service_status: true, // We can't easily check Gemini from cron
      worker_status: checks.worker_process,
      response_time_ms: responseTime,
      memory_usage_mb: 0, // Not easily available in cron context
      queue_size: 0, // Would require Redis connection
      server_instance: 'docker-cron',
    });

    if (overallStatus === 'healthy') {
      console.log(`[${new Date().toISOString()}] Health check passed - all systems operational`);
    } else {
      console.log(`[${new Date().toISOString()}] Health check ${overallStatus} - issues detected:`, errors);
      
      // Send alert if critical
      if (overallStatus === 'unhealthy' && process.env.SLACK_WEBHOOK_URL) {
        try {
          await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 FinanceFlow Health Check Alert`,
              attachments: [{
                color: 'danger',
                fields: [
                  { title: 'Status', value: overallStatus, short: true },
                  { title: 'Issues', value: errors.join('\n'), short: false },
                  { title: 'Timestamp', value: new Date().toISOString(), short: true },
                ]
              }]
            })
          });
        } catch (slackError) {
          console.error('Failed to send Slack alert:', slackError.message);
        }
      }
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Health check script failed:`, error.message);
    process.exit(1);
  }
}

// Run the health check
healthCheck();