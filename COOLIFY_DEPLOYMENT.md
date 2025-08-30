# 🚀 Deploy FinanceFlow to Coolify

## 📋 Prerequisites

- Coolify instance running on your server
- Docker and Docker Compose installed
- Domain name pointing to your server
- Supabase account for database

## 🎯 Quick Deployment Steps

### **Step 1: Repository Setup**
```bash
# Push your code to Git repository (GitHub, GitLab, etc.)
git add .
git commit -m "Ready for Coolify deployment"
git push origin main
```

### **Step 2: Create New Project in Coolify**

1. **Login to Coolify Dashboard**
   - Navigate to your Coolify instance
   - Click "New Project"

2. **Configure Git Repository**
   - Source: Git Repository
   - Repository URL: `https://github.com/yourusername/financeflow`
   - Branch: `main`
   - Build Pack: `Docker Compose`

3. **Environment Variables**
   Copy from `.env.docker` and configure in Coolify:

   ```env
   # Required Variables
   DOMAIN=your-domain.com
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   REDIS_PASSWORD=your-secure-redis-password
   GEMINI_API_KEY=your_gemini_key
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_WEBHOOK_SECRET=random-secret-string
   NEXTAUTH_SECRET=random-secret-32-chars-min
   CRON_SECRET=random-cron-secret
   ```

### **Step 3: Database Setup**

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note down URL and keys

2. **Import Database Schemas**
   In Supabase SQL Editor, run in order:
   ```sql
   -- 1. Main schema
   -- Copy content from database/database_schema.sql
   
   -- 2. User system
   -- Copy content from database/user_system_schema.sql
   
   -- 3. Monitoring
   -- Copy content from database/monitoring_schema.sql
   ```

3. **Create Initial Data**
   ```sql
   -- Insert subscription plans
   INSERT INTO subscription_plans (id, name, price_monthly, monthly_messages) VALUES
   ('free', 'Free', 0, 50),
   ('pro', 'Pro', 9.99, 1000),
   ('business', 'Business', 29.99, -1);
   ```

### **Step 4: Deploy Services**

1. **Deploy Application**
   - In Coolify, click "Deploy"
   - Wait for build completion (5-10 minutes)

2. **Configure Domain & SSL**
   - In Coolify project settings
   - Add your domain
   - Enable SSL (Let's Encrypt automatic)

3. **Check Service Health**
   ```bash
   # Test main application
   curl https://your-domain.com/api/health
   
   # Should return JSON with status: "healthy"
   ```

## 🔧 Service Architecture

Your deployment includes:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │    │ Background      │    │ Cron Jobs       │
│   (Port 3000)  │    │ Worker          │    │ Service         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────┬───────────┴───────────┬───────────┘
                     │                       │
         ┌─────────────────┐    ┌─────────────────┐
         │     Redis       │    │   Supabase      │
         │  (Queue+Cache)  │    │  (Database)     │
         └─────────────────┘    └─────────────────┘
```

## 📊 Monitoring & Logs

### **View Logs**
```bash
# Application logs
docker logs financeflow-app -f

# Worker logs  
docker logs financeflow-worker -f

# Cron logs
docker logs financeflow-cron -f

# Redis logs
docker logs financeflow-redis -f
```

### **Health Monitoring**
- **App Health**: `https://your-domain.com/api/health`
- **System Metrics**: Built-in health monitoring
- **Error Tracking**: Automatic error logging to database
- **Cron Status**: Check `cron_logs` table in Supabase

## 🛠️ Post-Deployment Configuration

### **1. Telegram Bot Setup**
```bash
# The webhook will auto-configure, but you can verify:
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook"}'

# Test by sending message to your bot
```

### **2. Optional Services Setup**

#### **Stripe (for payments)**
```env
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **Email (SendGrid)**
```env
SENDGRID_API_KEY=SG....
```

#### **Monitoring (Sentry + Slack)**
```env
SENTRY_DSN=https://...@sentry.io/...
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

## 🔧 Scaling & Performance

### **Horizontal Scaling**
```yaml
# In docker-compose.yml, scale worker service:
worker:
  deploy:
    replicas: 3  # Scale based on load
```

### **Resource Limits**
```yaml
# Add resource limits to services:
services:
  app:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### **Redis Optimization**
- Monitor queue size via health endpoint
- Scale workers based on queue backlog
- Adjust Redis memory limits as needed

## 🚨 Troubleshooting

### **Service Not Starting**
```bash
# Check logs
docker-compose logs service-name

# Check environment variables
docker exec container-name env | grep -E "SUPABASE|REDIS|GEMINI"

# Restart specific service
docker-compose restart service-name
```

### **Database Connection Issues**
1. Verify Supabase URL and keys
2. Check RLS policies are active
3. Test connection from Supabase dashboard

### **Telegram Bot Not Responding**
1. Check webhook configuration
2. Verify bot token is correct
3. Check app logs for webhook requests
4. Test `/api/health` endpoint

### **Queue Processing Slow**
```bash
# Check Redis connection
docker exec financeflow-redis redis-cli ping

# Monitor queue size
docker exec financeflow-redis redis-cli llen bull:message-processing:wait

# Scale workers if needed
docker-compose up -d --scale worker=3
```

## 📈 Production Checklist

- [ ] ✅ All environment variables configured
- [ ] ✅ Database schemas imported
- [ ] ✅ Domain and SSL working
- [ ] ✅ Telegram bot responding
- [ ] ✅ Health endpoint returns 200
- [ ] ✅ Background worker processing
- [ ] ✅ Cron jobs running
- [ ] ✅ Error monitoring active
- [ ] ✅ Backup strategy configured
- [ ] ✅ Monitoring alerts set up

## 🎉 Your FinanceFlow SaaS is Live!

```bash
# Test the complete flow:
# 1. Send message to Telegram bot: "Spent $25 on lunch"
# 2. Check transaction created in Supabase
# 3. View on dashboard: https://your-domain.com/dashboard
```

**Congratulations! Your self-hosted FinanceFlow SaaS is now running on Coolify! 🚀**