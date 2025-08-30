-- User System Extensions for FinanceFlow SaaS
-- Add to the main database schema

-- ================================
-- USER PROFILES & SUBSCRIPTION MANAGEMENT
-- ================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    
    -- Subscription Management
    subscription_plan VARCHAR(50) DEFAULT 'free' CHECK (subscription_plan IN ('free', 'pro', 'business')),
    subscription_status VARCHAR(50) DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trial')),
    subscription_start_date TIMESTAMP WITH TIME ZONE,
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    
    -- Telegram Integration
    telegram_user_id VARCHAR(255) UNIQUE,
    telegram_chat_id VARCHAR(255),
    telegram_username VARCHAR(255),
    
    -- WhatsApp Integration (future)
    whatsapp_phone_number VARCHAR(50),
    whatsapp_verified BOOLEAN DEFAULT false,
    
    -- Preferences
    default_currency VARCHAR(3) DEFAULT 'VND',
    timezone VARCHAR(100) DEFAULT 'Asia/Ho_Chi_Minh',
    language VARCHAR(10) DEFAULT 'vi',
    
    -- Usage Tracking
    monthly_message_count INTEGER DEFAULT 0,
    last_message_reset_date DATE DEFAULT CURRENT_DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Logs (for billing and analytics)
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Usage Metrics
    source VARCHAR(50) NOT NULL CHECK (source IN ('telegram', 'whatsapp', 'sms', 'web', 'api')),
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('message_processed', 'transaction_created', 'api_call', 'export_data')),
    message_length INTEGER,
    processing_time_ms INTEGER,
    
    -- Metadata
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Plans Reference
CREATE TABLE subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    
    -- Limits
    monthly_messages INTEGER, -- -1 for unlimited
    max_accounts INTEGER DEFAULT 10,
    max_categories INTEGER DEFAULT 50,
    
    -- Features
    features JSONB DEFAULT '{}',
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys (for business users)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- hashed API key
    key_prefix VARCHAR(20) NOT NULL, -- first few chars for display
    name VARCHAR(100) NOT NULL,
    
    -- Permissions
    scopes TEXT[] DEFAULT ARRAY['read'], -- ['read', 'write', 'admin']
    
    -- Usage
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    rate_limit_per_hour INTEGER DEFAULT 100,
    
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- AUTOMATIC USAGE PATTERNS
-- ================================

-- Smart Rules for automatic transaction processing
CREATE TABLE smart_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Rule Conditions
    conditions JSONB NOT NULL, -- e.g., {"keywords": ["salary"], "amount_range": [1000, 5000]}
    
    -- Rule Actions
    actions JSONB NOT NULL, -- e.g., {"category": "Income", "account": "Bank Account"}
    
    -- Rule Priority & Status
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    
    -- Usage Stats
    trigger_count INTEGER DEFAULT 0,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recurring Transactions (for automatic creation)
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Template Transaction
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment', 'debt_payment', 'debt_charge')),
    amount DECIMAL(15,2) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    account_name VARCHAR(100),
    payment_method VARCHAR(100),
    
    -- Recurrence Pattern
    frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    interval_count INTEGER DEFAULT 1, -- every X days/weeks/months
    day_of_month INTEGER, -- for monthly (1-31)
    day_of_week INTEGER, -- for weekly (0-6, 0=Sunday)
    
    -- Schedule
    start_date DATE NOT NULL,
    end_date DATE,
    next_due_date DATE NOT NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    auto_create BOOLEAN DEFAULT true, -- auto-create vs just notify
    
    -- Tracking
    created_count INTEGER DEFAULT 0,
    last_created_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- User Profiles
CREATE INDEX idx_user_profiles_telegram_user_id ON user_profiles(telegram_user_id);
CREATE INDEX idx_user_profiles_subscription_plan ON user_profiles(subscription_plan);
CREATE INDEX idx_user_profiles_stripe_customer_id ON user_profiles(stripe_customer_id);

-- Usage Logs
CREATE INDEX idx_usage_logs_user_id_created_at ON usage_logs(user_id, created_at DESC);
CREATE INDEX idx_usage_logs_source_action ON usage_logs(source, action_type);

-- Smart Rules
CREATE INDEX idx_smart_rules_user_id_active ON smart_rules(user_id, is_active);

-- Recurring Transactions
CREATE INDEX idx_recurring_transactions_next_due ON recurring_transactions(next_due_date) WHERE is_active = true;
CREATE INDEX idx_recurring_transactions_user_id ON recurring_transactions(user_id, is_active);

-- API Keys
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id, is_active);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own usage logs" ON usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert usage logs" ON usage_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage own smart rules" ON smart_rules FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own recurring transactions" ON recurring_transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own API keys" ON api_keys FOR ALL USING (auth.uid() = user_id);

-- Subscription Plans (public read)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active plans" ON subscription_plans FOR SELECT USING (is_active = true);

-- ================================
-- INITIAL DATA
-- ================================

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, monthly_messages, features) VALUES
('free', 'Free', 'Perfect for getting started', 0, 0, 50, 
 '{"telegram_integration": true, "basic_analytics": true, "export_csv": false}'),
('pro', 'Pro', 'For serious expense tracking', 9.99, 99.99, 1000, 
 '{"telegram_integration": true, "advanced_analytics": true, "export_csv": true, "budget_alerts": true, "smart_rules": true}'),
('business', 'Business', 'For teams and power users', 29.99, 299.99, -1, 
 '{"telegram_integration": true, "advanced_analytics": true, "export_csv": true, "api_access": true, "smart_rules": true, "multi_currency": true, "priority_support": true}');

-- ================================
-- FUNCTIONS FOR AUTOMATIC PROCESSING
-- ================================

-- Function to reset monthly message counts
CREATE OR REPLACE FUNCTION reset_monthly_message_counts()
RETURNS void AS $$
BEGIN
    UPDATE user_profiles 
    SET monthly_message_count = 0,
        last_message_reset_date = CURRENT_DATE
    WHERE last_message_reset_date < DATE_TRUNC('month', CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Function to create due recurring transactions
CREATE OR REPLACE FUNCTION create_due_recurring_transactions()
RETURNS INTEGER AS $$
DECLARE
    rec_transaction RECORD;
    transaction_count INTEGER := 0;
BEGIN
    FOR rec_transaction IN 
        SELECT * FROM recurring_transactions 
        WHERE is_active = true 
        AND auto_create = true 
        AND next_due_date <= CURRENT_DATE
    LOOP
        -- Insert the transaction
        INSERT INTO transactions (
            user_id, type, amount, category, description, 
            account_name, payment_method, transaction_date,
            source, notes
        ) VALUES (
            rec_transaction.user_id,
            rec_transaction.type,
            rec_transaction.amount,
            rec_transaction.category,
            rec_transaction.description,
            rec_transaction.account_name,
            rec_transaction.payment_method,
            rec_transaction.next_due_date,
            'recurring',
            'Auto-created from recurring template: ' || rec_transaction.id
        );
        
        -- Update the recurring transaction
        UPDATE recurring_transactions 
        SET created_count = created_count + 1,
            last_created_at = NOW(),
            next_due_date = CASE 
                WHEN frequency = 'daily' THEN next_due_date + (interval_count || ' days')::INTERVAL
                WHEN frequency = 'weekly' THEN next_due_date + (interval_count || ' weeks')::INTERVAL
                WHEN frequency = 'monthly' THEN next_due_date + (interval_count || ' months')::INTERVAL
                WHEN frequency = 'quarterly' THEN next_due_date + (interval_count * 3 || ' months')::INTERVAL
                WHEN frequency = 'yearly' THEN next_due_date + (interval_count || ' years')::INTERVAL
            END
        WHERE id = rec_transaction.id;
        
        transaction_count := transaction_count + 1;
    END LOOP;
    
    RETURN transaction_count;
END;
$$ LANGUAGE plpgsql;