'use client'

import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { seedReferenceData, createSampleData } from '@/lib/seed-data'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Database, Users, Zap, CheckCircle } from 'lucide-react'

export default function AdminPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isSample, setIsSample] = useState(false)
  const [seedResult, setSeedResult] = useState<string>('')
  const [sampleResult, setSampleResult] = useState<string>('')
  const { user } = useAuth()

  const handleSeedReferenceData = async () => {
    setIsSeeding(true)
    setSeedResult('')
    
    try {
      const result = await seedReferenceData()
      if (result.success) {
        setSeedResult('✅ Reference data seeded successfully!')
      } else {
        setSeedResult('❌ Error seeding reference data: ' + result.error)
      }
    } catch (error) {
      setSeedResult('❌ Error: ' + error)
    } finally {
      setIsSeeding(false)
    }
  }

  const handleCreateSampleData = async () => {
    if (!user) {
      setSampleResult('❌ Please login first')
      return
    }

    setIsSample(true)
    setSampleResult('')
    
    try {
      const result = await createSampleData()
      if (result.success) {
        setSampleResult('✅ Sample data created successfully!')
      } else {
        setSampleResult('❌ Error creating sample data: ' + result.error)
      }
    } catch (error) {
      setSampleResult('❌ Error: ' + error)
    } finally {
      setIsSample(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-pink-50 to-yellow-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Database className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Database Admin
            </span>
          </div>
          <p className="text-slate-600">Initialize and manage your FinanceFlow database</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-xl border-emerald-100">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <CardTitle>Reference Data</CardTitle>
              </div>
              <CardDescription>
                Initialize categories and payment methods for the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge className="bg-emerald-100 text-emerald-800">Categories</Badge>
                <p className="text-sm text-slate-600">
                  • Expense categories (Ăn uống, Giao thông, etc.)
                  • Income categories (Lương, Freelance, etc.)
                  • Financial categories (Tiết kiệm, Trả nợ, etc.)
                </p>
              </div>
              <div className="space-y-2">
                <Badge className="bg-blue-100 text-blue-800">Payment Methods</Badge>
                <p className="text-sm text-slate-600">
                  • Cash, Credit/Debit Cards
                  • Bank Transfer, E-wallet
                  • QR Code payments
                </p>
              </div>
              <Button
                onClick={handleSeedReferenceData}
                disabled={isSeeding}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                {isSeeding ? 'Seeding...' : 'Initialize Reference Data'}
              </Button>
              {seedResult && (
                <div className="p-3 bg-slate-50 rounded-lg text-sm">
                  {seedResult}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-xl border-purple-100">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-600" />
                <CardTitle>Sample Data</CardTitle>
              </div>
              <CardDescription>
                Create sample accounts and transactions for testing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Badge className="bg-purple-100 text-purple-800">Sample Accounts</Badge>
                <p className="text-sm text-slate-600">
                  • Vietcombank checking account
                  • BIDV credit card
                  • Cash wallet
                </p>
              </div>
              <div className="space-y-2">
                <Badge className="bg-pink-100 text-pink-800">Sample Transactions</Badge>
                <p className="text-sm text-slate-600">
                  • Food expenses, transportation
                  • Salary income
                  • Categorized automatically
                </p>
              </div>
              <Button
                onClick={handleCreateSampleData}
                disabled={isSample || !user}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
              >
                {isSample ? 'Creating...' : 'Create Sample Data'}
              </Button>
              {!user && (
                <p className="text-sm text-orange-600">
                  ⚠️ Please login first to create sample data
                </p>
              )}
              {sampleResult && (
                <div className="p-3 bg-slate-50 rounded-lg text-sm">
                  {sampleResult}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl border-yellow-100">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              <CardTitle>Database Status</CardTitle>
            </div>
            <CardDescription>
              Current state of your FinanceFlow database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <div className="font-semibold text-emerald-800">Tables</div>
                <div className="text-sm text-emerald-600">Ready</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-blue-800">Schema</div>
                <div className="text-sm text-blue-600">Deployed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-purple-800">RLS</div>
                <div className="text-sm text-purple-600">Enabled</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Zap className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <div className="font-semibold text-yellow-800">Triggers</div>
                <div className="text-sm text-yellow-600">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              ← Back to Home
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard'}>
              Go to Dashboard →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}