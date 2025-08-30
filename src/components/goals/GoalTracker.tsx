'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { GoalService } from '@/lib/services/goals'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  DollarSign,
  Trophy,
  Flag,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Lightbulb,
  PlusCircle
} from 'lucide-react'

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  description: z.string().optional(),
  goal_type: z.enum(['emergency_fund', 'house_down_payment', 'investment', 'vacation', 'retirement', 'debt_payoff', 'other']),
  target_amount: z.number().min(1, 'Target amount must be greater than 0'),
  current_amount: z.number().min(0).default(0),
  target_date: z.string().optional(),
  priority: z.number().min(1).max(5).default(3),
  notes: z.string().optional(),
})

type GoalFormData = z.infer<typeof goalSchema>

export function GoalTracker() {
  const [goals, setGoals] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [editGoal, setEditGoal] = useState<any>(null)
  const [progressAmount, setProgressAmount] = useState<string>('')
  const [selectedGoal, setSelectedGoal] = useState<string>('')

  const form = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: '',
      description: '',
      goal_type: 'other',
      target_amount: 0,
      current_amount: 0,
      target_date: '',
      priority: 3,
      notes: '',
    }
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [goalsData, suggestionsData, progressData] = await Promise.all([
        GoalService.getGoals(),
        GoalService.getGoalSuggestions(),
        GoalService.getGoalProgress(),
      ])
      
      setGoals(progressData || [])
      setSuggestions(suggestionsData || [])
    } catch (error) {
      console.error('Error loading goal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: GoalFormData) => {
    try {
      if (editGoal?.id) {
        await GoalService.updateGoal(editGoal.id, data)
        setEditGoal(null)
      } else {
        await GoalService.createGoal(data)
        setShowAddForm(false)
      }
      
      form.reset()
      await loadData()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const deleteGoal = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return
    
    try {
      await GoalService.deleteGoal(id)
      await loadData()
    } catch (error: any) {
      alert(`Error deleting goal: ${error.message}`)
    }
  }

  const addProgress = async () => {
    if (!selectedGoal || !progressAmount) return
    
    try {
      await GoalService.addProgress(selectedGoal, parseFloat(progressAmount))
      setProgressAmount('')
      setSelectedGoal('')
      await loadData()
    } catch (error: any) {
      alert(`Error adding progress: ${error.message}`)
    }
  }

  const createGoalFromSuggestion = (suggestion: any) => {
    form.setValue('name', suggestion.name)
    form.setValue('description', suggestion.description)
    form.setValue('goal_type', suggestion.goal_type)
    form.setValue('target_amount', suggestion.target_amount)
    form.setValue('priority', suggestion.priority)
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

  const getGoalTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency_fund': return '🛡️'
      case 'house_down_payment': return '🏠'
      case 'investment': return '📈'
      case 'vacation': return '✈️'
      case 'retirement': return '🏖️'
      case 'debt_payoff': return '💳'
      default: return '🎯'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-red-100 text-red-800'
      case 2: return 'bg-orange-100 text-orange-800'
      case 3: return 'bg-yellow-100 text-yellow-800'
      case 4: return 'bg-blue-100 text-blue-800'
      case 5: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading goals...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <Target className="w-6 h-6 text-emerald-600" />
            <span>Financial Goals</span>
          </h2>
          <p className="text-slate-600">Track your financial objectives and savings targets</p>
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
                <DialogTitle>Goal Suggestions</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getGoalTypeIcon(suggestion.goal_type)}</span>
                        <h4 className="font-medium">{suggestion.name}</h4>
                      </div>
                      <p className="text-sm text-slate-600 mt-1">{suggestion.description}</p>
                      <p className="text-sm text-emerald-600 mt-1">
                        Suggested: {formatCurrency(suggestion.suggested_monthly)}/month
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <div className="font-semibold text-emerald-600">
                          {formatCurrency(suggestion.target_amount)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => createGoalFromSuggestion(suggestion)}
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
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Emergency Fund"
                    {...form.register('name')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goal_type">Goal Type</Label>
                  <Select onValueChange={(value) => form.setValue('goal_type', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency_fund">🛡️ Emergency Fund</SelectItem>
                      <SelectItem value="house_down_payment">🏠 House Down Payment</SelectItem>
                      <SelectItem value="investment">📈 Investment</SelectItem>
                      <SelectItem value="vacation">✈️ Vacation</SelectItem>
                      <SelectItem value="retirement">🏖️ Retirement</SelectItem>
                      <SelectItem value="debt_payoff">💳 Debt Payoff</SelectItem>
                      <SelectItem value="other">🎯 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_amount">Target Amount (VND)</Label>
                    <Input
                      id="target_amount"
                      type="number"
                      step="100000"
                      {...form.register('target_amount', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="current_amount">Current Amount (VND)</Label>
                    <Input
                      id="current_amount"
                      type="number"
                      step="100000"
                      {...form.register('current_amount', { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="target_date">Target Date (Optional)</Label>
                    <Input
                      id="target_date"
                      type="date"
                      {...form.register('target_date')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select onValueChange={(value) => form.setValue('priority', parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">🔥 Very High</SelectItem>
                        <SelectItem value="2">⚡ High</SelectItem>
                        <SelectItem value="3">⚖️ Medium</SelectItem>
                        <SelectItem value="4">📅 Low</SelectItem>
                        <SelectItem value="5">💤 Very Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your goal..."
                    {...form.register('description')}
                    rows={2}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Create Goal
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Progress Add */}
      {goals.filter(g => !g.is_achieved).length > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" />
              <span>Add Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Select value={selectedGoal} onValueChange={setSelectedGoal}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {goals.filter(g => !g.is_achieved).map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {getGoalTypeIcon(goal.goal_type)} {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Amount"
                value={progressAmount}
                onChange={(e) => setProgressAmount(e.target.value)}
                className="w-32"
              />
              <Button onClick={addProgress} disabled={!selectedGoal || !progressAmount}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Goals */}
      {goals.filter(g => !g.is_achieved).length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-slate-900">Active Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals
              .filter(goal => !goal.is_achieved)
              .sort((a, b) => a.priority - b.priority)
              .map((goal) => (
                <Card key={goal.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getGoalTypeIcon(goal.goal_type)}</span>
                        <CardTitle className="text-lg">{goal.name}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditGoal(goal)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteGoal(goal.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {goal.description && (
                      <CardDescription>{goal.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Progress</span>
                        <span className="font-semibold">
                          {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                      
                      <Progress value={goal.progress_percentage} className="h-2" />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-600">Remaining</span>
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(goal.remaining_amount)}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-600">Complete</span>
                          <div className="font-semibold text-emerald-600">
                            {goal.progress_percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      
                      {goal.target_date && (
                        <div className="text-sm">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">Target: {formatDate(goal.target_date)}</span>
                          </div>
                          {goal.days_remaining !== null && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className={`text-sm ${goal.days_remaining < 30 ? 'text-red-600' : 'text-slate-600'}`}>
                                {goal.days_remaining > 0 ? `${goal.days_remaining} days left` : 'Overdue'}
                              </span>
                            </div>
                          )}
                          {goal.suggested_monthly_amount && (
                            <div className="text-xs text-emerald-600 mt-1">
                              Suggested: {formatCurrency(goal.suggested_monthly_amount)}/month
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <Badge className={`absolute top-2 right-2 ${getPriorityColor(goal.priority)}`}>
                    Priority {goal.priority}
                  </Badge>
                </Card>
              ))}
          </div>
        </>
      )}

      {/* Achieved Goals */}
      {goals.filter(g => g.is_achieved).length > 0 && (
        <>
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-slate-900">Achieved Goals</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals
              .filter(goal => goal.is_achieved)
              .map((goal) => (
                <Card key={goal.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <CardTitle className="text-lg text-green-800">{goal.name}</CardTitle>
                      </div>
                      <Trophy className="w-5 h-5 text-yellow-500" />
                    </div>
                    {goal.description && (
                      <CardDescription className="text-green-700">{goal.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">Achieved Amount</span>
                        <span className="font-semibold text-green-800">
                          {formatCurrency(goal.current_amount)}
                        </span>
                      </div>
                      {goal.achievement_date && (
                        <div className="text-sm text-green-600">
                          Completed on {formatDate(goal.achievement_date)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No goals created yet</h3>
            <p className="text-slate-600 mb-4">Start by setting your first financial goal</p>
            <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}