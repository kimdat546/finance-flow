import { supabase } from '../supabase'
import { Account } from '../database.types'

export class AccountService {
  // Get all user accounts
  static async getAccounts() {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw error
    return data
  }

  // Get account balance summary
  static async getAccountBalanceSummary() {
    const { data, error } = await supabase
      .from('account_balance_summary')
      .select('*')

    if (error) throw error
    return data
  }

  // Create new account
  static async createAccount(account: {
    name: string
    type: Account['type']
    bank_name?: string
    current_balance?: number
    credit_limit?: number
    currency?: string
    notes?: string
  }) {
    const { data, error } = await supabase
      .from('accounts')
      .insert([account])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Update account
  static async updateAccount(id: string, updates: Partial<Account>) {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Delete account (soft delete by setting is_active = false)
  static async deleteAccount(id: string) {
    const { data, error } = await supabase
      .from('accounts')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Get total net worth
  static async getNetWorth() {
    const { data, error } = await supabase
      .from('net_worth_summary')
      .select('*')

    if (error) throw error

    const summary = data?.reduce((acc, item) => {
      if (item.category === 'Assets' || item.category === 'Liquid Assets') {
        acc.assets += item.total_value
      } else if (item.category === 'Liabilities') {
        acc.liabilities += Math.abs(item.total_value)
      }
      return acc
    }, { assets: 0, liabilities: 0, netWorth: 0 })

    if (summary) {
      summary.netWorth = summary.assets - summary.liabilities
    }

    return summary
  }
}