-- Personal Finance Tracking Database Schema for Supabase
-- Designed for scalability and predictive analytics

-- ================================
-- 1. CORE REFERENCE TABLES
-- ================================

-- Payment Methods Table
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL CHECK (category IN ('cash', 'debit_card', 'credit_card', 'bank_transfer', 'e_wallet', 'qr_code', 'other')),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories Table (Hierarchical)
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment', 'debt')),
    parent_id UUID REFERENCES categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, type)
);

-- ================================
-- 2. ACCOUNT MANAGEMENT
-- ================================

-- Financial Accounts (Banks, Credit Cards, Wallets)
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('checking', 'savings', 'credit_card', 'e_wallet', 'cash', 'investment', 'loan')),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'VND',
    current_balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2), -- for credit cards
    interest_rate DECIMAL(5,4), -- annual interest rate
    opening_date DATE,
    closing_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 3. CORE TRANSACTION TABLE
-- ================================

-- Main Transactions Table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment', 'debt_payment', 'debt_charge')),
    category_id UUID REFERENCES categories(id),
    from_account_id UUID REFERENCES accounts(id), -- source account
    to_account_id UUID REFERENCES accounts(id), -- destination account (for transfers)
    payment_method_id UUID REFERENCES payment_methods(id),
    counterparty VARCHAR(200), -- person/organization involved
    purpose TEXT NOT NULL, -- transaction description
    summary TEXT, -- AI-generated summary
    notes TEXT, -- additional notes
    reference_number VARCHAR(100), -- bank reference, receipt number
    telegram_message_id VARCHAR(100), -- link to original telegram message
    is_recurring BOOLEAN DEFAULT false,
    recurring_frequency VARCHAR(20), -- 'weekly', 'monthly', 'yearly'
    next_occurrence DATE, -- for recurring transactions
    tags TEXT[], -- array of tags for better categorization
    location VARCHAR(200), -- where transaction occurred
    exchange_rate DECIMAL(10,6), -- if multi-currency
    original_amount DECIMAL(15,2), -- original amount in foreign currency
    original_currency VARCHAR(3),
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(100), -- user who deleted the record
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, transaction_date)
) PARTITION BY RANGE (transaction_date);

-- Default partition for dates outside predefined ranges
CREATE TABLE transactions_default PARTITION OF transactions DEFAULT;

-- ================================
-- 4. SPECIALIZED TABLES
-- ================================

-- Income Streams Tracking
CREATE TABLE income_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_id UUID,
    transaction_date DATE, -- needed for partitioned table reference
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('salary', 'freelance', 'investment_return', 'business', 'rental', 'bonus', 'gift', 'other')),
    employer_name VARCHAR(200),
    project_name VARCHAR(200), -- for freelance work
    is_recurring BOOLEAN DEFAULT false,
    frequency VARCHAR(20), -- 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'annually'
    next_expected_date DATE,
    expected_amount DECIMAL(15,2),
    tax_category VARCHAR(50),
    tax_rate DECIMAL(5,4),
    net_amount DECIMAL(15,2), -- after tax
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (transaction_id, transaction_date) REFERENCES transactions(id, transaction_date) ON DELETE CASCADE
);

-- Debt and Liability Management
CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    debt_type VARCHAR(50) NOT NULL CHECK (debt_type IN ('credit_card', 'personal_loan', 'mortgage', 'car_loan', 'student_loan', 'business_loan', 'other')),
    creditor_name VARCHAR(200) NOT NULL,
    original_amount DECIMAL(15,2) NOT NULL,
    current_balance DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,4) NOT NULL,
    minimum_payment DECIMAL(15,2),
    payment_due_day INTEGER CHECK (payment_due_day BETWEEN 1 AND 31),
    loan_term_months INTEGER,
    start_date DATE NOT NULL,
    maturity_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset and Investment Tracking
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('real_estate', 'gold', 'stocks', 'bonds', 'crypto', 'mutual_fund', 'savings_account', 'business', 'vehicle', 'other')),
    symbol VARCHAR(20), -- for stocks/crypto
    quantity DECIMAL(15,6) NOT NULL DEFAULT 1,
    purchase_price DECIMAL(15,2) NOT NULL,
    purchase_date DATE NOT NULL,
    current_price DECIMAL(15,2),
    current_value DECIMAL(15,2),
    location VARCHAR(200), -- for real estate
    broker VARCHAR(100), -- for investments
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(100),
    last_price_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budget Planning and Goals
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES categories(id),
    period_type VARCHAR(20) NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    budget_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    alert_threshold DECIMAL(3,2) DEFAULT 0.8, -- alert when 80% spent
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Goals (House, Investment targets, etc.)
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('emergency_fund', 'house_down_payment', 'investment', 'vacation', 'retirement', 'debt_payoff', 'other')),
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    target_date DATE,
    priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
    is_achieved BOOLEAN DEFAULT false,
    achievement_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- 5. AUDIT AND TRACKING
-- ================================

-- Transaction Audit Trail
CREATE TABLE transaction_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID,
    transaction_date DATE, -- needed for partitioned table reference
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by VARCHAR(100), -- user or system
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (transaction_id, transaction_date) REFERENCES transactions(id, transaction_date)
);

-- Account Balance History (for tracking balance changes over time)
CREATE TABLE account_balance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES accounts(id),
    balance DECIMAL(15,2) NOT NULL,
    balance_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, balance_date)
);

-- ================================
-- 6. RELATIONSHIPS AND CONSTRAINTS
-- ================================

-- Add foreign key constraints with proper names
ALTER TABLE categories ADD CONSTRAINT fk_categories_parent
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE transactions ADD CONSTRAINT fk_transactions_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Note: Account references will be validated by triggers to ensure same-user access
-- Cross-user foreign keys removed for multi-tenant security

ALTER TABLE transactions ADD CONSTRAINT fk_transactions_payment_method
    FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;

-- Ensure transfer transactions have both accounts
ALTER TABLE transactions ADD CONSTRAINT chk_transfer_accounts
    CHECK (
        (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL)
        OR (type != 'transfer')
    );

-- Ensure non-transfer transactions have at least one account
ALTER TABLE transactions ADD CONSTRAINT chk_transaction_account
    CHECK (from_account_id IS NOT NULL OR to_account_id IS NOT NULL);

-- Note: Debt payment validation will be handled by application logic or triggers
-- since PostgreSQL doesn't allow subqueries in check constraints

-- ================================
-- 7. TRIGGERS AND FUNCTIONS
-- ================================

-- Function to validate transaction accounts and debt payments
CREATE OR REPLACE FUNCTION validate_transaction_accounts()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate accounts belong to same user
    IF NEW.from_account_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM accounts
            WHERE id = NEW.from_account_id
            AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'from_account_id must belong to the same user';
        END IF;
    END IF;

    IF NEW.to_account_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM accounts
            WHERE id = NEW.to_account_id
            AND user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'to_account_id must belong to the same user';
        END IF;
    END IF;

    -- Validate debt payments reference correct account types
    IF NEW.type IN ('debt_payment', 'debt_charge') THEN
        IF NOT EXISTS (
            SELECT 1 FROM accounts
            WHERE id IN (NEW.from_account_id, NEW.to_account_id)
            AND user_id = NEW.user_id
            AND type IN ('credit_card', 'loan')
        ) THEN
            RAISE EXCEPTION 'Debt payment transactions must reference a credit_card or loan account';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update account balance
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle INSERT operations
    IF TG_OP = 'INSERT' THEN
        -- Debit from source account
        IF NEW.from_account_id IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.from_account_id;
        END IF;

        -- Credit to destination account
        IF NEW.to_account_id IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.to_account_id;
        END IF;

        RETURN NEW;

    -- Handle UPDATE operations
    ELSIF TG_OP = 'UPDATE' THEN
        -- Reverse old transaction first
        IF OLD.from_account_id IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance + OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.from_account_id;
        END IF;

        IF OLD.to_account_id IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance - OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.to_account_id;
        END IF;

        -- Apply new transaction
        IF NEW.from_account_id IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance - NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.from_account_id;
        END IF;

        IF NEW.to_account_id IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance + NEW.amount,
                updated_at = NOW()
            WHERE id = NEW.to_account_id;
        END IF;

        RETURN NEW;

    -- Handle DELETE operations
    ELSIF TG_OP = 'DELETE' THEN
        -- Reverse the transaction
        IF OLD.from_account_id IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance + OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.from_account_id;
        END IF;

        IF OLD.to_account_id IS NOT NULL THEN
            UPDATE accounts
            SET current_balance = current_balance - OLD.amount,
                updated_at = NOW()
            WHERE id = OLD.to_account_id;
        END IF;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate transaction accounts and debt payments
CREATE TRIGGER trigger_validate_transaction_accounts
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction_accounts();

-- Trigger to automatically update account balances
CREATE TRIGGER trigger_update_account_balance
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_account_balance();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER trigger_update_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_debts_updated_at
    BEFORE UPDATE ON debts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_financial_goals_updated_at
    BEFORE UPDATE ON financial_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update budget spent amount
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
    budget_record RECORD;
    transaction_user_id UUID;
    transaction_category_id UUID;
    transaction_date DATE;
    transaction_type VARCHAR(50);
BEGIN
    -- Determine which record to use based on operation
    IF TG_OP = 'DELETE' THEN
        transaction_user_id := OLD.user_id;
        transaction_category_id := OLD.category_id;
        transaction_date := OLD.transaction_date;
        transaction_type := OLD.type;
    ELSE
        transaction_user_id := NEW.user_id;
        transaction_category_id := NEW.category_id;
        transaction_date := NEW.transaction_date;
        transaction_type := NEW.type;
    END IF;

    -- Update budget spent amount for expense transactions
    IF transaction_type = 'expense' AND transaction_category_id IS NOT NULL THEN
        -- Find all budgets that match this transaction
        FOR budget_record IN
            SELECT id, start_date, end_date
            FROM budgets
            WHERE category_id = transaction_category_id
            AND user_id = transaction_user_id
            AND transaction_date BETWEEN start_date AND end_date
            AND is_active = true
        LOOP
            -- Update each matching budget
            UPDATE budgets
            SET spent_amount = (
                SELECT COALESCE(SUM(t.amount), 0)
                FROM transactions t
                WHERE t.category_id = transaction_category_id
                AND t.user_id = transaction_user_id
                AND t.type = 'expense'
                AND t.is_deleted = false
                AND t.transaction_date BETWEEN budget_record.start_date AND budget_record.end_date
            ),
            updated_at = NOW()
            WHERE id = budget_record.id;
        END LOOP;
    END IF;

    -- Handle UPDATE operations - need to check both OLD and NEW records
    IF TG_OP = 'UPDATE' AND (OLD.category_id != NEW.category_id OR OLD.amount != NEW.amount OR OLD.type != NEW.type) THEN
        -- Update budgets for old category if it was an expense
        IF OLD.type = 'expense' AND OLD.category_id IS NOT NULL AND OLD.category_id != NEW.category_id THEN
            FOR budget_record IN
                SELECT id, start_date, end_date
                FROM budgets
                WHERE category_id = OLD.category_id
                AND user_id = OLD.user_id
                AND OLD.transaction_date BETWEEN start_date AND end_date
                AND is_active = true
            LOOP
                UPDATE budgets
                SET spent_amount = (
                    SELECT COALESCE(SUM(t.amount), 0)
                    FROM transactions t
                    WHERE t.category_id = OLD.category_id
                    AND t.user_id = OLD.user_id
                    AND t.type = 'expense'
                    AND t.is_deleted = false
                    AND t.transaction_date BETWEEN budget_record.start_date AND budget_record.end_date
                ),
                updated_at = NOW()
                WHERE id = budget_record.id;
            END LOOP;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for budget updates
CREATE TRIGGER trigger_update_budget_spent
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_spent();

-- Function to update goal progress
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update current_amount based on savings towards goals
    -- This assumes you tag transactions for specific goals
    IF NEW.tags IS NOT NULL THEN
        -- Update goals that match transaction tags
        UPDATE financial_goals
        SET current_amount = current_amount +
            CASE WHEN NEW.type = 'expense' THEN -NEW.amount
                 ELSE NEW.amount END,
            updated_at = NOW()
        WHERE name = ANY(NEW.tags)
        AND user_id = NEW.user_id
        AND is_achieved = false;

        -- Check if goal is achieved and update status
        UPDATE financial_goals
        SET is_achieved = true,
            achievement_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE name = ANY(NEW.tags)
        AND user_id = NEW.user_id
        AND current_amount >= target_amount
        AND is_achieved = false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for goal progress
CREATE TRIGGER trigger_update_goal_progress
    AFTER INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_progress();

-- Function for transaction audit trail
CREATE OR REPLACE FUNCTION log_transaction_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO transaction_audit (
            transaction_id, transaction_date, action, old_values, new_values, changed_by
        ) VALUES (
            NEW.id, NEW.transaction_date, 'INSERT', NULL, to_jsonb(NEW), 'system'
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO transaction_audit (
            transaction_id, transaction_date, action, old_values, new_values, changed_by
        ) VALUES (
            NEW.id, NEW.transaction_date, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), 'system'
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO transaction_audit (
            transaction_id, transaction_date, action, old_values, new_values, changed_by
        ) VALUES (
            OLD.id, OLD.transaction_date, 'DELETE', to_jsonb(OLD), NULL, 'system'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transaction audit
CREATE TRIGGER trigger_log_transaction_changes
    AFTER INSERT OR UPDATE OR DELETE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION log_transaction_changes();

-- Function to create partition if not exists
CREATE OR REPLACE FUNCTION create_partition_if_not_exists(partition_date DATE)
RETURNS BOOLEAN AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
    partition_exists BOOLEAN;
BEGIN
    -- Calculate partition boundaries (monthly)
    start_date := DATE_TRUNC('month', partition_date);
    end_date := start_date + INTERVAL '1 month';
    partition_name := 'transactions_' || TO_CHAR(start_date, 'YYYY_MM');

    -- Check if partition exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = partition_name
    ) INTO partition_exists;

    -- Create partition if it doesn't exist
    IF NOT partition_exists THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF transactions FOR VALUES FROM (%L) TO (%L)',
            partition_name,
            start_date,
            end_date
        );

        RAISE NOTICE 'Created partition % for date range % to %',
                    partition_name, start_date, end_date;
        RETURN true;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create partition before insert
CREATE OR REPLACE FUNCTION ensure_partition_exists()
RETURNS TRIGGER AS $$
BEGIN
    -- Create partition for the transaction date if needed
    PERFORM create_partition_if_not_exists(NEW.transaction_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create partitions
CREATE TRIGGER trigger_ensure_partition_exists
    BEFORE INSERT ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION ensure_partition_exists();

-- Function for soft delete
CREATE OR REPLACE FUNCTION soft_delete_transaction(transaction_id UUID, transaction_date_param DATE)
RETURNS BOOLEAN AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE transactions
    SET is_deleted = true,
        deleted_at = NOW(),
        deleted_by = 'user' -- Could be enhanced to get actual user
    WHERE id = transaction_id
    AND transaction_date = transaction_date_param
    AND user_id = auth.uid()
    AND is_deleted = false;

    GET DIAGNOSTICS affected_rows = ROW_COUNT;

    -- Return true if transaction was soft deleted
    RETURN affected_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 8. INDEXES FOR PERFORMANCE
-- ================================

-- Primary indexes for fast queries
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_user_from_account ON transactions(user_id, from_account_id);
CREATE INDEX idx_transactions_user_to_account ON transactions(user_id, to_account_id);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);

-- Composite indexes for common query patterns (user-scoped)
CREATE INDEX idx_transactions_user_date_type ON transactions(user_id, transaction_date DESC, type);
CREATE INDEX idx_transactions_user_account_date ON transactions(user_id, from_account_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_category_date ON transactions(user_id, category_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_amount_date ON transactions(user_id, amount DESC, transaction_date DESC);
CREATE INDEX idx_transactions_user_counterparty ON transactions(user_id, counterparty);

-- Text search indexes for AI processing
CREATE INDEX idx_transactions_purpose_gin ON transactions USING gin(to_tsvector('english', purpose));
CREATE INDEX idx_transactions_summary_gin ON transactions USING gin(to_tsvector('english', summary));

-- Indexes for specialized tables (user-scoped)
CREATE INDEX idx_accounts_user ON accounts(user_id);
CREATE INDEX idx_income_streams_user_source_type ON income_streams(user_id, source_type);
CREATE INDEX idx_income_streams_user_next_expected ON income_streams(user_id, next_expected_date);
CREATE INDEX idx_debts_user_active ON debts(user_id, is_active, payment_due_day);
CREATE INDEX idx_assets_user_type ON assets(user_id, asset_type);
CREATE INDEX idx_assets_user_value ON assets(user_id, current_value DESC);
CREATE INDEX idx_budgets_user ON budgets(user_id);
CREATE INDEX idx_financial_goals_user ON financial_goals(user_id);

-- Account balance history index
CREATE INDEX idx_balance_history_account_date ON account_balance_history(account_id, balance_date DESC);

-- Budget tracking indexes (user-scoped)
CREATE INDEX idx_budgets_user_active_period ON budgets(user_id, is_active, start_date, end_date);
CREATE INDEX idx_goals_user_active_priority ON financial_goals(user_id, is_achieved, priority);

-- ================================
-- 9. VIEWS FOR COMMON QUERIES
-- ================================

-- Monthly spending summary view (user-filtered)
CREATE VIEW monthly_spending_summary AS
SELECT
    t.user_id,
    DATE_TRUNC('month', t.transaction_date) as month,
    c.name as category_name,
    c.type as category_type,
    SUM(t.amount) as total_amount,
    COUNT(*) as transaction_count,
    AVG(t.amount) as avg_amount
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.type = 'expense'
AND t.user_id = auth.uid()
AND t.is_deleted = false
GROUP BY t.user_id, DATE_TRUNC('month', t.transaction_date), c.id, c.name, c.type
ORDER BY month DESC, total_amount DESC;

-- Account balance summary view (user-filtered)
CREATE VIEW account_balance_summary AS
SELECT
    a.id,
    a.user_id,
    a.name,
    a.type,
    a.bank_name,
    a.current_balance,
    a.credit_limit,
    CASE
        WHEN a.type = 'credit_card' THEN a.credit_limit - a.current_balance
        ELSE a.current_balance
    END as available_balance,
    a.updated_at as last_updated
FROM accounts a
WHERE a.is_active = true AND a.user_id = auth.uid()
ORDER BY a.type, a.name;

-- Net worth calculation view (user-filtered)
CREATE VIEW net_worth_summary AS
SELECT
    auth.uid() as user_id,
    'Assets' as category,
    SUM(current_value) as total_value
FROM assets
WHERE user_id = auth.uid()
UNION ALL
SELECT
    auth.uid() as user_id,
    'Liquid Assets' as category,
    SUM(current_balance) as total_value
FROM accounts
WHERE type IN ('checking', 'savings', 'e_wallet', 'cash')
AND is_active = true
AND user_id = auth.uid()
UNION ALL
SELECT
    auth.uid() as user_id,
    'Liabilities' as category,
    -SUM(current_balance) as total_value
FROM accounts
WHERE type IN ('credit_card', 'loan')
AND is_active = true
AND user_id = auth.uid();

-- Recent transactions view with full details (user-filtered)
CREATE VIEW recent_transactions_detailed AS
SELECT
    t.id,
    t.user_id,
    t.transaction_date,
    t.amount,
    t.type,
    c.name as category_name,
    fa.name as from_account_name,
    ta.name as to_account_name,
    pm.name as payment_method_name,
    t.counterparty,
    t.purpose,
    t.summary,
    t.created_at
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts fa ON t.from_account_id = fa.id
LEFT JOIN accounts ta ON t.to_account_id = ta.id
LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
WHERE t.user_id = auth.uid() AND t.is_deleted = false
ORDER BY t.transaction_date DESC, t.created_at DESC
LIMIT 100;

-- ================================
-- 10. ROW LEVEL SECURITY (RLS)
-- ================================

-- Enable RLS on all tables
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_balance_history ENABLE ROW LEVEL SECURITY;

-- Reference data policies (shared across all users)
CREATE POLICY "Users can view all payment methods" ON payment_methods FOR SELECT USING (true);
CREATE POLICY "Users can view all categories" ON categories FOR SELECT USING (true);

-- User-specific data policies (users only see their own data)
CREATE POLICY "Users can manage their own accounts" ON accounts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own income streams" ON income_streams FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own debts" ON debts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own assets" ON assets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own budgets" ON budgets FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own financial goals" ON financial_goals FOR ALL USING (user_id = auth.uid());

-- Audit trail policies (users can only see their own transaction audits)
CREATE POLICY "Users can view their own transaction audits" ON transaction_audit FOR SELECT USING (
    transaction_id IN (SELECT id FROM transactions WHERE user_id = auth.uid())
);

-- Account balance history policies
CREATE POLICY "Users can view their own account balance history" ON account_balance_history FOR ALL USING (
    account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid())
);
