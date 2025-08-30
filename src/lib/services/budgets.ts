import { supabase } from '../supabase'
import { Budget } from '../database.types'

export class BudgetService {
  // Get all user budgets
  static async getBudgets() {
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        categories(name, type)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get current active budgets
  static async getCurrentBudgets() {
    const today = new Date().toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('budgets')
      .select(`
        *,
        categories(name, type)
      `)
      .eq('is_active', true)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Create new budget
  static async createBudget(budget: {
    name: string
    category_id?: string
    period_type: Budget['period_type']
    budget_amount: number
    start_date: string
    end_date: string
    alert_threshold?: number
  }) {
    const { data, error } = await supabase
      .from('budgets')
      .insert([budget])
      .select(`
        *,
        categories(name, type)
      `)
      .single()

    if (error) throw error
    return data
  }

  // Update budget
  static async updateBudget(id: string, updates: Partial<Budget>) {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        categories(name, type)
      `)
      .single()

    if (error) throw error
    return data
  }

  // Delete budget (soft delete)
  static async deleteBudget(id: string) {
    const { data, error } = await supabase
      .from('budgets')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get budget progress for current month
  static async getBudgetProgress(budgetId?: string) {
    let query = supabase
      .from('budgets')
      .select(`
        *,
        categories(name, type)
      `)
      .eq('is_active', true)

    if (budgetId) {
      query = query.eq('id', budgetId)
    }

    const { data, error } = await query
    if (error) throw error

    // Calculate progress for each budget
    const budgetsWithProgress = await Promise.all(
      (data || []).map(async (budget) => {
        const { data: spentData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'expense')
          .eq('is_deleted', false)
          .gte('transaction_date', budget.start_date)
          .lte('transaction_date', budget.end_date)
          .eq('category_id', budget.category_id || '')

        const totalSpent = (spentData || []).reduce((sum, t) => sum + t.amount, 0)
        const progress = budget.budget_amount > 0 ? (totalSpent / budget.budget_amount) * 100 : 0
        const remaining = budget.budget_amount - totalSpent
        
        return {
          ...budget,
          spent_amount: totalSpent,
          progress_percentage: Math.min(progress, 100),
          remaining_amount: remaining,
          is_over_budget: totalSpent > budget.budget_amount,
          is_near_limit: progress >= (budget.alert_threshold * 100)
        }
      })
    )

    return budgetsWithProgress
  }

  // Generate budget suggestions based on spending patterns
  static async getBudgetSuggestions() {
    // Get last 3 months of spending by category
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        category_id,
        categories(name, type)
      `)
      .eq('type', 'expense')
      .eq('is_deleted', false)
      .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0])

    if (error) throw error

    // Group by category and calculate averages
    const categorySpending = (data || []).reduce((acc, transaction) => {
      const categoryId = transaction.category_id || 'uncategorized'
      const categoryName = transaction.categories?.name || 'Uncategorized'
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          categoryId,
          categoryName,
          totalAmount: 0,
          transactionCount: 0
        }
      }
      
      acc[categoryId].totalAmount += transaction.amount
      acc[categoryId].transactionCount += 1
      
      return acc
    }, {} as Record<string, any>)

    // Calculate monthly averages and suggest budgets
    const suggestions = Object.values(categorySpending)
      .map((category: any) => {
        const monthlyAverage = category.totalAmount / 3
        const suggestedBudget = Math.ceil(monthlyAverage * 1.1) // 10% buffer
        
        return {
          categoryId: category.categoryId,
          categoryName: category.categoryName,
          monthlyAverage,
          suggestedBudget,
          transactionCount: category.transactionCount
        }
      })
      .filter((suggestion) => suggestion.monthlyAverage > 0)
      .sort((a, b) => b.monthlyAverage - a.monthlyAverage)

    return suggestions
  }
}