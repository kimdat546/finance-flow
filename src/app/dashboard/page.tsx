'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { useDashboardData } from '@/hooks/useDashboardData'
import { ExportService } from '@/lib/services/export'
import { TransactionList } from '@/components/transactions/TransactionList'
import { BudgetManager } from '@/components/budgets/BudgetManager'
import { GoalTracker } from '@/components/goals/GoalTracker'
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Activity,
  PlusCircle,
  Filter,
  Download,
  LogOut,
  Loader2
} from "lucide-react";

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const dashboardData = useDashboardData()
  const [exportLoading, setExportLoading] = useState(false)

  const handleExport = async (type: 'csv' | 'pdf-report' | 'pdf-budget' | 'pdf-goals') => {
    setExportLoading(true)
    try {
      switch (type) {
        case 'csv':
          await ExportService.exportTransactionsToCSV()
          break
        case 'pdf-report':
          await ExportService.exportFinancialReportToPDF()
          break
        case 'pdf-budget':
          await ExportService.exportBudgetReportToPDF()
          break
        case 'pdf-goals':
          await ExportService.exportGoalsReportToPDF()
          break
      }
      alert('Export completed successfully!')
    } catch (error: any) {
      alert(`Export failed: ${error.message}`)
    } finally {
      setExportLoading(false)
    }
  }

  useEffect(() => {
    if (!user && !dashboardData.loading) {
      router.push('/login')
    }
  }, [user, router, dashboardData.loading])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (dashboardData.loading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading your financial data...</p>
        </div>
      </div>
    )
  }

  if (dashboardData.error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-4">⚠️ Error Loading Data</div>
            <p className="text-slate-600 mb-4">{dashboardData.error}</p>
            <div className="space-x-2">
              <Button onClick={() => window.location.reload()}>Retry</Button>
              <Button variant="outline" onClick={() => router.push('/admin')}>
                Initialize Database
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user.email?.split('@')[0]}!</h1>
              <p className="text-emerald-100 mt-1">Here's your financial overview</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <select 
                onChange={(e) => e.target.value && handleExport(e.target.value as any)}
                disabled={exportLoading}
                className="px-3 py-1 text-sm border border-white/20 bg-white/10 text-white rounded-lg hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
              >
                <option value="">📥 Export</option>
                <option value="csv">CSV - Transactions</option>
                <option value="pdf-report">PDF - Financial Report</option>
                <option value="pdf-budget">PDF - Budget Report</option>
                <option value="pdf-goals">PDF - Goals Report</option>
              </select>
              <Button variant="secondary" size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="border-white text-white hover:bg-white hover:text-emerald-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Net Worth
              </CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(dashboardData.netWorth.netWorth)}
              </div>
              <p className="text-xs text-emerald-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Total assets - liabilities
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Monthly Expenses
              </CardTitle>
              <CreditCard className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(dashboardData.monthlyStats.totalExpenses)}
              </div>
              <p className="text-xs text-slate-600 flex items-center mt-1">
                <Activity className="w-3 h-3 mr-1" />
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Monthly Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(dashboardData.monthlyStats.totalIncome)}
              </div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Savings Rate
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {dashboardData.monthlyStats.savingsRate.toFixed(1)}%
              </div>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <Activity className="w-3 h-3 mr-1" />
                {dashboardData.monthlyStats.savingsRate >= 20 ? 'Great savings!' : 'Keep saving!'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Spending Categories */}
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-slate-800">Spending by Category</CardTitle>
                  <CardDescription>Your top spending categories this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(dashboardData.spendingByCategory)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([category, amount], index) => {
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500']
                      const total = Object.values(dashboardData.spendingByCategory).reduce((sum, val) => sum + val, 0)
                      const percentage = total > 0 ? (amount / total * 100).toFixed(1) : '0'
                      
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 ${colors[index]} rounded-full`}></div>
                            <span className="text-sm font-medium text-slate-700">{category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-slate-900">{formatCurrency(amount)}</div>
                            <div className="text-xs text-slate-500">{percentage}%</div>
                          </div>
                        </div>
                      )
                    })
                  }
                  {Object.keys(dashboardData.spendingByCategory).length === 0 && (
                    <div className="text-center py-4 text-slate-500">
                      No spending data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-slate-800">Recent Transactions</CardTitle>
                  <CardDescription>Your latest expense entries</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dashboardData.recentTransactions.slice(0, 5).map((transaction, index) => {
                    const isIncome = transaction.type === 'income'
                    const isExpense = transaction.type === 'expense'
                    const initials = transaction.counterparty 
                      ? transaction.counterparty.slice(0, 2).toUpperCase()
                      : transaction.purpose.slice(0, 2).toUpperCase()
                    
                    const bgColor = isIncome ? 'bg-green-100' : isExpense ? 'bg-red-100' : 'bg-blue-100'
                    const textColor = isIncome ? 'text-green-600' : isExpense ? 'text-red-600' : 'text-blue-600'
                    const amountColor = isIncome ? 'text-green-600' : 'text-red-600'
                    
                    return (
                      <div key={transaction.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}>
                            <span className={`text-xs font-medium ${textColor}`}>{initials}</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {transaction.counterparty || transaction.purpose}
                            </div>
                            <div className="text-xs text-slate-500">
                              {transaction.category_name || 'Uncategorized'} • {formatDate(transaction.transaction_date)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${amountColor}`}>
                            {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {transaction.telegram_message_id ? 'Auto-categorized' : 'Manual'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                  {dashboardData.recentTransactions.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <div className="mb-2">📝 No transactions yet</div>
                      <p className="text-sm">Start by adding your first transaction or visit the admin page to create sample data.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Budget Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Progress</CardTitle>
                <CardDescription>How you're tracking against your monthly budgets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Food & Dining</span>
                      <span className="text-sm text-slate-600">$847 / $1,000</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: '84.7%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Transportation</span>
                      <span className="text-sm text-slate-600">$423 / $500</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: '84.6%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Shopping</span>
                      <span className="text-sm text-red-600">$513 / $400</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '100%'}}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionList refreshTrigger={0} />
          </TabsContent>

          <TabsContent value="budgets">
            <BudgetManager />
          </TabsContent>

          <TabsContent value="goals">
            <GoalTracker />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}