import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import {
  routerCreateSchema,
  type RouterCreateDTO,
  type WifiConfigDTO,
  wifiConfigSchema,
} from '@modern-router-management/types/router';
import { RoutersService } from './routers.service';

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
}
