import {
  boolean,
  integer as pgInteger,
  pgTable,
  serial,
  text as pgText,
  timestamp,
} from 'drizzle-orm/pg-core';
import {
  integer as sqliteInteger,
  sqliteTable,
  text as sqliteText,
} from 'drizzle-orm/sqlite-core';

export const pgRouters = pgTable('routers', {
  id: serial('id').primaryKey(),
  name: pgText('name').notNull(),
  model: pgText('model').notNull(),
  driver: pgText('driver').notNull(),
  host: pgText('host').notNull(),
  username: pgText('username'),
  isOnline: boolean('is_online').notNull().default(false),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const pgRouterCredentials = pgTable('router_credentials', {
  id: serial('id').primaryKey(),
  routerId: pgInteger('router_id').notNull(),
  encryptedUsername: pgText('encrypted_username').notNull(),
  encryptedPassword: pgText('encrypted_password').notNull(),
  usernameIv: pgText('username_iv').notNull(),
  usernameAuthTag: pgText('username_auth_tag').notNull(),
  passwordIv: pgText('password_iv').notNull(),
  passwordAuthTag: pgText('password_auth_tag').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sqliteRouters = sqliteTable('routers', {
  id: sqliteInteger('id').primaryKey({ autoIncrement: true }),
  name: sqliteText('name').notNull(),
  model: sqliteText('model').notNull(),
  driver: sqliteText('driver').notNull(),
  host: sqliteText('host').notNull(),
  username: sqliteText('username'),
  isOnline: sqliteInteger('is_online', { mode: 'boolean' })
    .notNull()
    .default(false),
  lastSeenAt: sqliteText('last_seen_at'),
  createdAt: sqliteText('created_at').notNull(),
});

export const sqliteRouterCredentials = sqliteTable('router_credentials', {
  id: sqliteInteger('id').primaryKey({ autoIncrement: true }),
  routerId: sqliteInteger('router_id').notNull(),
  encryptedUsername: sqliteText('encrypted_username').notNull(),
  encryptedPassword: sqliteText('encrypted_password').notNull(),
  usernameIv: sqliteText('username_iv').notNull(),
  usernameAuthTag: sqliteText('username_auth_tag').notNull(),
  passwordIv: sqliteText('password_iv').notNull(),
  passwordAuthTag: sqliteText('password_auth_tag').notNull(),
  createdAt: sqliteText('created_at').notNull(),
});

export const pgSchema = {
  routers: pgRouters,
  routerCredentials: pgRouterCredentials,
};

export const sqliteSchema = {
  routers: sqliteRouters,
  routerCredentials: sqliteRouterCredentials,
};

export type RouterRecord = typeof pgRouters.$inferSelect;
