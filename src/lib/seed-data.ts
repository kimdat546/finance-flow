import { supabase } from './supabase'

export async function seedReferenceData() {
  try {
    // Seed categories
    const categories = [
      // Expense categories
      { name: 'Thuê nhà', type: 'expense', description: 'Rent payments' },
      { name: 'Ăn uống', type: 'expense', description: 'Food and meals' },
      { name: 'Đồ uống', type: 'expense', description: 'Beverages' },
      { name: 'Xăng xe', type: 'expense', description: 'Gas and fuel' },
      { name: 'Giải trí', type: 'expense', description: 'Entertainment' },
      { name: 'Tiện ích', type: 'expense', description: 'Utilities (electricity, water, internet)' },
      { name: 'Mua sắm', type: 'expense', description: 'General shopping' },
      { name: 'Y tế', type: 'expense', description: 'Healthcare and medical' },
      { name: 'Nhà ở', type: 'expense', description: 'Housing related expenses' },
      { name: 'Giáo dục', type: 'expense', description: 'Education' },
      { name: 'Giao thông', type: 'expense', description: 'Transportation' },
      { name: 'Bảo hiểm', type: 'expense', description: 'Insurance' },
      { name: 'Làm đẹp', type: 'expense', description: 'Personal care and beauty' },
      { name: 'Khác', type: 'expense', description: 'Others' },
      
      // Income categories
      { name: 'Lương', type: 'income', description: 'Salary' },
      { name: 'Freelance', type: 'income', description: 'Freelance income' },
      { name: 'Thưởng', type: 'income', description: 'Bonus' },
      { name: 'Đầu tư', type: 'income', description: 'Investment returns' },
      
      // Financial categories
      { name: 'Tiết kiệm', type: 'investment', description: 'Savings' },
      { name: 'Trả nợ', type: 'debt', description: 'Debt payments' },
      { name: 'Thẻ tín dụng', type: 'debt', description: 'Credit card related' },
      { name: 'Ngân hàng', type: 'expense', description: 'Banking fees' },
    ]

    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'name,type' })

    if (categoriesError) {
      console.error('Error seeding categories:', categoriesError)
    } else {
      console.log('Categories seeded successfully')
    }

    // Seed payment methods
    const paymentMethods = [
      { name: 'Tiền mặt', category: 'cash', description: 'Cash payments' },
      { name: 'Thẻ ghi nợ', category: 'debit_card', description: 'Debit card payments' },
      { name: 'Thẻ tín dụng', category: 'credit_card', description: 'Credit card payments' },
      { name: 'Chuyển khoản', category: 'bank_transfer', description: 'Bank transfer' },
      { name: 'Ví điện tử', category: 'e_wallet', description: 'E-wallet payments' },
      { name: 'QR Code', category: 'qr_code', description: 'QR code payments' },
      { name: 'Khác', category: 'other', description: 'Other payment methods' },
    ]

    const { error: paymentMethodsError } = await supabase
      .from('payment_methods')
      .upsert(paymentMethods, { onConflict: 'name' })

    if (paymentMethodsError) {
      console.error('Error seeding payment methods:', paymentMethodsError)
    } else {
      console.log('Payment methods seeded successfully')
    }

    console.log('Reference data seeded successfully!')
    return { success: true }
  } catch (error) {
    console.error('Error seeding reference data:', error)
    return { success: false, error }
  }
}

export async function createSampleData() {
  try {
    const { data: user, error: userError } = await supabase.auth.getUser()
    if (userError || !user.user) {
      throw new Error('User not authenticated')
    }

    // Create sample accounts
    const accounts = [
      {
        name: 'Vietcombank',
        type: 'checking' as const,
        bank_name: 'Vietcombank',
        current_balance: 5000000,
        currency: 'VND'
      },
      {
        name: 'BIDV Credit Card',
        type: 'credit_card' as const,
        bank_name: 'BIDV',
        current_balance: -500000,
        credit_limit: 10000000,
        currency: 'VND'
      },
      {
        name: 'Tiền mặt',
        type: 'cash' as const,
        current_balance: 1000000,
        currency: 'VND'
      }
    ]

    const { data: createdAccounts, error: accountsError } = await supabase
      .from('accounts')
      .upsert(accounts)
      .select()

    if (accountsError) {
      console.error('Error creating sample accounts:', accountsError)
      return
    }

    console.log('Sample accounts created:', createdAccounts)

    // Get categories for sample transactions
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name, type')

    const foodCategory = categories?.find(c => c.name === 'Ăn uống')
    const transportCategory = categories?.find(c => c.name === 'Giao thông')
    const salaryCategory = categories?.find(c => c.name === 'Lương')

    // Get payment methods
    const { data: paymentMethods } = await supabase
      .from('payment_methods')
      .select('id, name')

    const cashPayment = paymentMethods?.find(p => p.name === 'Tiền mặt')
    const cardPayment = paymentMethods?.find(p => p.name === 'Thẻ tín dụng')

    // Create sample transactions
    const transactions = [
      {
        amount: 250000,
        type: 'expense' as const,
        purpose: 'Cơm trưa tại nhà hàng',
        transaction_date: new Date().toISOString().split('T')[0],
        category_id: foodCategory?.id,
        from_account_id: createdAccounts?.[0]?.id,
        payment_method_id: cashPayment?.id,
        counterparty: 'Nhà hàng Sài Gòn'
      },
      {
        amount: 150000,
        type: 'expense' as const,
        purpose: 'Taxi về nhà',
        transaction_date: new Date().toISOString().split('T')[0],
        category_id: transportCategory?.id,
        from_account_id: createdAccounts?.[1]?.id,
        payment_method_id: cardPayment?.id,
        counterparty: 'Grab'
      },
      {
        amount: 15000000,
        type: 'income' as const,
        purpose: 'Lương tháng',
        transaction_date: new Date().toISOString().split('T')[0],
        category_id: salaryCategory?.id,
        to_account_id: createdAccounts?.[0]?.id,
        counterparty: 'Công ty ABC'
      }
    ]

    const { error: transactionsError } = await supabase
      .from('transactions')
      .insert(transactions)

    if (transactionsError) {
      console.error('Error creating sample transactions:', transactionsError)
    } else {
      console.log('Sample transactions created successfully')
    }

    return { success: true }
  } catch (error) {
    console.error('Error creating sample data:', error)
    return { success: false, error }
  }
}