import { createEnv } from '@t3-oss/env-core';
import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production', 'staging'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),

    FRONTEND_URL: z.string().url(),

    JWT_ACCESS_SECRET: z
      .string()
      .min(32, 'JWT_ACCESS_SECRET must be at least 32 chars'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z
      .string()
      .min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    JWT_RESET_SECRET: z
      .string()
      .min(32, 'JWT_RESET_SECRET must be at least 32 chars'),

    CLIENT_ID: z.string().min(1),
    CLIENT_SECRET: z.string().min(1),

    GOOGLE_CALLBACK_URL: z.string().url(),

    COOKIE_DOMAIN: z.string().default(''),

    SWAGGER_ENABLED: z
      .enum(['true', 'false'])
      .default('true')
      .transform((value) => value === 'true'),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type Env = typeof env;
