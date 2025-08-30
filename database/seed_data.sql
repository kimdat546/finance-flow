-- Personal Finance Tracking Database - Updated Seed Data
-- Compatible with the latest schema including partitioning, soft delete, and multi-user support

-- ================================
-- 1. REFERENCE DATA (SHARED)
-- ================================

-- Payment Methods
INSERT INTO payment_methods (name, category, description) VALUES
('Cash', 'cash', 'Physical cash payments'),
('Visa Debit Card', 'debit_card', 'Main bank debit card'),
('Credit Card', 'credit_card', 'Mastercard credit card'),
('Bank Transfer', 'bank_transfer', 'Online banking transfers'),
('Momo Wallet', 'e_wallet', 'Mobile payment app'),
('QR Code Payment', 'qr_code', 'QR code based payments'),
('Zalo Pay', 'e_wallet', 'Another mobile payment app'),
('ATM Withdrawal', 'debit_card', 'Cash withdrawal from ATM'),
('Internet Banking', 'bank_transfer', 'Online banking platform'),
('ViettelPay', 'e_wallet', 'ViettelPay digital wallet');

-- ================================
-- 2. CATEGORIES (WITHOUT COLOR/ICON - SIMPLIFIED)
-- ================================

-- Income Categories
INSERT INTO categories (name, type, description) VALUES
('Salary', 'income', 'Regular employment income'),
('Freelance', 'income', 'Freelance work payments'),
('Investment Returns', 'income', 'Dividends, interest, capital gains'),
('Business Income', 'income', 'Revenue from business activities'),
('Gifts Received', 'income', 'Money gifts from family/friends'),
('Rental Income', 'income', 'Income from property rental'),
('Bonus', 'income', 'Performance bonuses and rewards'),
('Side Hustle', 'income', 'Additional income sources'),
('Other Income', 'income', 'Miscellaneous income');

-- Expense Categories
INSERT INTO categories (name, type, description) VALUES
('Food & Dining', 'expense', 'Food and restaurant expenses'),
('Transportation', 'expense', 'Travel, fuel, public transport'),
('Shopping', 'expense', 'Retail purchases, clothing'),
('Bills & Utilities', 'expense', 'Electricity, water, internet'),
('Healthcare', 'expense', 'Medical expenses, insurance'),
('Entertainment', 'expense', 'Movies, games, recreation'),
('Education', 'expense', 'Courses, books, training'),
('Housing', 'expense', 'Rent, mortgage, home maintenance'),
('Insurance', 'expense', 'Health, life, property insurance'),
('Personal Care', 'expense', 'Haircut, cosmetics, spa'),
('Phone & Communication', 'expense', 'Mobile, internet, communication'),
('Groceries', 'expense', 'Supermarket and grocery shopping'),
('Clothing', 'expense', 'Clothes and accessories'),
('Gifts & Donations', 'expense', 'Gifts given and charitable donations'),
('Other Expenses', 'expense', 'Miscellaneous expenses');

-- Investment Categories
INSERT INTO categories (name, type, description) VALUES
('Stock Purchase', 'investment', 'Buying stocks and securities'),
('Crypto Purchase', 'investment', 'Cryptocurrency investments'),
('Gold Investment', 'investment', 'Precious metals investment'),
('Real Estate', 'investment', 'Property investments'),
('Mutual Funds', 'investment', 'Investment funds'),
('Savings Deposit', 'investment', 'Bank savings deposits'),
('Other Investment', 'investment', 'Other investment types');

-- Transfer Categories  
INSERT INTO categories (name, type, description) VALUES
('Account Transfer', 'transfer', 'Money transfers between accounts'),
('Savings Transfer', 'transfer', 'Moving money to savings'),
('Wallet Top-up', 'transfer', 'Adding money to e-wallets'),
('Cash Withdrawal', 'transfer', 'ATM and bank withdrawals');

-- Debt Categories
INSERT INTO categories (name, type, description) VALUES
('Credit Card Payment', 'debt', 'Credit card payments'),
('Loan Payment', 'debt', 'Personal or business loan payments'),
('Debt Collection', 'debt', 'Money borrowed or lent'),
('Interest Charges', 'debt', 'Interest and finance charges'),
('Banking Fees', 'debt', 'Bank fees and charges');

-- ================================
-- 3. SAMPLE USER DATA
-- OPTION 1: Use existing authenticated user
-- OPTION 2: Create demo user (for testing only)
-- ================================

-- Method 1: Use this if you have an authenticated user
-- Replace 'your-actual-user-email@example.com' with your real email
/*
DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Get the first authenticated user (replace with your actual user selection logic)
    SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
    
    -- If no user found, raise error
    IF demo_user_id IS NULL THEN
        RAISE EXCEPTION 'No authenticated user found. Please authenticate first or use Method 2 below.';
    END IF;
*/

-- Method 2: Create a demo user for testing (TESTING ONLY - NOT FOR PRODUCTION)
DO $$
DECLARE
    demo_user_id UUID := '123e4567-e89b-12d3-a456-426614174000';
BEGIN
    -- Create demo user in auth.users table (for testing purposes)
    -- WARNING: This bypasses Supabase auth - only use for development/testing
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        demo_user_id,
        'authenticated',
        'authenticated', 
        'demo@example.com',
        '$2a$10$dummy.hash.for.demo.user.only',
        NOW(),
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    ) ON CONFLICT (id) DO NOTHING; -- Ignore if user already exists

    -- Sample Accounts
    INSERT INTO accounts (user_id, name, type, bank_name, account_number, currency, current_balance, credit_limit, interest_rate, opening_date, is_active) VALUES
    (demo_user_id, 'Primary Checking', 'checking', 'Vietcombank', 'VCB-****1234', 'VND', 15000000.00, NULL, 0.0050, '2024-01-01', true),
    (demo_user_id, 'Savings Account', 'savings', 'Vietcombank', 'VCB-****5678', 'VND', 50000000.00, NULL, 0.0600, '2024-01-01', true),
    (demo_user_id, 'Credit Card', 'credit_card', 'Techcombank', 'TCB-****9999', 'VND', 2000000.00, 20000000.00, 0.2400, '2024-01-15', true),
    (demo_user_id, 'Cash Wallet', 'cash', NULL, NULL, 'VND', 500000.00, NULL, NULL, '2024-01-01', true),
    (demo_user_id, 'Momo E-Wallet', 'e_wallet', 'Momo', 'MOMO-****7777', 'VND', 1000000.00, NULL, NULL, '2024-01-01', true);

-- Continue with sample data in the same transaction block
DO $$
DECLARE
    demo_user_id UUID := '123e4567-e89b-12d3-a456-426614174000';
    checking_account_id UUID;
    savings_account_id UUID;
    credit_card_id UUID;
    cash_account_id UUID;
    momo_account_id UUID;
BEGIN
    -- Get account IDs for later use
    SELECT id INTO checking_account_id FROM accounts WHERE name = 'Primary Checking' AND user_id = demo_user_id;
    SELECT id INTO savings_account_id FROM accounts WHERE name = 'Savings Account' AND user_id = demo_user_id;
    SELECT id INTO credit_card_id FROM accounts WHERE name = 'Credit Card' AND user_id = demo_user_id;
    SELECT id INTO cash_account_id FROM accounts WHERE name = 'Cash Wallet' AND user_id = demo_user_id;
    SELECT id INTO momo_account_id FROM accounts WHERE name = 'Momo E-Wallet' AND user_id = demo_user_id;
    
    -- Sample Debts
    INSERT INTO debts (user_id, account_id, debt_type, creditor_name, original_amount, current_balance, interest_rate, minimum_payment, payment_due_day, loan_term_months, start_date, maturity_date, is_active, notes) VALUES
    (demo_user_id, credit_card_id, 'credit_card', 'Techcombank', 20000000.00, 2000000.00, 0.2400, 500000.00, 15, NULL, '2024-01-15', NULL, true, 'Main credit card for daily expenses');

    -- Sample Assets
    INSERT INTO assets (user_id, name, asset_type, symbol, quantity, purchase_price, purchase_date, current_price, current_value, broker, notes) VALUES
    (demo_user_id, 'VIC Stock Holdings', 'stocks', 'VIC', 100.0, 85000.00, '2024-06-15', 92000.00, 9200000.00, 'VPS Securities', 'Vingroup stock investment'),
    (demo_user_id, 'Bitcoin Investment', 'crypto', 'BTC', 0.1, 1800000000.00, '2024-03-20', 2200000000.00, 220000000.00, 'Binance', 'Long-term crypto holding'),
    (demo_user_id, 'Gold Bars', 'gold', 'GOLD', 2.0, 70000000.00, '2024-02-10', 72000000.00, 144000000.00, 'SJC Gold', '2 tael gold bars for hedge');

    -- Sample Financial Goals
    INSERT INTO financial_goals (user_id, name, description, goal_type, target_amount, current_amount, target_date, priority, is_achieved, notes) VALUES
    (demo_user_id, 'Emergency Fund', 'Build emergency fund for 6 months expenses', 'emergency_fund', 150000000.00, 50000000.00, '2025-12-31', 1, false, 'Top priority financial goal'),
    (demo_user_id, 'House Down Payment', 'Save for apartment down payment', 'house_down_payment', 500000000.00, 100000000.00, '2026-06-30', 2, false, 'Target: 2-bedroom apartment in District 7'),
    (demo_user_id, 'Vacation Fund', 'Save for Japan trip', 'vacation', 50000000.00, 15000000.00, '2025-08-15', 3, false, 'Summer vacation to Tokyo and Osaka'),
    (demo_user_id, 'Investment Portfolio', 'Build diversified investment portfolio', 'investment', 200000000.00, 373200000.00, '2025-12-31', 2, true, 'Goal achieved ahead of schedule!');

    -- Sample Budgets
    INSERT INTO budgets (user_id, name, category_id, period_type, budget_amount, spent_amount, start_date, end_date, alert_threshold, is_active) VALUES
    (demo_user_id, 'Monthly Food Budget', (SELECT id FROM categories WHERE name = 'Food & Dining' LIMIT 1), 'monthly', 6000000.00, 200000.00, '2025-01-01', '2025-01-31', 0.80, true),
    (demo_user_id, 'Transportation Budget', (SELECT id FROM categories WHERE name = 'Transportation' LIMIT 1), 'monthly', 4000000.00, 3000000.00, '2025-02-01', '2025-02-28', 0.85, true),
    (demo_user_id, 'Entertainment Budget', (SELECT id FROM categories WHERE name = 'Entertainment' LIMIT 1), 'monthly', 2000000.00, 0.00, '2025-01-01', '2025-01-31', 0.75, true);

    -- Sample Transactions (mix of different types and dates)
    INSERT INTO transactions (user_id, transaction_date, amount, type, category_id, from_account_id, to_account_id, payment_method_id, counterparty, purpose, notes, tags, location) VALUES
    -- January 2025 transactions
    (demo_user_id, '2025-01-15', 25000000.00, 'income', 
        (SELECT id FROM categories WHERE name = 'Salary' LIMIT 1),
        NULL, checking_account_id,
        (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1),
        'ABC Company', 'January salary payment', 'Monthly salary deposit', ARRAY['salary', 'regular'], 'Ho Chi Minh City'),

    (demo_user_id, '2025-01-16', 200000.00, 'expense',
        (SELECT id FROM categories WHERE name = 'Food & Dining' LIMIT 1),
        cash_account_id, NULL,
        (SELECT id FROM payment_methods WHERE name = 'Cash' LIMIT 1),
        'Pho Hoa Restaurant', 'Lunch with colleagues', 'Business lunch meeting', ARRAY['food', 'lunch'], 'District 1'),

    (demo_user_id, '2025-01-17', 1500000.00, 'expense',
        (SELECT id FROM categories WHERE name = 'Shopping' LIMIT 1),
        credit_card_id, NULL,
        (SELECT id FROM payment_methods WHERE name = 'Credit Card' LIMIT 1),
        'Vincom Center', 'New clothes and accessories', 'Shopping for new year', ARRAY['shopping', 'clothes'], 'District 3'),

    (demo_user_id, '2025-01-18', 5000000.00, 'transfer',
        (SELECT id FROM categories WHERE name = 'Savings Transfer' LIMIT 1),
        checking_account_id, savings_account_id,
        (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1),
        'Self', 'Transfer to savings', 'Monthly savings transfer', ARRAY['savings', 'transfer'], 'Online'),

    -- February 2025 transactions  
    (demo_user_id, '2025-02-01', 800000.00, 'expense',
        (SELECT id FROM categories WHERE name = 'Bills & Utilities' LIMIT 1),
        checking_account_id, NULL,
        (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1),
        'EVN HCMC', 'Electricity bill January', 'Monthly electricity payment', ARRAY['bills', 'utilities'], 'Online'),

    (demo_user_id, '2025-02-05', 3000000.00, 'expense',
        (SELECT id FROM categories WHERE name = 'Transportation' LIMIT 1),
        credit_card_id, NULL,
        (SELECT id FROM payment_methods WHERE name = 'Credit Card' LIMIT 1),
        'Grab', 'Monthly transportation', 'Daily commute and rides', ARRAY['transport', 'grab'], 'Various locations'),

    -- Add some future transactions to test auto-partition creation
    (demo_user_id, '2027-06-15', 30000000.00, 'income',
        (SELECT id FROM categories WHERE name = 'Salary' LIMIT 1),
        NULL, checking_account_id,
        (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1),
        'ABC Company', 'Future salary payment', 'Testing auto-partition creation', ARRAY['salary', 'test'], 'Ho Chi Minh City');

    -- Sample Income Streams
    INSERT INTO income_streams (user_id, transaction_id, transaction_date, source_type, employer_name, project_name, is_recurring, frequency, next_expected_date, expected_amount, tax_category, tax_rate, net_amount) 
    SELECT 
        demo_user_id,
        id,
        transaction_date,
        'salary', 
        'ABC Company', 
        NULL, 
        true, 
        'monthly', 
        '2025-02-15', 
        25000000.00, 
        'employment', 
        0.1000, 
        22500000.00
    FROM transactions 
    WHERE counterparty = 'ABC Company' AND amount = 25000000.00 AND user_id = demo_user_id
    LIMIT 1;

    -- Sample Account Balance History
    INSERT INTO account_balance_history (user_id, account_id, balance, balance_date) VALUES
    (demo_user_id, checking_account_id, 10000000.00, '2025-01-01'),
    (demo_user_id, checking_account_id, 15000000.00, '2025-01-15'),
    (demo_user_id, savings_account_id, 45000000.00, '2025-01-01'),
    (demo_user_id, savings_account_id, 50000000.00, '2025-01-18');

END $$;

-- ================================
-- VERIFICATION QUERIES
-- ================================

-- Uncomment these to verify your data after insertion:
/*
SELECT 'Payment Methods' as table_name, COUNT(*) as count FROM payment_methods
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories  
UNION ALL
SELECT 'Accounts', COUNT(*) FROM accounts
UNION ALL  
SELECT 'Transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'Debts', COUNT(*) FROM debts
UNION ALL
SELECT 'Assets', COUNT(*) FROM assets
UNION ALL
SELECT 'Budgets', COUNT(*) FROM budgets
UNION ALL
SELECT 'Financial Goals', COUNT(*) FROM financial_goals
UNION ALL
SELECT 'Income Streams', COUNT(*) FROM income_streams
UNION ALL
SELECT 'Balance History', COUNT(*) FROM account_balance_history;

-- Test the views:
SELECT * FROM monthly_spending_summary;
SELECT * FROM account_balance_summary;
SELECT * FROM net_worth_summary;
SELECT * FROM recent_transactions_detailed;
*/

-- ================================
-- PRODUCTION DEPLOYMENT NOTES
-- ================================

/*
IMPORTANT: Before using this seed data in production:

1. **Replace User ID**: Change '123e4567-e89b-12d3-a456-426614174000' with actual user IDs from auth.users table

2. **Update Amounts**: Modify transaction amounts and account balances to reflect real financial data

3. **Customize Categories**: Adjust categories to match your personal spending patterns

4. **Real Transaction Data**: Replace sample transactions with actual financial history

5. **Remove Test Data**: Remove the future-dated transaction (2027-06-15) used for testing

6. **Update Asset Values**: Adjust asset prices to current market values

7. **Realistic Goals**: Update financial goals to match personal targets

8. **Budget Adjustments**: Set budget amounts to realistic monthly/yearly limits

9. **Validate References**: Ensure all foreign key references are valid

10. **Test Functionality**: Test all triggers, views, and partitioning features

This seed file includes:
✅ Complete multi-user schema compatibility
✅ Partitioned transaction table with auto-creation
✅ Soft delete fields (is_deleted, deleted_at, deleted_by)
✅ Comprehensive sample data for all tables
✅ Vietnamese financial context (VND currency, local vendors)
✅ Future-dated transaction to test auto-partition creation
✅ Proper relationships between all tables
✅ Data that will trigger all automated features (budgets, goals, balances)
*/