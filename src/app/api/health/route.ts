import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Health check endpoint for monitoring
export async function GET() {
  const startTime = Date.now();
  const checks = {
    database: false,
    redis: false,
    ai_service: false,
  };
  
  let overallStatus = 'healthy';
  const errors: string[] = [];

  try {
    // Check database connection
    try {
      const { error } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (!error) {
        checks.database = true;
      } else {
        errors.push(`Database: ${error.message}`);
        overallStatus = 'unhealthy';
      }
    } catch (dbError) {
      errors.push(`Database: ${dbError}`);
      overallStatus = 'unhealthy';
    }

    // Check Redis connection
    try {
      if (process.env.REDIS_URL) {
        const redis = new Redis(process.env.REDIS_URL, {
          connectTimeout: 5000,
          lazyConnect: true,
        });
        
        const response = await redis.ping();
        if (response === 'PONG') {
          checks.redis = true;
        } else {
          errors.push('Redis: Invalid ping response');
          overallStatus = 'degraded';
        }
        
        await redis.quit();
      } else {
        errors.push('Redis: REDIS_URL not configured');
        overallStatus = 'degraded';
      }
    } catch (redisError) {
      errors.push(`Redis: ${redisError}`);
      overallStatus = 'degraded';
    }

    // Check AI service (Gemini)
    try {
      if (process.env.GEMINI_API_KEY) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: 'test' }]
              }]
            }),
            signal: AbortSignal.timeout(10000), // 10s timeout
          }
        );

        if (response.ok) {
          checks.ai_service = true;
        } else {
          errors.push(`AI Service: HTTP ${response.status}`);
          overallStatus = 'degraded';
        }
      } else {
        errors.push('AI Service: GEMINI_API_KEY not configured');
        overallStatus = 'degraded';
      }
    } catch (aiError) {
      errors.push(`AI Service: ${aiError}`);
      overallStatus = 'degraded';
    }

  } catch (error) {
    errors.push(`General: ${error}`);
    overallStatus = 'unhealthy';
  }

  const responseTime = Date.now() - startTime;

  const healthData = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    response_time_ms: responseTime,
    checks,
    errors: errors.length > 0 ? errors : undefined,
    system: {
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external,
      },
      cpu_usage: process.cpuUsage(),
    }
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                    overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(healthData, { status: statusCode });
}