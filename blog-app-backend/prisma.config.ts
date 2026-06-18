/// <reference types="node" />

import 'dotenv/config';
console.log('DATABASE_URL =', process.env.DATABASE_URL);
export default {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'ts-node prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
};
