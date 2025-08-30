-- Monitoring and Logging Extensions for FinanceFlow
-- Add to your main database schema

-- ================================
-- CRON JOB LOGGING
-- ================================

-- Cron Job Execution Logs
CREATE TABLE cron_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
    
    -- Execution Details
    processed_count INTEGER DEFAULT 0,
    error_message TEXT,
    execution_time_ms INTEGER,
    
    -- Metadata
    executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    server_instance VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Health Metrics
CREATE TABLE health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Service Status
    database_status BOOLEAN DEFAULT true,
    redis_status BOOLEAN DEFAULT true,
    ai_service_status BOOLEAN DEFAULT true,
    worker_status BOOLEAN DEFAULT true,
    
    -- Performance Metrics
    response_time_ms INTEGER,
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    
    -- Queue Metrics
    queue_size INTEGER DEFAULT 0,
    processing_rate_per_min INTEGER DEFAULT 0,
    failed_jobs_count INTEGER DEFAULT 0,
    
    -- Business Metrics
    active_users_count INTEGER DEFAULT 0,
    messages_processed_today INTEGER DEFAULT 0,
    transactions_created_today INTEGER DEFAULT 0,
    
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error Tracking
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Error Classification
    error_type VARCHAR(100) NOT NULL, -- 'api_error', 'worker_error', 'database_error'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Error Details
    message TEXT NOT NULL,
    stack_trace TEXT,
    user_id UUID REFERENCES user_profiles(id),
    
    -- Context
    request_path VARCHAR(255),
    user_agent TEXT,
    ip_address INET,
    
    -- Metadata
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Monitoring
CREATE TABLE performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request Info
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER,
    
    -- Timing
    response_time_ms INTEGER NOT NULL,
    db_query_time_ms INTEGER DEFAULT 0,
    ai_processing_time_ms INTEGER DEFAULT 0,
    
    -- User Context
    user_id UUID REFERENCES user_profiles(id),
    subscription_plan VARCHAR(50),
    
    -- System Context
    server_instance VARCHAR(100),
    memory_usage_mb DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR MONITORING TABLES
-- ================================

-- Cron Logs
CREATE INDEX idx_cron_logs_job_name_status ON cron_logs(job_name, status);
CREATE INDEX idx_cron_logs_executed_at ON cron_logs(executed_at DESC);

-- Health Metrics
CREATE INDEX idx_health_metrics_recorded_at ON health_metrics(recorded_at DESC);

-- Error Logs
CREATE INDEX idx_error_logs_type_severity ON error_logs(error_type, severity);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id) WHERE user_id IS NOT NULL;

-- Performance Logs
CREATE INDEX idx_performance_logs_endpoint ON performance_logs(endpoint, created_at DESC);
CREATE INDEX idx_performance_logs_response_time ON performance_logs(response_time_ms DESC);
CREATE INDEX idx_performance_logs_created_at ON performance_logs(created_at DESC);

-- ================================
-- ROW LEVEL SECURITY
-- ================================

-- Enable RLS (only admins can access monitoring data)
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (you'll need to define admin users)
CREATE POLICY "Admin access to cron logs" ON cron_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND subscription_plan = 'admin'
  ));

CREATE POLICY "Admin access to health metrics" ON health_metrics FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND subscription_plan = 'admin'
  ));

CREATE POLICY "Admin access to error logs" ON error_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND subscription_plan = 'admin'
  ));

CREATE POLICY "Admin access to performance logs" ON performance_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() 
    AND subscription_plan = 'admin'
  ));

-- Service role can always insert (for system logging)
CREATE POLICY "Service can log cron jobs" ON cron_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can log health metrics" ON health_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can log errors" ON error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can log performance" ON performance_logs FOR INSERT WITH CHECK (true);

-- ================================
-- MONITORING FUNCTIONS
-- ================================

-- Function to clean up old logs (run weekly)
CREATE OR REPLACE FUNCTION cleanup_monitoring_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Keep only last 30 days of cron logs
    DELETE FROM cron_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Keep only last 7 days of health metrics
    DELETE FROM health_metrics 
    WHERE recorded_at < NOW() - INTERVAL '7 days';
    
    -- Keep only last 90 days of error logs
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Keep only last 7 days of performance logs
    DELETE FROM performance_logs 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION get_health_summary()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'last_health_check', (
            SELECT recorded_at FROM health_metrics 
            ORDER BY recorded_at DESC LIMIT 1
        ),
        'recent_errors', (
            SELECT COUNT(*) FROM error_logs 
            WHERE created_at > NOW() - INTERVAL '1 hour'
        ),
        'failed_cron_jobs', (
            SELECT COUNT(*) FROM cron_logs 
            WHERE status = 'failed' 
            AND executed_at > NOW() - INTERVAL '24 hours'
        ),
        'avg_response_time', (
            SELECT AVG(response_time_ms) FROM performance_logs 
            WHERE created_at > NOW() - INTERVAL '1 hour'
        ),
        'active_users_today', (
            SELECT COUNT(DISTINCT user_id) FROM usage_logs 
            WHERE created_at::date = CURRENT_DATE
        ),
        'messages_processed_today', (
            SELECT COUNT(*) FROM usage_logs 
            WHERE created_at::date = CURRENT_DATE
            AND action_type = 'message_processed'
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;