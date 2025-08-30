'use client'

import { useState, useEffect } from 'react'
import { TransactionService } from '@/lib/services/transactions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Activity,
  Target
} from 'lucide-react'

interface AnalyticsData {
  monthlyTrends: any[]
  categoryBreakdown: any[]
  spendingTrends: any[]
  incomeVsExpenses: any[]
  topMerchants: any[]
  loading: boolean
}

const COLORS = [
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1'
]

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({
    monthlyTrends: [],
    categoryBreakdown: [],
    spendingTrends: [],
    incomeVsExpenses: [],
    topMerchants: [],
    loading: true
  })
  const [timeRange, setTimeRange] = useState('6months')
  const [chartType, setChartType] = useState('bar')

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setData(prev => ({ ...prev, loading: true }))
    
    try {
      // Calculate date ranges
      const today = new Date()
      const ranges = {
        '1month': new Date(today.setMonth(today.getMonth() - 1)),
        '3months': new Date(today.setMonth(today.getMonth() - 3)),
        '6months': new Date(today.setMonth(today.getMonth() - 6)),
        '1year': new Date(today.setFullYear(today.getFullYear() - 1))
      }
      
      const startDate = ranges[timeRange as keyof typeof ranges] || ranges['6months']
      const endDate = new Date()

      // Fetch transaction data
      const transactions = await TransactionService.getTransactions({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      })

      if (!transactions) return

      // Process data for different chart types
      const processedData = processTransactionData(transactions)
      setData(prev => ({
        ...prev,
        ...processedData,
        loading: false
      }))
    } catch (error) {
      console.error('Error loading analytics data:', error)
      setData(prev => ({ ...prev, loading: false }))
    }
  }

  const processTransactionData = (transactions: any[]) => {
    // Monthly trends
    const monthlyData = transactions.reduce((acc, t) => {
      const month = new Date(t.transaction_date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short' 
      })
      
      if (!acc[month]) {
        acc[month] = { month, income: 0, expenses: 0, net: 0 }
      }
      
      if (t.type === 'income') {
        acc[month].income += t.amount
      } else if (t.type === 'expense') {
        acc[month].expenses += t.amount
      }
      
      acc[month].net = acc[month].income - acc[month].expenses
      return acc
    }, {})

    const monthlyTrends = Object.values(monthlyData)
      .sort((a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime())

    // Category breakdown
    const categoryData = transactions
      .filter(t => t.type === 'expense' && t.categories?.name)
      .reduce((acc, t) => {
        const category = t.categories.name
        acc[category] = (acc[category] || 0) + t.amount
        return acc
      }, {})

    const categoryBreakdown = Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 8) // Top 8 categories

    // Spending trends (daily spending over time)
    const dailySpending = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const date = t.transaction_date
        acc[date] = (acc[date] || 0) + t.amount
        return acc
      }, {})

    const spendingTrends = Object.entries(dailySpending)
      .map(([date, amount]) => ({
        date,
        amount,
        formattedDate: new Date(date).toLocaleDateString('vi-VN')
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Income vs Expenses comparison
    const incomeVsExpenses = monthlyTrends.map((month: any) => ({
      month: month.month,
      income: month.income,
      expenses: month.expenses
    }))

    // Top merchants/counterparties
    const merchantData = transactions
      .filter(t => t.counterparty && t.type === 'expense')
      .reduce((acc, t) => {
        const merchant = t.counterparty
        acc[merchant] = (acc[merchant] || 0) + t.amount
        return acc
      }, {})

    const topMerchants = Object.entries(merchantData)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a: any, b: any) => b.amount - a.amount)
      .slice(0, 10)

    return {
      monthlyTrends,
      categoryBreakdown,
      spendingTrends,
      incomeVsExpenses,
      topMerchants
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: item.color }}>
              {item.name}: {formatCurrency(item.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (data.loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Activity className="w-6 h-6 text-emerald-600" />
            <span>Advanced Analytics</span>
          </h2>
          <p className="text-slate-600">Deep insights into your spending patterns and trends</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">1 Month</SelectItem>
              <SelectItem value="3months">3 Months</SelectItem>
              <SelectItem value="6months">6 Months</SelectItem>
              <SelectItem value="1year">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {data.monthlyTrends.length > 0 && (() => {
          const latestMonth = data.monthlyTrends[data.monthlyTrends.length - 1]
          const previousMonth = data.monthlyTrends[data.monthlyTrends.length - 2]
          
          const incomeChange = previousMonth 
            ? ((latestMonth.income - previousMonth.income) / previousMonth.income) * 100 
            : 0
          const expenseChange = previousMonth 
            ? ((latestMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100 
            : 0
          
          return (
            <>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Monthly Income
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(latestMonth.income)}
                  </div>
                  <p className={`text-xs flex items-center mt-1 ${
                    incomeChange >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {incomeChange >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(incomeChange).toFixed(1)}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Monthly Expenses
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(latestMonth.expenses)}
                  </div>
                  <p className={`text-xs flex items-center mt-1 ${
                    expenseChange <= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {expenseChange <= 0 ? <TrendingDown className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                    {Math.abs(expenseChange).toFixed(1)}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Net Savings
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {formatCurrency(latestMonth.net)}
                  </div>
                  <p className={`text-xs flex items-center mt-1 ${
                    latestMonth.net >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {latestMonth.net >= 0 ? '💰 Positive savings' : '⚠️ Deficit spending'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-slate-700">
                    Savings Rate
                  </CardTitle>
                  <Target className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-900">
                    {latestMonth.income > 0 ? ((latestMonth.net / latestMonth.income) * 100).toFixed(1) : '0'}%
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Of your income saved
                  </p>
                </CardContent>
              </Card>
            </>
          )
        })()}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChartIcon className="w-5 h-5 text-emerald-600" />
              <span>Income vs Expenses Trend</span>
            </CardTitle>
            <CardDescription>Monthly comparison over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.incomeVsExpenses} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
              <span>Spending by Category</span>
            </CardTitle>
            <CardDescription>Where your money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {data.categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Spending Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>Daily Spending Trend</span>
            </CardTitle>
            <CardDescription>Daily expense patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.spendingTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedDate" 
                    interval="preserveStartEnd"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value as number), 'Daily Spending']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#10b981" 
                    fillOpacity={0.3}
                    fill="#10b981" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Merchants */}
      {data.topMerchants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Spending Locations</CardTitle>
            <CardDescription>Where you spend the most</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topMerchants.map((merchant, index) => {
                const totalSpending = data.topMerchants.reduce((sum, m) => sum + (m.amount as number), 0)
                const percentage = ((merchant.amount as number) / totalSpending) * 100
                
                return (
                  <div key={merchant.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{merchant.name}</div>
                        <div className="text-sm text-slate-500">{percentage.toFixed(1)}% of total</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(merchant.amount as number)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">💡 Financial Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.categoryBreakdown.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800">Top Spending Category</h4>
                <p className="text-blue-700">
                  You spend the most on <strong>{data.categoryBreakdown[0]?.name}</strong> with{' '}
                  {formatCurrency(data.categoryBreakdown[0]?.value as number)} this period.
                </p>
              </div>
            )}
            {data.monthlyTrends.length > 1 && (() => {
              const latest = data.monthlyTrends[data.monthlyTrends.length - 1]
              const previous = data.monthlyTrends[data.monthlyTrends.length - 2]
              const savingsImproved = latest.net > previous.net
              
              return (
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-800">Savings Trend</h4>
                  <p className="text-blue-700">
                    Your savings have{' '}
                    <strong>{savingsImproved ? 'improved' : 'decreased'}</strong> by{' '}
                    {formatCurrency(Math.abs(latest.net - previous.net))} compared to last month.
                  </p>
                </div>
              )
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}