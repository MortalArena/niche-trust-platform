import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  SOLANA_RPC_PRIMARY: z.string().url(),
  SOLANA_RPC_FALLBACK_1: z.string().url().optional(),
  SOLANA_RPC_FALLBACK_2: z.string().url().optional(),
  MEMO_SIGNER_SECRET: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  MATRIX_HOMESERVER: z.string().url().optional(),
  MATRIX_ADMIN_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  AUTH_URL: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
  SOLANA_RPC_PRIMARY: process.env.SOLANA_RPC_PRIMARY,
  SOLANA_RPC_FALLBACK_1: process.env.SOLANA_RPC_FALLBACK_1,
  SOLANA_RPC_FALLBACK_2: process.env.SOLANA_RPC_FALLBACK_2,
  MEMO_SIGNER_SECRET: process.env.MEMO_SIGNER_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  MATRIX_HOMESERVER: process.env.MATRIX_HOMESERVER,
  MATRIX_ADMIN_TOKEN: process.env.MATRIX_ADMIN_TOKEN,
  NODE_ENV: process.env.NODE_ENV,
});

const isBuild = process.env.npm_lifecycle_event === 'build';

if (!parsed.success && !isBuild) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

export const env = parsed.success
  ? parsed.data
  : {
      DATABASE_URL: process.env.DATABASE_URL ?? '',
      AUTH_SECRET: process.env.AUTH_SECRET ?? 'dev-secret-minimum-32-characters-long',
      AUTH_URL: process.env.AUTH_URL ?? 'http://localhost:3000',
      SOLANA_RPC_PRIMARY:
        process.env.SOLANA_RPC_PRIMARY ?? 'https://api.mainnet-beta.solana.com',
      NODE_ENV: 'development' as const,
    };
