import { supabase } from '../supabase'
import { TransactionService } from './transactions'

export class RecurringTransactionService {
  // Detect potential recurring transactions
  static async detectRecurringTransactions() {
    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('is_deleted', false)
        .order('transaction_date', { ascending: false })
        .limit(1000) // Analyze recent transactions

      if (!transactions) return []

      // Group transactions by similar attributes
      const potentialRecurring = this.groupSimilarTransactions(transactions)
      
      // Filter to only include transactions that appear regularly
      const recurringPatterns = potentialRecurring.filter(group => 
        group.transactions.length >= 3 && // At least 3 occurrences
        this.hasRegularInterval(group.transactions)
      )

      return recurringPatterns
    } catch (error) {
      console.error('Error detecting recurring transactions:', error)
      return []
    }
  }

  // Group transactions by similar counterparty, amount, and purpose
  private static groupSimilarTransactions(transactions: any[]) {
    const groups: Record<string, any> = {}

    transactions.forEach(transaction => {
      // Create a key based on counterparty, amount (with some tolerance), and type
      const amountRange = Math.floor(transaction.amount / 50000) * 50000 // Group by 50k VND ranges
      const key = `${transaction.counterparty || 'unknown'}-${amountRange}-${transaction.type}`
      
      if (!groups[key]) {
        groups[key] = {
          key,
          counterparty: transaction.counterparty,
          averageAmount: 0,
          type: transaction.type,
          category: transaction.categories?.name,
          transactions: []
        }
      }
      
      groups[key].transactions.push(transaction)
    })

    // Calculate average amounts and sort transactions
    Object.values(groups).forEach((group: any) => {
      group.averageAmount = group.transactions.reduce((sum: number, t: any) => sum + t.amount, 0) / group.transactions.length
      group.transactions.sort((a: any, b: any) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime())
    })

    return Object.values(groups)
  }

  // Check if transactions have a regular interval
  private static hasRegularInterval(transactions: any[]) {
    if (transactions.length < 3) return false

    const intervals: number[] = []
    for (let i = 1; i < transactions.length; i++) {
      const prevDate = new Date(transactions[i - 1].transaction_date)
      const currentDate = new Date(transactions[i].transaction_date)
      const daysDiff = Math.abs(currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      intervals.push(daysDiff)
    }

    // Check for common recurring patterns (weekly, bi-weekly, monthly, quarterly)
    const commonIntervals = [7, 14, 30, 31, 90, 365] // days
    const tolerance = 3 // days tolerance

    return commonIntervals.some(targetInterval => {
      const matchingIntervals = intervals.filter(interval => 
        Math.abs(interval - targetInterval) <= tolerance
      )
      return matchingIntervals.length >= Math.floor(intervals.length * 0.7) // 70% of intervals match
    })
  }

  // Create recurring transaction templates
  static async createRecurringTemplate(transactionId: string, frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly') {
    try {
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (!transaction) throw new Error('Transaction not found')

      // Calculate next occurrence
      const lastDate = new Date(transaction.transaction_date)
      const nextOccurrence = new Date(lastDate)

      switch (frequency) {
        case 'weekly':
          nextOccurrence.setDate(lastDate.getDate() + 7)
          break
        case 'monthly':
          nextOccurrence.setMonth(lastDate.getMonth() + 1)
          break
        case 'quarterly':
          nextOccurrence.setMonth(lastDate.getMonth() + 3)
          break
        case 'yearly':
          nextOccurrence.setFullYear(lastDate.getFullYear() + 1)
          break
      }

      // Update the original transaction to mark it as recurring
      const { data: updatedTransaction, error } = await supabase
        .from('transactions')
        .update({
          is_recurring: true,
          recurring_frequency: frequency,
          next_occurrence: nextOccurrence.toISOString().split('T')[0]
        })
        .eq('id', transactionId)
        .select()
        .single()

      if (error) throw error
      return updatedTransaction
    } catch (error: any) {
      throw new Error(`Failed to create recurring template: ${error.message}`)
    }
  }

  // Get upcoming recurring transactions
  static async getUpcomingRecurring(daysAhead = 7) {
    try {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + daysAhead)

      const { data: recurringTransactions } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name, type),
          from_account:accounts!from_account_id(name),
          to_account:accounts!to_account_id(name),
          payment_methods(name)
        `)
        .eq('is_recurring', true)
        .not('next_occurrence', 'is', null)
        .lte('next_occurrence', futureDate.toISOString().split('T')[0])
        .eq('is_deleted', false)

      return recurringTransactions || []
    } catch (error) {
      console.error('Error fetching upcoming recurring transactions:', error)
      return []
    }
  }

  // Create transaction from recurring template
  static async createFromTemplate(templateId: string) {
    try {
      const { data: template } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', templateId)
        .single()

      if (!template) throw new Error('Template not found')

      // Create new transaction based on template
      const newTransaction = {
        amount: template.amount,
        type: template.type,
        purpose: template.purpose,
        transaction_date: new Date().toISOString().split('T')[0],
        category_id: template.category_id,
        from_account_id: template.from_account_id,
        to_account_id: template.to_account_id,
        payment_method_id: template.payment_method_id,
        counterparty: template.counterparty,
        notes: `${template.notes || ''} (Auto-created from recurring template)`.trim(),
        tags: template.tags
      }

      const createdTransaction = await TransactionService.createTransaction(newTransaction)

      // Update template's next occurrence
      const nextOccurrence = new Date(template.next_occurrence)
      const newNextOccurrence = new Date(nextOccurrence)

      switch (template.recurring_frequency) {
        case 'weekly':
          newNextOccurrence.setDate(nextOccurrence.getDate() + 7)
          break
        case 'monthly':
          newNextOccurrence.setMonth(nextOccurrence.getMonth() + 1)
          break
        case 'quarterly':
          newNextOccurrence.setMonth(nextOccurrence.getMonth() + 3)
          break
        case 'yearly':
          newNextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1)
          break
      }

      await supabase
        .from('transactions')
        .update({ next_occurrence: newNextOccurrence.toISOString().split('T')[0] })
        .eq('id', templateId)

      return createdTransaction
    } catch (error: any) {
      throw new Error(`Failed to create transaction from template: ${error.message}`)
    }
  }

  // Stop recurring transaction
  static async stopRecurring(transactionId: string) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          is_recurring: false,
          recurring_frequency: null,
          next_occurrence: null
        })
        .eq('id', transactionId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(`Failed to stop recurring transaction: ${error.message}`)
    }
  }
}