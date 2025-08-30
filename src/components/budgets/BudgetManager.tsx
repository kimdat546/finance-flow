'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BudgetService } from '@/lib/services/budgets'
import { ReferenceService } from '@/lib/services/reference'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  PiggyBank, 
  Plus, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  Calendar,
  Target,
  Edit,
  Trash2,
  Lightbulb
} from 'lucide-react'

const budgetSchema = z.object({
  name: z.string().min(1, 'Budget name is required'),
  category_id: z.string().optional(),
  period_type: z.enum(['weekly', 'monthly', 'quarterly', 'yearly']),
  budget_amount: z.number().min(1, 'Budget amount must be greater than 0'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  alert_threshold: z.number().min(0).max(1).default(0.8),
})

type BudgetFormData = z.infer<typeof budgetSchema>

export function BudgetManager() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editBudget, setEditBudget] = useState<any>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      category_id: '',
      period_type: 'monthly',
      budget_amount: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      alert_threshold: 0.8,
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [budgetsData, categoriesData, progressData, suggestionsData] = await Promise.all([
        BudgetService.getBudgets(),
        ReferenceService.getCategoriesByType('expense'),
        BudgetService.getBudgetProgress(),
        BudgetService.getBudgetSuggestions(),
      ])
      
      setBudgets(progressData || [])
      setCategories(categoriesData || [])
      setSuggestions(suggestionsData || [])
    } catch (error) {
      console.error('Error loading budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: BudgetFormData) => {
    try {
      if (editBudget?.id) {
        await BudgetService.updateBudget(editBudget.id, data)
        setEditBudget(null)
      } else {
        await BudgetService.createBudget(data)
        setShowAddForm(false)
      }
      
      form.reset()
      await loadData()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const deleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return
    
    try {
      await BudgetService.deleteBudget(id)
      await loadData()
    } catch (error: any) {
      alert(`Error deleting budget: ${error.message}`)
    }
  }

  const createBudgetFromSuggestion = (suggestion: any) => {
    form.setValue('name', `${suggestion.categoryName} Budget`)
    form.setValue('category_id', suggestion.categoryId === 'uncategorized' ? '' : suggestion.categoryId)
    form.setValue('budget_amount', suggestion.suggestedBudget)
    setShowSuggestions(false)
    setShowAddForm(true)
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

  const getBudgetStatus = (budget: any) => {
    if (budget.is_over_budget) return { color: 'text-red-600', icon: AlertTriangle, text: 'Over Budget' }
    if (budget.is_near_limit) return { color: 'text-yellow-600', icon: AlertTriangle, text: 'Near Limit' }
    return { color: 'text-green-600', icon: CheckCircle, text: 'On Track' }
  }

  if (loading) {
    return <div className="text-center py-8">Loading budgets...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <PiggyBank className="w-6 h-6 text-emerald-600" />
            <span>Budget Management</span>
          </h2>
          <p className="text-slate-600">Track and manage your spending limits</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Lightbulb className="w-4 h-4 mr-2" />
                Suggestions
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Budget Suggestions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {suggestions.slice(0, 5).map((suggestion) => (
                  <div key={suggestion.categoryId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{suggestion.categoryName}</h4>
                      <p className="text-sm text-slate-600">
                        Average: {formatCurrency(suggestion.monthlyAverage)}/month
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(suggestion.suggestedBudget)}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => createBudgetFromSuggestion(suggestion)}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Budget Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Monthly Food Budget"
                    {...form.register('name')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category (Optional)</Label>
                  <Select onValueChange={(value) => form.setValue('category_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="period_type">Period</Label>
                    <Select onValueChange={(value) => form.setValue('period_type', value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget_amount">Amount (VND)</Label>
                    <Input
                      id="budget_amount"
                      type="number"
                      step="10000"
                      {...form.register('budget_amount', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Start Date</Label>
                    <Input
                      id="start_date"
                      type="date"
                      {...form.register('start_date')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">End Date</Label>
                    <Input
                      id="end_date"
                      type="date"
                      {...form.register('end_date')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alert_threshold">Alert at % spent</Label>
                  <Input
                    id="alert_threshold"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    placeholder="80"
                    {...form.register('alert_threshold', { 
                      valueAsNumber: true,
                      setValueAs: (value) => value / 100
                    })}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Budget
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Budget Overview */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {budgets.filter(b => {
            const today = new Date().toISOString().split('T')[0]
            return b.start_date <= today && b.end_date >= today
          }).map((budget) => {
            const status = getBudgetStatus(budget)
            const StatusIcon = status.icon
            
            return (
              <Card key={budget.id} className="relative overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                    <div className="flex space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditBudget(budget)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteBudget(budget.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {budget.categories?.name || 'All Categories'} • {budget.period_type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Spent</span>
                      <span className={status.color}>
                        {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.budget_amount)}
                      </span>
                    </div>
                    
                    <Progress 
                      value={Math.min(budget.progress_percentage, 100)} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <span className={`text-sm ${status.color}`}>{status.text}</span>
                      </div>
                      <span className="text-sm font-medium">
                        {budget.remaining_amount >= 0 
                          ? `${formatCurrency(budget.remaining_amount)} left`
                          : `${formatCurrency(Math.abs(budget.remaining_amount))} over`
                        }
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-500">
                      {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                    </div>
                  </div>
                </CardContent>
                
                {budget.is_over_budget && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                    Over Budget
                  </div>
                )}
                
                {budget.is_near_limit && !budget.is_over_budget && (
                  <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-bl-lg">
                    Near Limit
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* All Budgets Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Budgets</CardTitle>
          <CardDescription>Manage all your budget periods</CardDescription>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <PiggyBank className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No budgets created yet</h3>
              <p className="text-slate-600 mb-4">Start by creating your first budget to track spending</p>
              <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => {
                const status = getBudgetStatus(budget)
                const StatusIcon = status.icon
                const isActive = new Date(budget.start_date) <= new Date() && new Date(budget.end_date) >= new Date()
                
                return (
                  <div key={budget.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-emerald-100' : 'bg-slate-100'
                      }`}>
                        <PiggyBank className={`w-6 h-6 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-slate-900">{budget.name}</h4>
                        <div className="text-sm text-slate-600 flex items-center space-x-2">
                          <span>{budget.categories?.name || 'All Categories'}</span>
                          <span>•</span>
                          <span>{formatDate(budget.start_date)} - {formatDate(budget.end_date)}</span>
                          {isActive && <Badge variant="outline" className="text-xs">Active</Badge>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(budget.budget_amount)}</div>
                        <div className="flex items-center space-x-1 text-sm">
                          <StatusIcon className={`w-3 h-3 ${status.color}`} />
                          <span className={status.color}>
                            {budget.progress_percentage.toFixed(0)}% spent
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditBudget(budget)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteBudget(budget.id)}>
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