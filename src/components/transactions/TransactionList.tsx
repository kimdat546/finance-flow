'use client'

import { useState, useEffect } from 'react'
import { TransactionService } from '@/lib/services/transactions'
import { ReferenceService } from '@/lib/services/reference'
import { AccountService } from '@/lib/services/accounts'
import { TransactionForm } from '@/components/forms/TransactionForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Download,
  Calendar,
  ArrowUpDown,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react'

interface TransactionListProps {
  refreshTrigger?: number
}

export function TransactionList({ refreshTrigger }: TransactionListProps) {
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editTransaction, setEditTransaction] = useState<any>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  useEffect(() => {
    loadData()
  }, [refreshTrigger])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, typeFilter, categoryFilter, accountFilter, dateFrom, dateTo, sortBy, sortOrder])

  const loadData = async () => {
    setLoading(true)
    try {
      const [transactionsData, categoriesData, accountsData] = await Promise.all([
        TransactionService.getTransactions(),
        ReferenceService.getCategories(),
        AccountService.getAccounts(),
      ])
      
      setTransactions(transactionsData || [])
      setCategories(categoriesData || [])
      setAccounts(accountsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = async () => {
    if (loading) return
    
    try {
      const filters: any = {}
      
      if (typeFilter !== 'all') filters.type = typeFilter
      if (categoryFilter !== 'all') filters.categoryId = categoryFilter
      if (accountFilter !== 'all') filters.accountId = accountFilter
      if (dateFrom) filters.startDate = dateFrom
      if (dateTo) filters.endDate = dateTo
      
      const filteredData = await TransactionService.getTransactions(filters)
      let results = filteredData || []
      
      // Apply search filter
      if (searchTerm) {
        results = results.filter(t => 
          t.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.counterparty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      // Apply sorting
      results.sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
          case 'date':
            comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
            break
          case 'amount':
            comparison = a.amount - b.amount
            break
          case 'purpose':
            comparison = a.purpose.localeCompare(b.purpose)
            break
          default:
            comparison = 0
        }
        
        return sortOrder === 'asc' ? comparison : -comparison
      })
      
      setTransactions(results)
    } catch (error) {
      console.error('Error applying filters:', error)
    }
  }

  const deleteTransaction = async (id: string, date: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return
    
    try {
      await TransactionService.deleteTransaction(id, date)
      await loadData()
    } catch (error: any) {
      alert(`Error deleting transaction: ${error.message}`)
    }
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

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setCategoryFilter('all')
    setAccountFilter('all')
    setDateFrom('')
    setDateTo('')
    setSortBy('date')
    setSortOrder('desc')
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">All Transactions</h2>
          <p className="text-slate-600">{transactions.length} transactions found</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Transaction</DialogTitle>
            </DialogHeader>
            <TransactionForm 
              onSuccess={() => {
                setShowAddForm(false)
                loadData()
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters & Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Input
              type="date"
              placeholder="From date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              type="date"
              placeholder="To date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">💸 Expenses</SelectItem>
                <SelectItem value="income">💰 Income</SelectItem>
                <SelectItem value="transfer">🔄 Transfers</SelectItem>
                <SelectItem value="investment">📈 Investments</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={accountFilter} onValueChange={setAccountFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Accounts</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-')
                setSortBy(field)
                setSortOrder(order)
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                  <SelectItem value="amount-desc">Amount (Highest)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Lowest)</SelectItem>
                  <SelectItem value="purpose-asc">Purpose (A-Z)</SelectItem>
                  <SelectItem value="purpose-desc">Purpose (Z-A)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={clearFilters} size="sm">
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transaction History</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="mb-4 text-4xl">📝</div>
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-sm mb-4">Try adjusting your filters or add your first transaction.</p>
              <Button onClick={() => setShowAddForm(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const isIncome = transaction.type === 'income'
                const isExpense = transaction.type === 'expense'
                const amountColor = isIncome ? 'text-green-600' : 'text-red-600'
                
                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        isIncome ? 'bg-green-100 text-green-700' : 
                        isExpense ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {transaction.counterparty?.slice(0, 2).toUpperCase() || transaction.purpose.slice(0, 2).toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-slate-900">
                            {transaction.counterparty || transaction.purpose}
                          </span>
                          {transaction.tags && transaction.tags.length > 0 && (
                            <div className="flex space-x-1">
                              {transaction.tags.slice(0, 2).map((tag: string) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {transaction.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{transaction.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span>{transaction.categories?.name || 'Uncategorized'}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.transaction_date)}</span>
                          {transaction.from_account?.name && (
                            <>
                              <span>•</span>
                              <span>{transaction.from_account.name}</span>
                            </>
                          )}
                          {transaction.location && (
                            <>
                              <span>•</span>
                              <span>{transaction.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-lg font-semibold ${amountColor}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                        </div>
                        {transaction.payment_methods?.name && (
                          <div className="text-xs text-slate-500">
                            via {transaction.payment_methods.name}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditTransaction(transaction)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Transaction</DialogTitle>
                            </DialogHeader>
                            <TransactionForm 
                              transaction={editTransaction}
                              onSuccess={() => {
                                setEditTransaction(null)
                                loadData()
                              }}
                              onCancel={() => setEditTransaction(null)}
                            />
                          </DialogContent>
                        </Dialog>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTransaction(transaction.id, transaction.transaction_date)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}