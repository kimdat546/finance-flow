import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { TransactionService } from './transactions'
import { AccountService } from './accounts'
import { BudgetService } from './budgets'
import { GoalService } from './goals'

export class ExportService {
  // Export transactions to CSV
  static async exportTransactionsToCSV(filters?: any) {
    try {
      const transactions = await TransactionService.getTransactions(filters)
      
      if (!transactions || transactions.length === 0) {
        throw new Error('No transactions to export')
      }

      // Define CSV headers
      const headers = [
        'Date',
        'Type',
        'Amount',
        'Category',
        'Purpose',
        'Counterparty',
        'Account',
        'Payment Method',
        'Location',
        'Tags',
        'Notes'
      ]

      // Convert transactions to CSV format
      const csvData = transactions.map(t => [
        t.transaction_date,
        t.type,
        t.amount,
        t.categories?.name || '',
        t.purpose,
        t.counterparty || '',
        t.accounts?.name || '',
        t.payment_methods?.name || '',
        t.location || '',
        (t.tags || []).join('; '),
        t.notes || ''
      ])

      // Combine headers and data
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true, count: transactions.length }
    } catch (error: any) {
      throw new Error(`Export failed: ${error.message}`)
    }
  }

  // Export financial report to PDF
  static async exportFinancialReportToPDF() {
    try {
      // Get financial data
      const today = new Date()
      const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDayThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      const startDate = firstDayThisMonth.toISOString().split('T')[0]
      const endDate = lastDayThisMonth.toISOString().split('T')[0]

      const [accounts, transactions, budgets, goals] = await Promise.all([
        AccountService.getAccountBalanceSummary(),
        TransactionService.getTransactions({ startDate, endDate }),
        BudgetService.getCurrentBudgets(),
        GoalService.getActiveGoals()
      ])

      // Calculate monthly summary
      const totalIncome = (transactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

      const totalExpenses = (transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

      const netSavings = totalIncome - totalExpenses
      const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0

      // Category breakdown
      const categoryBreakdown = (transactions || [])
        .filter(t => t.type === 'expense' && t.categories?.name)
        .reduce((acc, t) => {
          const category = t.categories!.name
          acc[category] = (acc[category] || 0) + t.amount
          return acc
        }, {} as Record<string, number>)

      // Create PDF
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      let yPosition = 20

      // Helper function to format currency
      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
        }).format(amount)
      }

      // Title
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('FinanceFlow Monthly Report', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Report period
      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const reportPeriod = `${firstDayThisMonth.toLocaleDateString('vi-VN')} - ${lastDayThisMonth.toLocaleDateString('vi-VN')}`
      pdf.text(reportPeriod, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      // Financial Summary
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Financial Summary', 20, yPosition)
      yPosition += 10

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      const summaryData = [
        `Total Income: ${formatCurrency(totalIncome)}`,
        `Total Expenses: ${formatCurrency(totalExpenses)}`,
        `Net Savings: ${formatCurrency(netSavings)}`,
        `Savings Rate: ${savingsRate.toFixed(1)}%`
      ]

      summaryData.forEach(item => {
        pdf.text(item, 20, yPosition)
        yPosition += 8
      })
      yPosition += 10

      // Account Balances
      if (accounts && accounts.length > 0) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Account Balances', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        accounts.forEach(account => {
          pdf.text(`${account.name}: ${formatCurrency(account.current_balance)}`, 20, yPosition)
          yPosition += 8
        })
        yPosition += 10
      }

      // Top Spending Categories
      if (Object.keys(categoryBreakdown).length > 0) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Top Spending Categories', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        const topCategories = Object.entries(categoryBreakdown)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)

        topCategories.forEach(([category, amount]) => {
          const percentage = (amount / totalExpenses * 100).toFixed(1)
          pdf.text(`${category}: ${formatCurrency(amount)} (${percentage}%)`, 20, yPosition)
          yPosition += 8
        })
        yPosition += 10
      }

      // Budget Status
      if (budgets && budgets.length > 0) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Budget Status', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        budgets.forEach(budget => {
          const progress = ((budget.spent_amount / budget.budget_amount) * 100).toFixed(1)
          const status = budget.spent_amount > budget.budget_amount ? '(Over Budget)' : '(On Track)'
          pdf.text(`${budget.name}: ${progress}% spent ${status}`, 20, yPosition)
          yPosition += 8
        })
        yPosition += 10
      }

      // Goal Progress
      if (goals && goals.length > 0) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Goal Progress', 20, yPosition)
        yPosition += 10

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        goals.slice(0, 5).forEach(goal => {
          const progress = ((goal.current_amount / goal.target_amount) * 100).toFixed(1)
          pdf.text(`${goal.name}: ${progress}% complete`, 20, yPosition)
          yPosition += 8
        })
        yPosition += 10
      }

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'italic')
      pdf.text(`Generated on ${new Date().toLocaleString('vi-VN')}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
      pdf.text('Created with FinanceFlow', pageWidth / 2, pageHeight - 5, { align: 'center' })

      // Download PDF
      pdf.save(`financial_report_${new Date().toISOString().split('T')[0]}.pdf`)

      return { success: true }
    } catch (error: any) {
      throw new Error(`PDF export failed: ${error.message}`)
    }
  }

  // Export budget report to PDF
  static async exportBudgetReportToPDF() {
    try {
      const budgets = await BudgetService.getBudgetProgress()
      
      if (!budgets || budgets.length === 0) {
        throw new Error('No budgets to export')
      }

      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      let yPosition = 20

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
        }).format(amount)
      }

      // Title
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Budget Report', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated on ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      // Budget details
      budgets.forEach(budget => {
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text(budget.name, 20, yPosition)
        yPosition += 10

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        
        const budgetData = [
          `Category: ${budget.categories?.name || 'All Categories'}`,
          `Period: ${budget.start_date} to ${budget.end_date}`,
          `Budget Amount: ${formatCurrency(budget.budget_amount)}`,
          `Spent Amount: ${formatCurrency(budget.spent_amount)}`,
          `Remaining: ${formatCurrency(budget.remaining_amount)}`,
          `Progress: ${budget.progress_percentage.toFixed(1)}%`,
          `Status: ${budget.is_over_budget ? 'Over Budget' : budget.is_near_limit ? 'Near Limit' : 'On Track'}`
        ]

        budgetData.forEach(item => {
          pdf.text(item, 25, yPosition)
          yPosition += 7
        })
        yPosition += 10
      })

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Created with FinanceFlow', pageWidth / 2, pageHeight - 5, { align: 'center' })

      pdf.save(`budget_report_${new Date().toISOString().split('T')[0]}.pdf`)

      return { success: true, count: budgets.length }
    } catch (error: any) {
      throw new Error(`Budget report export failed: ${error.message}`)
    }
  }

  // Export goals report to PDF
  static async exportGoalsReportToPDF() {
    try {
      const goals = await GoalService.getGoalProgress()
      
      if (!goals || goals.length === 0) {
        throw new Error('No goals to export')
      }

      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      let yPosition = 20

      const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
          minimumFractionDigits: 0,
        }).format(amount)
      }

      // Title
      pdf.setFontSize(20)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Financial Goals Report', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated on ${new Date().toLocaleDateString('vi-VN')}`, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 20

      // Separate active and achieved goals
      const activeGoals = goals.filter(g => !g.is_achieved)
      const achievedGoals = goals.filter(g => g.is_achieved)

      // Active Goals
      if (activeGoals.length > 0) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Active Goals', 20, yPosition)
        yPosition += 10

        activeGoals.forEach(goal => {
          pdf.setFontSize(14)
          pdf.setFont('helvetica', 'bold')
          pdf.text(goal.name, 20, yPosition)
          yPosition += 8

          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          
          const goalData = [
            `Type: ${goal.goal_type.replace('_', ' ')}`,
            `Target Amount: ${formatCurrency(goal.target_amount)}`,
            `Current Amount: ${formatCurrency(goal.current_amount)}`,
            `Progress: ${goal.progress_percentage.toFixed(1)}%`,
            `Remaining: ${formatCurrency(goal.remaining_amount)}`,
          ]

          if (goal.target_date) {
            goalData.push(`Target Date: ${new Date(goal.target_date).toLocaleDateString('vi-VN')}`)
          }

          if (goal.suggested_monthly_amount) {
            goalData.push(`Suggested Monthly: ${formatCurrency(goal.suggested_monthly_amount)}`)
          }

          goalData.forEach(item => {
            pdf.text(item, 25, yPosition)
            yPosition += 6
          })
          yPosition += 8
        })
      }

      // Achieved Goals
      if (achievedGoals.length > 0) {
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Achieved Goals', 20, yPosition)
        yPosition += 10

        achievedGoals.forEach(goal => {
          pdf.setFontSize(14)
          pdf.setFont('helvetica', 'bold')
          pdf.text(`✓ ${goal.name}`, 20, yPosition)
          yPosition += 8

          pdf.setFontSize(12)
          pdf.setFont('helvetica', 'normal')
          pdf.text(`Amount: ${formatCurrency(goal.current_amount)}`, 25, yPosition)
          yPosition += 6
          if (goal.achievement_date) {
            pdf.text(`Completed: ${new Date(goal.achievement_date).toLocaleDateString('vi-VN')}`, 25, yPosition)
            yPosition += 6
          }
          yPosition += 8
        })
      }

      // Footer
      const pageHeight = pdf.internal.pageSize.getHeight()
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'italic')
      pdf.text('Created with FinanceFlow', pageWidth / 2, pageHeight - 5, { align: 'center' })

      pdf.save(`goals_report_${new Date().toISOString().split('T')[0]}.pdf`)

      return { success: true, count: goals.length }
    } catch (error: any) {
      throw new Error(`Goals report export failed: ${error.message}`)
    }
  }

  // Export chart as image (helper function)
  static async exportChartAsImage(elementId: string, filename: string) {
    try {
      const element = document.getElementById(elementId)
      if (!element) {
        throw new Error('Chart element not found')
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2
      })

      const link = document.createElement('a')
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      return { success: true }
    } catch (error: any) {
      throw new Error(`Chart export failed: ${error.message}`)
    }
  }
}