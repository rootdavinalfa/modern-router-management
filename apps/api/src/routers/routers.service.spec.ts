import { NotFoundException } from '@nestjs/common';
import type { WifiStatusDTO } from '@modern-router-management/types/router';
import { pgSchema, sqliteSchema } from '../db/schema';
import type { DatabaseProvider } from '../db/db.module';
import { RoutersService } from './routers.service';

/**
 * Minimal fake of the drizzle query-builder surface used by RoutersService:
 * db.select().from(table).where(cond).orderBy(col).limit(n) and
 * db.delete(table).where(cond), each awaited to the configured result.
 */
const makeBuilder = (value: unknown, onFrom?: (table: unknown) => void) => {
  const builder = {
    from: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    then: (onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve(value).then(onFulfilled),
  };
  builder.from = jest.fn((table: unknown) => {
    onFrom?.(table);
    return builder;
  });
  builder.where = jest.fn(() => builder);
  builder.orderBy = jest.fn(() => builder);
  builder.limit = jest.fn(() => builder);
  return builder;
};

type FakeDb = {
  select: jest.Mock;
  delete: jest.Mock;
};

const createFakeDb = (
  engine: 'sqlite' | 'postgres',
  routerRows: unknown[],
): { db: FakeDb; order: string[] } => {
  const routersTable =
    engine === 'sqlite' ? sqliteSchema.routers : pgSchema.routers;
  const credentialsTable =
    engine === 'sqlite'
      ? sqliteSchema.routerCredentials
      : pgSchema.routerCredentials;
  const order: string[] = [];

  const db: FakeDb = {
    select: jest.fn(() =>
      makeBuilder(routerRows, (table) => {
        order.push(table === routersTable ? 'select:routers' : 'select:other');
      }),
    ),
    delete: jest.fn((table: unknown) => {
      order.push(
        table === credentialsTable
          ? 'delete:credentials'
          : table === routersTable
            ? 'delete:routers'
            : 'delete:other',
      );
      return makeBuilder({});
    }),
  };

  return { db, order };
};

const makeService = (
  db: FakeDb,
  engine: 'sqlite' | 'postgres' = 'sqlite',
): RoutersService =>
  new RoutersService({
    db,
    engine,
  } as unknown as DatabaseProvider);

// Test seam: reach into the private driver cache so tests can seed it.
type CacheEntry = {
  driver: { close?: jest.Mock; getWifiStatus?: jest.Mock };
  host: string;
  username: string;
};
const cacheOf = (service: RoutersService): Map<number, CacheEntry> => {
  const serviceWithCache = service as unknown as {
    driverCache: Map<number, CacheEntry>;
  };
  return serviceWithCache.driverCache;
};

const routerRow = {
  id: 7,
  name: 'Living Room',
  model: 'ZTE F6600P',
  driver: 'zte-f6600p',
  host: '192.168.1.1',
  username: null,
  isOnline: false,
  lastSeenAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const wifiStatusFixture: WifiStatusDTO = {
  bands: [
    {
      band: '2.4ghz',
      enabled: true,
      ssid: 'MRM-2.4',
      channel: 6,
      mode: '802.11n',
      security: 'WPA2-PSK',
    },
  ],
};

describe('RoutersService', () => {
  describe('getWifiStatus', () => {
    it('returns the wifi status reported by the cached driver', async () => {
      const { db } = createFakeDb('sqlite', [routerRow]);
      const service = makeService(db);
      const driver = {
        getWifiStatus: jest.fn().mockResolvedValue(wifiStatusFixture),
      };
      cacheOf(service).set(7, {
        driver,
        host: routerRow.host,
        username: 'admin',
      });

      await expect(service.getWifiStatus(7)).resolves.toEqual(wifiStatusFixture);
      expect(driver.getWifiStatus).toHaveBeenCalledTimes(1);
      expect(db.select).not.toHaveBeenCalled();
    });
  });

  describe('deleteRouter', () => {
    it('deletes credentials, closes and drops the cached driver, then deletes the router', async () => {
      const { db, order } = createFakeDb('sqlite', [routerRow]);
      const service = makeService(db);
      const driver = {
        close: jest.fn(async () => {
          order.push('close-driver');
        }),
      };
      cacheOf(service).set(7, {
        driver,
        host: routerRow.host,
        username: 'admin',
      });
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await expect(service.deleteRouter(7)).resolves.toEqual({ ok: true });

      expect(order).toEqual([
        'select:routers',
        'delete:credentials',
        'close-driver',
        'delete:routers',
      ]);
      expect(driver.close).toHaveBeenCalledTimes(1);
      expect(cacheOf(service).has(7)).toBe(false);
      expect(db.delete).toHaveBeenCalledWith(sqliteSchema.routerCredentials);
      expect(db.delete).toHaveBeenCalledWith(sqliteSchema.routers);

      logSpy.mockRestore();
    });

    it('still deletes the router row when closing the cached driver fails', async () => {
      const { db, order } = createFakeDb('sqlite', [routerRow]);
      const service = makeService(db);
      const driver = {
        close: jest.fn().mockRejectedValue(new Error('close exploded')),
      };
      cacheOf(service).set(7, {
        driver,
        host: routerRow.host,
        username: 'admin',
      });
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.deleteRouter(7)).resolves.toEqual({ ok: true });

      expect(order).toEqual([
        'select:routers',
        'delete:credentials',
        'delete:routers',
      ]);
      expect(cacheOf(service).has(7)).toBe(false);
      expect(driver.close).toHaveBeenCalledTimes(1);

      errorSpy.mockRestore();
    });

    it('throws NotFoundException when the router does not exist', async () => {
      const { db } = createFakeDb('sqlite', []);
      const service = makeService(db);

      await expect(service.deleteRouter(999)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(db.delete).not.toHaveBeenCalled();
    });

    it('deletes through the pg tables when the connection is postgres', async () => {
      const { db } = createFakeDb('postgres', [routerRow]);
      const service = makeService(db, 'postgres');

      await expect(service.deleteRouter(7)).resolves.toEqual({ ok: true });

      expect(db.delete).toHaveBeenCalledWith(pgSchema.routerCredentials);
      expect(db.delete).toHaveBeenCalledWith(pgSchema.routers);
    });
  });
});
