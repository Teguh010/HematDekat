import { config as loadEnv } from 'dotenv';
import { execSync } from 'node:child_process';

export default async function setupE2E(): Promise<void> {
  loadEnv({ path: '.env.test', override: true });

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set for the e2e test environment.');
  }

  execSync('npx prisma migrate reset --force', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
    },
  });

  execSync('npx prisma db seed', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: 'yes',
    },
  });
}
