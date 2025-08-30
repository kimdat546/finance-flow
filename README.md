# 🌊 FinanceFlow - AI-Powered Personal Finance SaaS

> Transform natural language messages into structured financial data with AI-powered expense tracking

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/financeflow)

## 🚀 Quick Deploy to Production

### 1. **One-Click Vercel Deployment**
1. Fork this repository
2. Connect to Vercel via GitHub
3. Configure environment variables (see below)
4. Deploy automatically!

### 2. **Required Environment Variables**
Add these in your Vercel dashboard:

```env
# Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Redis Queue (Upstash recommended)
REDIS_URL=redis://default:password@host:port

# AI Service
GEMINI_API_KEY=your_gemini_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=random_secret_string

# Security
NEXTAUTH_SECRET=random_secret_for_auth
CRON_SECRET=random_secret_for_cron_jobs
```

### 3. **Post-Deployment Setup**
After Vercel deployment completes:

1. **Database**: Import schemas from `database/` folder to Supabase
2. **Telegram Bot**: Webhook configures automatically
3. **Test**: Send "Spent $25 on lunch" to your bot

## ✨ Features

- **🤖 AI-Powered**: Natural language → structured transactions
- **📱 Multi-Platform**: Telegram, WhatsApp, SMS support
- **⚡ Real-time**: Instant processing & dashboard updates
- **💰 SaaS Ready**: Subscription tiers & billing
- **🔒 Multi-tenant**: Secure data isolation
- **📊 Smart Analytics**: Spending insights & patterns

## 🏗️ Architecture

```
Message → Telegram Bot → API Route → Redis Queue → AI Processing → Database → Dashboard
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Fill in your values

# Run development server
npm run dev

# Run background worker (separate terminal)
npm run worker
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/              # API routes & webhooks
│   ├── dashboard/        # Dashboard pages
│   └── page.tsx         # Landing page
├── components/          # React components
├── lib/                # Services & utilities
└── workers/            # Background processors

database/               # SQL schemas
scripts/               # Setup scripts
```

## 💰 SaaS Features

### Subscription Tiers
- **Free**: 50 messages/month
- **Pro**: 1000 messages/month + analytics  
- **Business**: Unlimited + API access

### Auto-Processing Patterns
- Smart categorization rules
- Recurring transactions
- Bank SMS processing
- Email receipt parsing
- Location-based tagging

## 📊 Monitoring

- Health check: `/api/health`
- Built-in error tracking
- Performance monitoring
- Queue processing metrics

## 🔧 Manual Deployment

If you prefer more control:

### Frontend (Vercel)
```bash
npm install -g vercel
vercel --prod
```

### Background Workers (Railway)
```bash
railway up --service worker
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

**Made with ❤️ for effortless expense tracking**
