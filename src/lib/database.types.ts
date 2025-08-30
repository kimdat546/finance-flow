export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'credit_card' | 'e_wallet' | 'cash' | 'investment' | 'loan'
          bank_name: string | null
          account_number: string | null
          currency: string
          current_balance: number
          credit_limit: number | null
          interest_rate: number | null
          opening_date: string | null
          closing_date: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'checking' | 'savings' | 'credit_card' | 'e_wallet' | 'cash' | 'investment' | 'loan'
          bank_name?: string | null
          account_number?: string | null
          currency?: string
          current_balance?: number
          credit_limit?: number | null
          interest_rate?: number | null
          opening_date?: string | null
          closing_date?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'checking' | 'savings' | 'credit_card' | 'e_wallet' | 'cash' | 'investment' | 'loan'
          bank_name?: string | null
          account_number?: string | null
          currency?: string
          current_balance?: number
          credit_limit?: number | null
          interest_rate?: number | null
          opening_date?: string | null
          closing_date?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          type: 'income' | 'expense' | 'transfer' | 'investment' | 'debt'
          parent_id: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'income' | 'expense' | 'transfer' | 'investment' | 'debt'
          parent_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'income' | 'expense' | 'transfer' | 'investment' | 'debt'
          parent_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      payment_methods: {
        Row: {
          id: string
          name: string
          category: 'cash' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'e_wallet' | 'qr_code' | 'other'
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: 'cash' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'e_wallet' | 'qr_code' | 'other'
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: 'cash' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'e_wallet' | 'qr_code' | 'other'
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          transaction_date: string
          amount: number
          type: 'income' | 'expense' | 'transfer' | 'investment' | 'debt_payment' | 'debt_charge'
          category_id: string | null
          from_account_id: string | null
          to_account_id: string | null
          payment_method_id: string | null
          counterparty: string | null
          purpose: string
          summary: string | null
          notes: string | null
          reference_number: string | null
          telegram_message_id: string | null
          is_recurring: boolean
          recurring_frequency: string | null
          next_occurrence: string | null
          tags: string[] | null
          location: string | null
          exchange_rate: number | null
          original_amount: number | null
          original_currency: string | null
          is_deleted: boolean
          deleted_at: string | null
          deleted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_date: string
          amount: number
          type: 'income' | 'expense' | 'transfer' | 'investment' | 'debt_payment' | 'debt_charge'
          category_id?: string | null
          from_account_id?: string | null
          to_account_id?: string | null
          payment_method_id?: string | null
          counterparty?: string | null
          purpose: string
          summary?: string | null
          notes?: string | null
          reference_number?: string | null
          telegram_message_id?: string | null
          is_recurring?: boolean
          recurring_frequency?: string | null
          next_occurrence?: string | null
          tags?: string[] | null
          location?: string | null
          exchange_rate?: number | null
          original_amount?: number | null
          original_currency?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_date?: string
          amount?: number
          type?: 'income' | 'expense' | 'transfer' | 'investment' | 'debt_payment' | 'debt_charge'
          category_id?: string | null
          from_account_id?: string | null
          to_account_id?: string | null
          payment_method_id?: string | null
          counterparty?: string | null
          purpose?: string
          summary?: string | null
          notes?: string | null
          reference_number?: string | null
          telegram_message_id?: string | null
          is_recurring?: boolean
          recurring_frequency?: string | null
          next_occurrence?: string | null
          tags?: string[] | null
          location?: string | null
          exchange_rate?: number | null
          original_amount?: number | null
          original_currency?: string | null
          is_deleted?: boolean
          deleted_at?: string | null
          deleted_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          category_id: string | null
          period_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          budget_amount: number
          spent_amount: number
          start_date: string
          end_date: string
          alert_threshold: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          category_id?: string | null
          period_type: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          budget_amount: number
          spent_amount?: number
          start_date: string
          end_date: string
          alert_threshold?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          category_id?: string | null
          period_type?: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
          budget_amount?: number
          spent_amount?: number
          start_date?: string
          end_date?: string
          alert_threshold?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      financial_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          goal_type: 'emergency_fund' | 'house_down_payment' | 'investment' | 'vacation' | 'retirement' | 'debt_payoff' | 'other'
          target_amount: number
          current_amount: number
          target_date: string | null
          priority: number
          is_achieved: boolean
          achievement_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          goal_type: 'emergency_fund' | 'house_down_payment' | 'investment' | 'vacation' | 'retirement' | 'debt_payoff' | 'other'
          target_amount: number
          current_amount?: number
          target_date?: string | null
          priority?: number
          is_achieved?: boolean
          achievement_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          goal_type?: 'emergency_fund' | 'house_down_payment' | 'investment' | 'vacation' | 'retirement' | 'debt_payoff' | 'other'
          target_amount?: number
          current_amount?: number
          target_date?: string | null
          priority?: number
          is_achieved?: boolean
          achievement_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      monthly_spending_summary: {
        Row: {
          user_id: string
          month: string
          category_name: string
          category_type: string
          total_amount: number
          transaction_count: number
          avg_amount: number
        }
      }
      account_balance_summary: {
        Row: {
          id: string
          user_id: string
          name: string
          type: string
          bank_name: string | null
          current_balance: number
          credit_limit: number | null
          available_balance: number
          last_updated: string
        }
      }
      net_worth_summary: {
        Row: {
          user_id: string
          category: string
          total_value: number
        }
      }
      recent_transactions_detailed: {
        Row: {
          id: string
          user_id: string
          transaction_date: string
          amount: number
          type: string
          category_name: string | null
          from_account_name: string | null
          to_account_name: string | null
          payment_method_name: string | null
          counterparty: string | null
          purpose: string
          summary: string | null
          created_at: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type aliases for convenience
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Account = Database['public']['Tables']['accounts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type PaymentMethod = Database['public']['Tables']['payment_methods']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type FinancialGoal = Database['public']['Tables']['financial_goals']['Row']