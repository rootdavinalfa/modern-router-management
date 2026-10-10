import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import type { SchemaObject } from '@nestjs/swagger';
import {
  routerCreateSchema,
  type RouterCreateDTO,
  type WifiConfigDTO,
  wifiConfigSchema,
} from '@modern-router-management/types/router';
import { z } from 'zod';
import { RoutersService } from './routers.service';

// zod's JSON Schema is structurally compatible here but not type-identical to OpenAPI's SchemaObject
const openApiSchema = (schema: z.ZodType): SchemaObject =>
  z.toJSONSchema(schema, { target: 'openapi-3.0' }) as SchemaObject;

@ApiTags('routers')
@Controller('routers')
export class RoutersController {
  constructor(private readonly routersService: RoutersService) {}

  @Get()
  async listRouters() {
    return this.routersService.listRouters();
  }

  @Get('active')
  async getActive() {
    return this.routersService.getActiveRouter();
  }

  @Post()
  @ApiBody({ schema: openApiSchema(routerCreateSchema) })
  async createRouter(@Body() body: RouterCreateDTO) {
    const parsed = routerCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.routersService.createRouter(parsed.data);
  }

  @Get(':id/status')
  async getStatus(@Param('id', ParseIntPipe) id: number) {
    return this.routersService.getRouterStatus(id);
  }

  @Get(':id/devices')
  async getDevices(@Param('id', ParseIntPipe) id: number) {
    return this.routersService.getConnectedDevices(id);
  }

  @Post(':id/wifi')
  @ApiBody({ schema: openApiSchema(wifiConfigSchema) })
  async updateWifi(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: WifiConfigDTO,
  ) {
    const parsed = wifiConfigSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    await this.routersService.updateWifi(id, parsed.data);
    return { ok: true };
  }

  @Post(':id/reboot')
  async reboot(@Param('id', ParseIntPipe) id: number) {
    await this.routersService.reboot(id);
    return { ok: true };
  }

  @Post(':id/internet/submit')
  async submitInternet(@Param('id', ParseIntPipe) id: number) {
    await this.routersService.submitInternet(id);
    return { ok: true };
  }

  @Get(':id/system-status')
  async getSystemStatus(@Param('id', ParseIntPipe) id: number) {
    return this.routersService.getSystemStatus(id);
  }

  @Get(':id/wan-status')
  async getWANStatus(@Param('id', ParseIntPipe) id: number) {
    return this.routersService.getWANStatus(id);
  }

  @Get(':id/pon-status')
  async getPONStatus(@Param('id', ParseIntPipe) id: number) {
    return this.routersService.getPONStatus(id);
  }
}
