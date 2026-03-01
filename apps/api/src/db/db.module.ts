import { Module } from '@nestjs/common';
import { createDatabase, type DatabaseConnection } from './db';

export const DATABASE_CONNECTION = Symbol('DATABASE_CONNECTION');
export type DatabaseProvider = DatabaseConnection;

@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: () => createDatabase(),
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DatabaseModule {}
