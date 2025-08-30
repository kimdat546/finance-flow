'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TransactionService } from '@/lib/services/transactions'
import { ReferenceService } from '@/lib/services/reference'
import { AccountService } from '@/lib/services/accounts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { CalendarIcon, DollarSign, Plus, X } from 'lucide-react'

const transactionSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  type: z.enum(['income', 'expense', 'transfer', 'investment', 'debt_payment', 'debt_charge']),
  purpose: z.string().min(1, 'Purpose is required'),
  transaction_date: z.string().min(1, 'Date is required'),
  category_id: z.string().optional(),
  from_account_id: z.string().optional(),
  to_account_id: z.string().optional(),
  payment_method_id: z.string().optional(),
  counterparty: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
  transaction?: any
  onSuccess?: () => void
  onCancel?: () => void
}

export function TransactionForm({ transaction, onSuccess, onCancel }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(transaction?.tags || [])

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: transaction?.amount || 0,
      type: transaction?.type || 'expense',
      purpose: transaction?.purpose || '',
      transaction_date: transaction?.transaction_date || new Date().toISOString().split('T')[0],
      category_id: transaction?.category_id || '',
      from_account_id: transaction?.from_account_id || '',
      to_account_id: transaction?.to_account_id || '',
      payment_method_id: transaction?.payment_method_id || '',
      counterparty: transaction?.counterparty || '',
      notes: transaction?.notes || '',
      location: transaction?.location || '',
      tags: transaction?.tags || [],
    }
  })

  const watchedType = form.watch('type')

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadReferenceData = async () => {
    try {
      const [categoriesData, accountsData, paymentMethodsData] = await Promise.all([
        ReferenceService.getCategories(),
        AccountService.getAccounts(),
        ReferenceService.getPaymentMethods(),
      ])
      
      setCategories(categoriesData || [])
      setAccounts(accountsData || [])
      setPaymentMethods(paymentMethodsData || [])
    } catch (error) {
      console.error('Error loading reference data:', error)
    }
  }

  const onSubmit = async (data: TransactionFormData) => {
    setLoading(true)
    try {
      const transactionData = {
        ...data,
        tags: tags.length > 0 ? tags : undefined,
      }

      if (transaction?.id) {
        await TransactionService.updateTransaction(transaction.id, transactionData)
      } else {
        await TransactionService.createTransaction(transactionData)
      }

      onSuccess?.()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const filteredCategories = categories.filter(cat => {
    if (watchedType === 'expense') return cat.type === 'expense'
    if (watchedType === 'income') return cat.type === 'income'
    if (watchedType === 'investment') return cat.type === 'investment'
    if (watchedType === 'debt_payment' || watchedType === 'debt_charge') return cat.type === 'debt'
    return true
  })

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <span>{transaction ? 'Edit Transaction' : 'Add New Transaction'}</span>
        </CardTitle>
        <CardDescription>
          {transaction ? 'Update transaction details' : 'Record a new financial transaction'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Transaction Type and Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Transaction Type</Label>
              <Select onValueChange={(value) => form.setValue('type', value as any)} defaultValue={form.getValues('type')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">💸 Expense</SelectItem>
                  <SelectItem value="income">💰 Income</SelectItem>
                  <SelectItem value="transfer">🔄 Transfer</SelectItem>
                  <SelectItem value="investment">📈 Investment</SelectItem>
                  <SelectItem value="debt_payment">💳 Debt Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (VND)</Label>
              <Input
                id="amount"
                type="number"
                step="1000"
                placeholder="0"
                {...form.register('amount', { valueAsNumber: true })}
                className="text-right"
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-600">{form.formState.errors.amount.message}</p>
              )}
            </div>
          </div>

          {/* Date and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transaction_date">Date</Label>
              <Input
                id="transaction_date"
                type="date"
                {...form.register('transaction_date')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select onValueChange={(value) => form.setValue('category_id', value)} defaultValue={form.getValues('category_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Accounts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_account_id">
                {watchedType === 'transfer' ? 'From Account' : 'Account'}
              </Label>
              <Select onValueChange={(value) => form.setValue('from_account_id', value)} defaultValue={form.getValues('from_account_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {watchedType === 'transfer' && (
              <div className="space-y-2">
                <Label htmlFor="to_account_id">To Account</Label>
                <Select onValueChange={(value) => form.setValue('to_account_id', value)} defaultValue={form.getValues('to_account_id')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Purpose and Counterparty */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose/Description</Label>
            <Input
              id="purpose"
              placeholder="What was this transaction for?"
              {...form.register('purpose')}
            />
            {form.formState.errors.purpose && (
              <p className="text-sm text-red-600">{form.formState.errors.purpose.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="counterparty">Counterparty (Optional)</Label>
              <Input
                id="counterparty"
                placeholder="Who was involved?"
                {...form.register('counterparty')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="payment_method_id">Payment Method</Label>
              <Select onValueChange={(value) => form.setValue('payment_method_id', value)} defaultValue={form.getValues('payment_method_id')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location and Tags */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              placeholder="Where did this happen?"
              {...form.register('location')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex space-x-2">
              <Input
                id="tags"
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-slate-500 hover:text-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              {...form.register('notes')}
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex space-x-4 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              {loading ? 'Saving...' : (transaction ? 'Update Transaction' : 'Add Transaction')}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}