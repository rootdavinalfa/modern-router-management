import { Inject, Injectable, NotFoundException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  routerCreateSchema,
  type RouterCreateDTO,
  type RouterStatusDTO,
  type RouterSummaryDTO,
  type WifiConfigDTO,
  type DeviceDTO,
} from '@modern-router-management/types/router';
import { ZteF6600pDriver } from '@modern-router-management/drivers';
import { DATABASE_CONNECTION, type DatabaseProvider } from '../db/db.module';
import { pgSchema, sqliteSchema } from '../db/schema';
import { decryptSecret, encryptSecret } from '../crypto/credentials';

interface CachedDriver {
  driver: ZteF6600pDriver;
  host: string;
  username: string;
}

@Injectable()
export class RoutersService implements OnModuleInit, OnModuleDestroy {
  private readonly driverCache = new Map<number, CachedDriver>();

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly connection: DatabaseProvider,
  ) {}

  private get schema() {
    return this.connection.engine === 'sqlite' ? sqliteSchema : pgSchema;
  }

  private get db() {
    return this.connection.db as any;
  }

  async onModuleInit() {
    await this.initializeDrivers();
  }

  async onModuleDestroy() {
    // Close all cached drivers
    for (const [routerId, cached] of this.driverCache.entries()) {
      try {
        await cached.driver.close();
        console.log(`[RoutersService] Closed driver for router ${routerId}`);
      } catch (error) {
        console.error(`[RoutersService] Error closing driver for router ${routerId}:`, error);
      }
    }
    this.driverCache.clear();
  }

  private async initializeDrivers(): Promise<void> {
    const routers = await this.db.select().from(this.schema.routers);
    
    for (const router of routers) {
      try {
        const [credentials] = await this.db
          .select()
          .from(this.schema.routerCredentials)
          .where(eq(this.schema.routerCredentials.routerId, router.id))
          .orderBy(desc(this.schema.routerCredentials.createdAt))
          .limit(1);

        if (!credentials) {
          console.warn(`[RoutersService] No credentials found for router ${router.id}`);
          continue;
        }

        const username = decryptSecret({
          encrypted: credentials.encryptedUsername,
          iv: credentials.usernameIv,
          authTag: credentials.usernameAuthTag,
        });
        const password = decryptSecret({
          encrypted: credentials.encryptedPassword,
          iv: credentials.passwordIv,
          authTag: credentials.passwordAuthTag,
        });

        const driver = new ZteF6600pDriver({
          host: router.host,
          username,
          password,
        });

        this.driverCache.set(router.id, {
          driver,
          host: router.host,
          username,
        });

        console.log(`[RoutersService] Initialized driver for router ${router.id} (${router.host})`);
      } catch (error) {
        console.error(`[RoutersService] Failed to initialize driver for router ${router.id}:`, error);
      }
    }
  }

  async listRouters(): Promise<RouterSummaryDTO[]> {
    const routers = await this.db.select().from(this.schema.routers);
    return routers.map((router: any) => ({
      id: router.id,
      name: router.name,
      host: router.host,
      driver: router.driver,
      createdAt:
        router.createdAt instanceof Date
          ? router.createdAt.toISOString()
          : String(router.createdAt),
    }));
  }

  async getActiveRouter(): Promise<RouterSummaryDTO | null> {
    const [router] = await this.db
      .select()
      .from(this.schema.routers)
      .orderBy(desc(this.schema.routers.createdAt))
      .limit(1);

    if (!router) {
      return null;
    }

    return {
      id: router.id,
      name: router.name,
      host: router.host,
      driver: router.driver,
      createdAt:
        router.createdAt instanceof Date
          ? router.createdAt.toISOString()
          : String(router.createdAt),
    };
  }

  async createRouter(input: RouterCreateDTO): Promise<RouterSummaryDTO> {
    const payload = routerCreateSchema.parse(input);
    const now = new Date().toISOString();

    await this.db.insert(this.schema.routers).values({
      name: payload.name,
      model: 'ZTE F6600P',
      driver: payload.driver,
      host: payload.host,
      username: null,
      isOnline: false,
      lastSeenAt: null,
      ...(this.connection.engine === 'sqlite' ? { createdAt: now } : {}),
    });

    const [router] = await this.db
      .select()
      .from(this.schema.routers)
      .where(eq(this.schema.routers.host, payload.host))
      .orderBy(desc(this.schema.routers.createdAt))
      .limit(1);

    if (!router) {
      throw new NotFoundException('Router record not found after insert');
    }

    const encryptedUsername = encryptSecret(payload.username);
    const encryptedPassword = encryptSecret(payload.password);

    await this.db.insert(this.schema.routerCredentials).values({
      routerId: router.id,
      encryptedUsername: encryptedUsername.encrypted,
      encryptedPassword: encryptedPassword.encrypted,
      usernameIv: encryptedUsername.iv,
      usernameAuthTag: encryptedUsername.authTag,
      passwordIv: encryptedPassword.iv,
      passwordAuthTag: encryptedPassword.authTag,
      ...(this.connection.engine === 'sqlite' ? { createdAt: now } : {}),
    });

    // Initialize and cache the driver for the new router
    const driver = new ZteF6600pDriver({
      host: router.host,
      username: payload.username,
      password: payload.password,
    });

    this.driverCache.set(router.id, {
      driver,
      host: router.host,
      username: payload.username,
    });

    console.log(`[RoutersService] Initialized driver for new router ${router.id} (${router.host})`);

    return {
      id: router.id,
      name: router.name,
      host: router.host,
      driver: router.driver,
      createdAt:
        router.createdAt instanceof Date
          ? router.createdAt.toISOString()
          : String(router.createdAt ?? now),
    };
  }

  async getRouterStatus(routerId: number): Promise<RouterStatusDTO> {
    return this.withDriver(routerId, (driver) => driver.getSystemStatus());
  }

  async getConnectedDevices(routerId: number): Promise<DeviceDTO[]> {
    return this.withDriver(routerId, (driver) => driver.getConnectedDevices());
  }

  async updateWifi(routerId: number, config: WifiConfigDTO): Promise<void> {
    await this.withDriver(routerId, (driver) =>
      driver.updateWifiSettings(config),
    );
  }

  async reboot(routerId: number): Promise<void> {
    await this.withDriver(routerId, (driver) => driver.reboot());
  }

  private async withDriver<T>(
    routerId: number,
    handler: (driver: ZteF6600pDriver) => Promise<T>,
  ): Promise<T> {
    const cached = this.driverCache.get(routerId);
    
    if (!cached) {
      // If driver not in cache, try to load it from database
      const [router] = await this.db
        .select()
        .from(this.schema.routers)
        .where(eq(this.schema.routers.id, routerId))
        .limit(1);

      if (!router) {
        throw new NotFoundException('Router not found');
      }

      const [credentials] = await this.db
        .select()
        .from(this.schema.routerCredentials)
        .where(eq(this.schema.routerCredentials.routerId, routerId))
        .orderBy(desc(this.schema.routerCredentials.createdAt))
        .limit(1);

      if (!credentials) {
        throw new NotFoundException('Router credentials not found');
      }

      const username = decryptSecret({
        encrypted: credentials.encryptedUsername,
        iv: credentials.usernameIv,
        authTag: credentials.usernameAuthTag,
      });
      const password = decryptSecret({
        encrypted: credentials.encryptedPassword,
        iv: credentials.passwordIv,
        authTag: credentials.passwordAuthTag,
      });

      const driver = new ZteF6600pDriver({
        host: router.host,
        username,
        password,
      });

      this.driverCache.set(routerId, {
        driver,
        host: router.host,
        username,
      });

      try {
        return await handler(driver);
      } finally {
        await driver.close();
      }
    }

    // Use cached driver
    return await handler(cached.driver);
  }
}
