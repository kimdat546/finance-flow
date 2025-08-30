-- Simple Seed Data for Personal Finance Tracking Database
-- This version works with actual authenticated users

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
('ViettelPay', 'e_wallet', 'ViettelPay digital wallet')
ON CONFLICT (name) DO NOTHING;

-- Categories
INSERT INTO categories (name, type, description) VALUES
-- Income Categories
('Salary', 'income', 'Regular employment income'),
('Freelance', 'income', 'Freelance work payments'),
('Investment Returns', 'income', 'Dividends, interest, capital gains'),
('Business Income', 'income', 'Revenue from business activities'),
('Gifts Received', 'income', 'Money gifts from family/friends'),
('Rental Income', 'income', 'Income from property rental'),
('Bonus', 'income', 'Performance bonuses and rewards'),
('Side Hustle', 'income', 'Additional income sources'),
('Other Income', 'income', 'Miscellaneous income'),

-- Expense Categories
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
('Other Expenses', 'expense', 'Miscellaneous expenses'),

-- Investment Categories
('Stock Purchase', 'investment', 'Buying stocks and securities'),
('Crypto Purchase', 'investment', 'Cryptocurrency investments'),
('Gold Investment', 'investment', 'Precious metals investment'),
('Real Estate', 'investment', 'Property investments'),
('Mutual Funds', 'investment', 'Investment funds'),
('Savings Deposit', 'investment', 'Bank savings deposits'),
('Other Investment', 'investment', 'Other investment types'),

-- Transfer Categories  
('Account Transfer', 'transfer', 'Money transfers between accounts'),
('Savings Transfer', 'transfer', 'Moving money to savings'),
('Wallet Top-up', 'transfer', 'Adding money to e-wallets'),
('Cash Withdrawal', 'transfer', 'ATM and bank withdrawals'),

-- Debt Categories
('Credit Card Payment', 'debt', 'Credit card payments'),
('Loan Payment', 'debt', 'Personal or business loan payments'),
('Debt Collection', 'debt', 'Money borrowed or lent'),
('Interest Charges', 'debt', 'Interest and finance charges'),
('Banking Fees', 'debt', 'Bank fees and charges')
ON CONFLICT (name, type) DO NOTHING;

-- ================================
-- SUCCESS MESSAGE
-- ================================

DO $$
BEGIN
    RAISE NOTICE '✅ Reference data (payment methods and categories) inserted successfully!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 NEXT STEPS:';
    RAISE NOTICE '1. Authenticate a user in your application';
    RAISE NOTICE '2. Use the application to create your first account';
    RAISE NOTICE '3. Add your first transaction';
    RAISE NOTICE '4. The triggers will automatically handle balances, budgets, and goals';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Your database is ready for production use!';
END $$;

-- ================================
-- OPTIONAL: SAMPLE DATA FOR TESTING
-- ================================

/*
-- Uncomment and run this section ONLY if you want to add sample data
-- for a specific user (replace the user_id with your actual authenticated user ID)

-- First, get your user ID by running: SELECT id, email FROM auth.users;
-- Then replace 'YOUR-USER-ID-HERE' with the actual UUID

DO $$
DECLARE
    your_user_id UUID := 'YOUR-USER-ID-HERE'; -- REPLACE WITH YOUR ACTUAL USER ID
    checking_account_id UUID;
    savings_account_id UUID;
    credit_card_id UUID;
    cash_account_id UUID;
    momo_account_id UUID;
BEGIN
    -- Sample Accounts
    INSERT INTO accounts (user_id, name, type, bank_name, account_number, currency, current_balance, credit_limit, interest_rate, opening_date, is_active) VALUES
    (your_user_id, 'Primary Checking', 'checking', 'Vietcombank', 'VCB-****1234', 'VND', 15000000.00, NULL, 0.0050, '2024-01-01', true),
    (your_user_id, 'Savings Account', 'savings', 'Vietcombank', 'VCB-****5678', 'VND', 50000000.00, NULL, 0.0600, '2024-01-01', true),
    (your_user_id, 'Credit Card', 'credit_card', 'Techcombank', 'TCB-****9999', 'VND', 2000000.00, 20000000.00, 0.2400, '2024-01-15', true),
    (your_user_id, 'Cash Wallet', 'cash', NULL, NULL, 'VND', 500000.00, NULL, NULL, '2024-01-01', true),
    (your_user_id, 'Momo E-Wallet', 'e_wallet', 'Momo', 'MOMO-****7777', 'VND', 1000000.00, NULL, NULL, '2024-01-01', true);

    -- Get account IDs for sample transactions
    SELECT id INTO checking_account_id FROM accounts WHERE name = 'Primary Checking' AND user_id = your_user_id;
    SELECT id INTO savings_account_id FROM accounts WHERE name = 'Savings Account' AND user_id = your_user_id;
    SELECT id INTO credit_card_id FROM accounts WHERE name = 'Credit Card' AND user_id = your_user_id;
    SELECT id INTO cash_account_id FROM accounts WHERE name = 'Cash Wallet' AND user_id = your_user_id;
    SELECT id INTO momo_account_id FROM accounts WHERE name = 'Momo E-Wallet' AND user_id = your_user_id;

    -- Sample Transactions
    INSERT INTO transactions (user_id, transaction_date, amount, type, category_id, from_account_id, to_account_id, payment_method_id, counterparty, purpose, notes, tags, location) VALUES
    (your_user_id, CURRENT_DATE - INTERVAL '7 days', 25000000.00, 'income', 
        (SELECT id FROM categories WHERE name = 'Salary' LIMIT 1),
        NULL, checking_account_id,
        (SELECT id FROM payment_methods WHERE name = 'Bank Transfer' LIMIT 1),
        'ABC Company', 'Monthly salary payment', 'Regular salary deposit', ARRAY['salary', 'regular'], 'Ho Chi Minh City'),

    (your_user_id, CURRENT_DATE - INTERVAL '1 day', 200000.00, 'expense',
        (SELECT id FROM categories WHERE name = 'Food & Dining' LIMIT 1),
        cash_account_id, NULL,
        (SELECT id FROM payment_methods WHERE name = 'Cash' LIMIT 1),
        'Pho Restaurant', 'Lunch with colleagues', 'Business lunch', ARRAY['food', 'lunch'], 'District 1'),

    (your_user_id, CURRENT_DATE - INTERVAL '2 days', 1500000.00, 'expense',
        (SELECT id FROM categories WHERE name = 'Shopping' LIMIT 1),
        credit_card_id, NULL,
        (SELECT id FROM payment_methods WHERE name = 'Credit Card' LIMIT 1),
        'Shopping Mall', 'New clothes', 'Weekend shopping', ARRAY['shopping', 'clothes'], 'District 3');

    -- Sample Financial Goals
    INSERT INTO financial_goals (user_id, name, description, goal_type, target_amount, current_amount, target_date, priority, is_achieved, notes) VALUES
    (your_user_id, 'Emergency Fund', 'Build emergency fund for 6 months expenses', 'emergency_fund', 150000000.00, 50000000.00, '2025-12-31', 1, false, 'Top priority financial goal'),
    (your_user_id, 'Vacation Fund', 'Save for vacation', 'vacation', 50000000.00, 15000000.00, '2025-08-15', 3, false, 'Summer vacation fund');

    -- Sample Budgets
    INSERT INTO budgets (user_id, name, category_id, period_type, budget_amount, spent_amount, start_date, end_date, alert_threshold, is_active) VALUES
    (your_user_id, 'Monthly Food Budget', (SELECT id FROM categories WHERE name = 'Food & Dining' LIMIT 1), 'monthly', 6000000.00, 200000.00, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE, 0.80, true);

    RAISE NOTICE '✅ Sample data added successfully for user: %', your_user_id;
END $$;
*/