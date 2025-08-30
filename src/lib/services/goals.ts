import { supabase } from '../supabase'
import { FinancialGoal } from '../database.types'

export class GoalService {
  // Get all user goals
  static async getGoals() {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Get active goals (not achieved)
  static async getActiveGoals() {
    const { data, error } = await supabase
      .from('financial_goals')
      .select('*')
      .eq('is_achieved', false)
      .order('priority', { ascending: true })

    if (error) throw error
    return data
  }

  // Create new goal
  static async createGoal(goal: {
    name: string
    description?: string
    goal_type: FinancialGoal['goal_type']
    target_amount: number
    current_amount?: number
    target_date?: string
    priority?: number
    notes?: string
  }) {
    const { data, error } = await supabase
      .from('financial_goals')
      .insert([goal])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update goal
  static async updateGoal(id: string, updates: Partial<FinancialGoal>) {
    const { data, error } = await supabase
      .from('financial_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Add progress to goal (increase current amount)
  static async addProgress(id: string, amount: number) {
    const { data: goal, error: fetchError } = await supabase
      .from('financial_goals')
      .select('current_amount, target_amount')
      .eq('id', id)
      .single()

    if (fetchError) throw fetchError

    const newAmount = (goal.current_amount || 0) + amount
    const isAchieved = newAmount >= goal.target_amount

    const { data, error } = await supabase
      .from('financial_goals')
      .update({
        current_amount: newAmount,
        is_achieved: isAchieved,
        achievement_date: isAchieved ? new Date().toISOString().split('T')[0] : null
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete goal
  static async deleteGoal(id: string) {
    const { data, error } = await supabase
      .from('financial_goals')
      .delete()
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get goal progress with additional calculations
  static async getGoalProgress(goalId?: string) {
    let query = supabase
      .from('financial_goals')
      .select('*')

    if (goalId) {
      query = query.eq('id', goalId)
    }

    const { data, error } = await query
    if (error) throw error

    // Calculate progress for each goal
    const goalsWithProgress = (data || []).map((goal) => {
      const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
      const remaining = goal.target_amount - goal.current_amount
      
      // Calculate time-based metrics
      let daysRemaining = null
      let monthsRemaining = null
      let suggestedMonthlyAmount = null
      
      if (goal.target_date) {
        const targetDate = new Date(goal.target_date)
        const today = new Date()
        const timeDiff = targetDate.getTime() - today.getTime()
        daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24))
        monthsRemaining = daysRemaining / 30.44 // Average days per month
        
        if (monthsRemaining > 0 && remaining > 0) {
          suggestedMonthlyAmount = remaining / monthsRemaining
        }
      }
      
      return {
        ...goal,
        progress_percentage: Math.min(progress, 100),
        remaining_amount: remaining,
        days_remaining: daysRemaining,
        months_remaining: monthsRemaining,
        suggested_monthly_amount: suggestedMonthlyAmount,
        is_on_track: suggestedMonthlyAmount ? suggestedMonthlyAmount <= 2000000 : true // Reasonable monthly amount
      }
    })

    return goalsWithProgress
  }

  // Get goal suggestions based on user profile and common goals
  static async getGoalSuggestions() {
    // Get user's average monthly income and expenses
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const { data: transactionData } = await supabase
      .from('transactions')
      .select('amount, type')
      .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0])
      .eq('is_deleted', false)

    const monthlyIncome = (transactionData || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) / 3

    const monthlyExpenses = (transactionData || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) / 3

    const monthlySavings = monthlyIncome - monthlyExpenses

    // Generate goal suggestions based on income
    const suggestions = [
      {
        name: 'Emergency Fund',
        description: '3-6 months of expenses for financial security',
        goal_type: 'emergency_fund',
        target_amount: monthlyExpenses * 6,
        suggested_monthly: Math.max(monthlySavings * 0.3, 500000),
        priority: 1,
        reasoning: 'Build financial security with 6 months of expenses'
      },
      {
        name: 'House Down Payment',
        description: '20% down payment for home purchase',
        goal_type: 'house_down_payment',
        target_amount: 200000000, // 200M VND
        suggested_monthly: Math.max(monthlySavings * 0.4, 2000000),
        priority: 2,
        reasoning: 'Save for future home ownership'
      },
      {
        name: 'Vacation Fund',
        description: 'Annual vacation and travel expenses',
        goal_type: 'vacation',
        target_amount: 30000000, // 30M VND
        suggested_monthly: Math.max(monthlySavings * 0.1, 500000),
        priority: 3,
        reasoning: 'Enjoy life with planned vacation savings'
      },
      {
        name: 'Retirement Savings',
        description: 'Long-term retirement planning',
        goal_type: 'retirement',
        target_amount: monthlyExpenses * 300, // 25 years of expenses
        suggested_monthly: Math.max(monthlySavings * 0.2, 1000000),
        priority: 4,
        reasoning: 'Secure your financial future'
      }
    ].filter(suggestion => suggestion.suggested_monthly <= monthlySavings * 0.8) // Only suggest achievable goals

    return suggestions
  }

  // Link transaction to goal (for tracking progress)
  static async linkTransactionToGoal(goalId: string, transactionId: string) {
    // This would be implemented if we add a transaction_goals junction table
    // For now, we can use the tags field in transactions to link to goals
    const { data: transaction } = await supabase
      .from('transactions')
      .select('tags')
      .eq('id', transactionId)
      .single()

    const { data: goal } = await supabase
      .from('financial_goals')
      .select('name')
      .eq('id', goalId)
      .single()

    if (transaction && goal) {
      const currentTags = transaction.tags || []
      const newTags = [...currentTags, goal.name]
      
      const { data, error } = await supabase
        .from('transactions')
        .update({ tags: newTags })
        .eq('id', transactionId)
        .select()
        .single()

      if (error) throw error
      return data
    }
  }
}