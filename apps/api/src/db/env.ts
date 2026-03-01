import 'dotenv/config';
import { z } from 'zod';

const databaseEngineSchema = z.enum(['postgres', 'sqlite']);

const databaseEnvSchema = z
  .object({
    DB_ENGINE: databaseEngineSchema.default('sqlite'),
    DATABASE_URL: z.string().min(1).optional(),
    SQLITE_PATH: z.string().min(1).default('./data/dev.sqlite'),
  })
  .superRefine((env, ctx) => {
    if (env.DB_ENGINE === 'postgres' && !env.DATABASE_URL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DATABASE_URL is required when DB_ENGINE=postgres',
        path: ['DATABASE_URL'],
      });
    }
  });

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type DatabaseEngine = z.infer<typeof databaseEngineSchema>;

export const loadDatabaseEnv = (): DatabaseEnv =>
  databaseEnvSchema.parse({
    DB_ENGINE: process.env.DB_ENGINE,
    DATABASE_URL: process.env.DATABASE_URL,
    SQLITE_PATH: process.env.SQLITE_PATH,
  });
