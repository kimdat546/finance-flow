# 🚀 Deploy FinanceFlow to Production

## 📋 Quick Deployment (Recommended)

### **Step 1: Repository Setup**
```bash
# Create new GitHub repository
# Push your code
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/financeflow.git
git push -u origin main
```

### **Step 2: One-Click Vercel Deploy**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project" 
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Click "Deploy" (will fail first time - that's expected)

### **Step 3: Configure Environment Variables**
In Vercel dashboard → Settings → Environment Variables, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
REDIS_URL=redis://default:password@host:port
GEMINI_API_KEY=your_gemini_key
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=any_random_string
NEXTAUTH_SECRET=any_random_string
CRON_SECRET=any_random_string
```

### **Step 4: Set Up Services**

#### **Database (Supabase)**
1. Create account at [supabase.com](https://supabase.com)
2. Create new project  
3. Go to SQL Editor
4. Run these files in order:
   - `database/database_schema.sql`
   - `database/user_system_schema.sql` 
   - `database/monitoring_schema.sql`

#### **Redis (Upstash)**
1. Create account at [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy connection URL to `REDIS_URL`

#### **Telegram Bot**
1. Message @BotFather on Telegram
2. Create new bot with `/newbot`
3. Copy token to `TELEGRAM_BOT_TOKEN`

#### **AI Service (Google Gemini)**
1. Go to [ai.google.dev](https://ai.google.dev)
2. Get API key
3. Copy to `GEMINI_API_KEY`

### **Step 5: Deploy & Test**
1. Trigger new deployment in Vercel (or push code change)
2. Test health: `curl https://your-app.vercel.app/api/health`
3. Send message to your Telegram bot
4. Check if transaction appears in Supabase

## 🔧 Background Workers (Optional)

**For production scale**, deploy workers separately:

### Railway (Recommended)
1. Create [railway.app](https://railway.app) account
2. Create new project  
3. Connect GitHub repository
4. Select "Deploy from GitHub"
5. Set start command: `node worker.js`

### Alternative: Vercel Cron (Lighter Load)
Workers will run as serverless functions via `vercel.json` cron jobs (already configured).

## ⚙️ Do You Need CI/CD & Setup Scripts?

**For simple deployment: NO**
- Vercel handles deployments automatically on git push
- Environment variables are managed in dashboard
- Database changes are done manually in Supabase

**Use CI/CD (.github/workflows) IF you want:**
- Automated testing before deployment
- Multiple environments (staging, production)
- Database migrations automation
- Team collaboration with approval workflows

**Use Setup Scripts (.sh files) IF you want:**
- Automated server configuration
- Local development environment setup
- Complex multi-service deployments
- Infrastructure-as-code approach

## 🎯 Minimal Production Setup

**Just need these files for basic Vercel deployment:**
- ✅ `package.json` (dependencies)
- ✅ `vercel.json` (Vercel configuration)
- ✅ `next.config.ts` (Next.js config)
- ✅ Your source code in `/src`
- ✅ Database schemas in `/database` 
- ✅ `.env.example` (for reference)

**Optional files you can skip initially:**
- ❌ `.github/workflows/` (CI/CD)
- ❌ `scripts/setup-production.sh` (automated setup)
- ❌ `Dockerfile` (container deployment)
- ❌ `worker.js` (if using Vercel cron instead)

## 🚨 Quick Troubleshooting

**Build fails?**
- Check all environment variables are set
- Ensure no TypeScript errors: `npm run build`

**Bot not responding?**
- Webhook auto-configures on first API call
- Check `/api/health` returns 200
- Verify `TELEGRAM_BOT_TOKEN` is correct

**Database connection fails?**
- Check Supabase URLs and keys
- Ensure RLS policies are active
- Test connection in Supabase dashboard

---

🎉 **Your FinanceFlow SaaS will be live in ~10 minutes!**