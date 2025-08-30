import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ================================
// MONITORING & LOGGING UTILITIES
// ================================

export class MonitoringService {
  // Log performance metrics
  static async logPerformance(data: {
    endpoint: string;
    method: string;
    statusCode: number;
    responseTimeMs: number;
    dbQueryTimeMs?: number;
    aiProcessingTimeMs?: number;
    userId?: string;
    subscriptionPlan?: string;
  }) {
    try {
      await supabase.from('performance_logs').insert({
        endpoint: data.endpoint,
        method: data.method,
        status_code: data.statusCode,
        response_time_ms: data.responseTimeMs,
        db_query_time_ms: data.dbQueryTimeMs || 0,
        ai_processing_time_ms: data.aiProcessingTimeMs || 0,
        user_id: data.userId,
        subscription_plan: data.subscriptionPlan,
        server_instance: process.env.VERCEL_REGION || 'local',
        memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024,
      });
    } catch (error) {
      console.error('Failed to log performance:', error);
    }
  }

  // Log errors
  static async logError(data: {
    errorType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    stackTrace?: string;
    userId?: string;
    requestPath?: string;
    userAgent?: string;
    ipAddress?: string;
  }) {
    try {
      await supabase.from('error_logs').insert({
        error_type: data.errorType,
        severity: data.severity,
        message: data.message,
        stack_trace: data.stackTrace,
        user_id: data.userId,
        request_path: data.requestPath,
        user_agent: data.userAgent,
        ip_address: data.ipAddress,
      });

      // For critical errors, also send to external monitoring
      if (data.severity === 'critical') {
        await this.sendCriticalAlert(data);
      }
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  // Record health metrics
  static async recordHealthMetrics(metrics: {
    databaseStatus: boolean;
    redisStatus: boolean;
    aiServiceStatus: boolean;
    workerStatus: boolean;
    responseTimeMs: number;
    queueSize?: number;
    processingRatePerMin?: number;
    failedJobsCount?: number;
  }) {
    try {
      // Get current usage stats
      const [activeUsers, messagesToday, transactionsToday] = await Promise.all([
        this.getActiveUsersCount(),
        this.getMessagesProcessedToday(),
        this.getTransactionsCreatedToday(),
      ]);

      await supabase.from('health_metrics').insert({
        database_status: metrics.databaseStatus,
        redis_status: metrics.redisStatus,
        ai_service_status: metrics.aiServiceStatus,
        worker_status: metrics.workerStatus,
        response_time_ms: metrics.responseTimeMs,
        memory_usage_mb: process.memoryUsage().heapUsed / 1024 / 1024,
        queue_size: metrics.queueSize || 0,
        processing_rate_per_min: metrics.processingRatePerMin || 0,
        failed_jobs_count: metrics.failedJobsCount || 0,
        active_users_count: activeUsers,
        messages_processed_today: messagesToday,
        transactions_created_today: transactionsToday,
      });
    } catch (error) {
      console.error('Failed to record health metrics:', error);
    }
  }

  // Send critical alerts
  private static async sendCriticalAlert(errorData: any) {
    try {
      // Send to Slack webhook if configured
      if (process.env.SLACK_WEBHOOK_URL) {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CRITICAL ERROR in FinanceFlow`,
            attachments: [{
              color: 'danger',
              fields: [
                { title: 'Error Type', value: errorData.errorType, short: true },
                { title: 'Message', value: errorData.message, short: false },
                { title: 'Timestamp', value: new Date().toISOString(), short: true },
              ]
            }]
          })
        });
      }

      // Send email alert if configured
      if (process.env.SENDGRID_API_KEY && process.env.ALERT_EMAIL) {
        // Implementation would depend on your email service
        console.log('Would send email alert for critical error');
      }
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  // Get system metrics
  private static async getActiveUsersCount(): Promise<number> {
    try {
      const { count } = await supabase
        .from('usage_logs')
        .select('user_id', { count: 'exact' })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      return count || 0;
    } catch {
      return 0;
    }
  }

  private static async getMessagesProcessedToday(): Promise<number> {
    try {
      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact' })
        .eq('action_type', 'message_processed')
        .gte('created_at', new Date().toISOString().split('T')[0]);
      return count || 0;
    } catch {
      return 0;
    }
  }

  private static async getTransactionsCreatedToday(): Promise<number> {
    try {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .gte('created_at', new Date().toISOString().split('T')[0]);
      return count || 0;
    } catch {
      return 0;
    }
  }

  // Get health summary
  static async getHealthSummary() {
    try {
      const { data, error } = await supabase.rpc('get_health_summary');
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get health summary:', error);
      return null;
    }
  }
}

// Middleware for automatic performance logging
export function withPerformanceLogging(
  handler: (req: any, res?: any) => Promise<Response>,
  endpoint: string
) {
  return async function (req: any, res?: any) {
    const startTime = Date.now();
    const dbStartTime = Date.now();
    
    try {
      const result = await handler(req, res);
      const responseTime = Date.now() - startTime;
      
      // Log successful performance
      await MonitoringService.logPerformance({
        endpoint,
        method: req.method || 'GET',
        statusCode: result.status || 200,
        responseTimeMs: responseTime,
        dbQueryTimeMs: Date.now() - dbStartTime,
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log error performance
      await MonitoringService.logPerformance({
        endpoint,
        method: req.method || 'GET',
        statusCode: 500,
        responseTimeMs: responseTime,
      });

      // Log the error
      await MonitoringService.logError({
        errorType: 'api_error',
        severity: 'high',
        message: error instanceof Error ? error.message : 'Unknown error',
        stackTrace: error instanceof Error ? error.stack : undefined,
        requestPath: endpoint,
      });

      throw error;
    }
  };
}

// Alert thresholds
export const ALERT_THRESHOLDS = {
  responseTime: 5000, // 5 seconds
  errorRate: 0.05, // 5%
  queueSize: 1000,
  memoryUsage: 512, // MB
  failedJobsPerHour: 10,
} as const;