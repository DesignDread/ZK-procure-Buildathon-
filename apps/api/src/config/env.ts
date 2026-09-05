import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  
  JWT_SECRET: z.string().min(10),
  INTERNAL_SERVICE_JWT_SECRET: z.string().min(10),
  
  GEMINI_API_KEY: z.string().min(1),
  
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1),
  
  OPA_URL: z.string().min(1).default('http://localhost:8181'),
  
  MOCK_FIP_PRIVATE_KEY: z.string().optional().default(''),
  MOCK_FIP_PUBLIC_KEY: z.string().optional().default(''),

  BUYER_APP_URL: z.string().min(1).default('http://localhost:3000'),
  SUPPLIER_APP_URL: z.string().min(1).default('http://localhost:3002'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;

// Security audit: warn about weak/default secrets at startup
if (env.NODE_ENV === 'development') {
  const warnings: string[] = [];
  if (env.JWT_SECRET.includes('dev-') || env.JWT_SECRET.length < 32)
    warnings.push('JWT_SECRET is weak/default — use a 256-bit random key in production');
  if (env.DATABASE_URL.includes('zkprocure_dev'))
    warnings.push('DATABASE_URL uses default dev password — rotate credentials in production');
  if (env.RAZORPAY_KEY_ID.startsWith('rzp_test_'))
    warnings.push('RAZORPAY is in test mode — switch to live keys for production');
  if (env.RAZORPAY_WEBHOOK_SECRET.includes('dev-'))
    warnings.push('RAZORPAY_WEBHOOK_SECRET is default — generate a random secret in production');
  
  if (warnings.length > 0) {
    console.log('\n🔐 Security Audit (dev mode):');
    warnings.forEach(w => console.log(`   ⚠️  ${w}`));
    console.log('   ℹ️  In production, use AWS Secrets Manager or HashiCorp Vault\n');
  }
}
