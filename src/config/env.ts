import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  SUPABASE_URL: z.string().default('https://your-project-id.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('your-supabase-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('your-supabase-service-role-key'),
  GEMINI_API_KEY: z.string().default('your-gemini-api-key'),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

export const isSupabaseConfigured = () => {
  return (
    env.SUPABASE_URL.startsWith('https://') &&
    !env.SUPABASE_URL.includes('your-project-id') &&
    env.SUPABASE_ANON_KEY !== 'your-supabase-anon-key'
  );
};

export const isGeminiConfigured = () => {
  return env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your-gemini-api-key';
};
