import { supabase } from '../supabase'
import { Transaction } from '../database.types'

export class TransactionService {
  // Get recent transactions with full details
  static async getRecentTransactions(limit = 10) {
    const { data, error } = await supabase
      .from('recent_transactions_detailed')
      .select('*')
      .limit(limit)
      .order('transaction_date', { ascending: false })

    if (error) throw error
    return data
  }

  // Get transactions with filtering
  static async getTransactions(filters?: {
    startDate?: string
    endDate?: string
    type?: string
    categoryId?: string
    accountId?: string
  }) {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        categories(name, type),
        from_account:accounts!from_account_id(name),
        to_account:accounts!to_account_id(name),
        payment_methods(name)
      `)
      .eq('is_deleted', false)
      .order('transaction_date', { ascending: false })

    if (filters?.startDate) {
      query = query.gte('transaction_date', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('transaction_date', filters.endDate)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId)
    }
    if (filters?.accountId) {
      query = query.or(`from_account_id.eq.${filters.accountId},to_account_id.eq.${filters.accountId}`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  // Create a new transaction
  static async createTransaction(transaction: {
    amount: number
    type: Transaction['type']
    purpose: string
    transaction_date: string
    category_id?: string
    from_account_id?: string
    to_account_id?: string
    payment_method_id?: string
    counterparty?: string
    notes?: string
  }) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update transaction
  static async updateTransaction(id: string, updates: Partial<Transaction>) {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Soft delete transaction
  static async deleteTransaction(id: string, transactionDate: string) {
    const { data, error } = await supabase.rpc('soft_delete_transaction', {
      transaction_id: id,
      transaction_date_param: transactionDate
    })

    if (error) throw error
    return data
  }

  // Get spending by category
  static async getSpendingByCategory(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        category_id,
        categories(name, type),
        amount
      `)
      .eq('type', 'expense')
      .eq('is_deleted', false)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)

    if (error) throw error

    // Group by category
    const grouped = data?.reduce((acc, transaction) => {
      const categoryName = transaction.categories?.name || 'Uncategorized'
      if (!acc[categoryName]) {
        acc[categoryName] = 0
      }
      acc[categoryName] += transaction.amount
      return acc
    }, {} as Record<string, number>)

    return grouped
  }

  // Get monthly spending summary
  static async getMonthlySpendingSummary() {
    const { data, error } = await supabase
      .from('monthly_spending_summary')
      .select('*')
      .order('month', { ascending: false })
      .limit(12)

    if (error) throw error
    return data
  }
}