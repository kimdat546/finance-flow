import { useState, useEffect } from 'react'
import { TransactionService } from '@/lib/services/transactions'
import { AccountService } from '@/lib/services/accounts'
import { useAuth } from '@/components/providers/AuthProvider'

interface DashboardData {
  recentTransactions: any[]
  spendingByCategory: Record<string, number>
  accountSummary: any[]
  netWorth: { assets: number; liabilities: number; netWorth: number }
  monthlyStats: {
    totalIncome: number
    totalExpenses: number
    savingsRate: number
    balance: number
  }
  loading: boolean
  error: string | null
}

export function useDashboardData(): DashboardData {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData>({
    recentTransactions: [],
    spendingByCategory: {},
    accountSummary: [],
    netWorth: { assets: 0, liabilities: 0, netWorth: 0 },
    monthlyStats: {
      totalIncome: 0,
      totalExpenses: 0,
      savingsRate: 0,
      balance: 0
    },
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!user) {
      setData(prev => ({ ...prev, loading: false }))
      return
    }

    const fetchDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        // Calculate date ranges
        const today = new Date()
        const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

        // Fetch all data in parallel
        const [
          recentTransactions,
          accountSummary,
          netWorth,
          spendingByCategory,
          monthlyTransactions
        ] = await Promise.all([
          TransactionService.getRecentTransactions(10),
          AccountService.getAccountBalanceSummary(),
          AccountService.getNetWorth(),
          TransactionService.getSpendingByCategory(
            firstDayThisMonth.toISOString().split('T')[0],
            lastDayThisMonth.toISOString().split('T')[0]
          ),
          TransactionService.getTransactions({
            startDate: firstDayThisMonth.toISOString().split('T')[0],
            endDate: lastDayThisMonth.toISOString().split('T')[0]
          })
        ])

        // Calculate monthly statistics
        const totalIncome = monthlyTransactions
          ?.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0) || 0

        const totalExpenses = monthlyTransactions
          ?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0) || 0

        const balance = totalIncome - totalExpenses
        const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0

        setData({
          recentTransactions: recentTransactions || [],
          spendingByCategory: spendingByCategory || {},
          accountSummary: accountSummary || [],
          netWorth: netWorth || { assets: 0, liabilities: 0, netWorth: 0 },
          monthlyStats: {
            totalIncome,
            totalExpenses,
            savingsRate,
            balance
          },
          loading: false,
          error: null
        })

      } catch (error: any) {
        console.error('Dashboard data fetch error:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Failed to fetch dashboard data'
        }))
      }
    }

    fetchDashboardData()
  }, [user])

  return data
}

export default useDashboardData