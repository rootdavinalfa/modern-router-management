import { Test, TestingModule } from '@nestjs/testing';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import type { WifiStatusDTO } from '@modern-router-management/types/router';
import { RoutersController } from './routers.controller';
import { RoutersService } from './routers.service';

const wifiStatusFixture: WifiStatusDTO = {
  bands: [
    {
      band: '2.4ghz',
      enabled: true,
      ssid: 'MRM-2.4',
      channel: 6,
    },
  ],
};

describe('RoutersController', () => {
  let controller: RoutersController;
  let service: { getWifiStatus: jest.Mock; deleteRouter: jest.Mock };

  beforeEach(async () => {
    service = {
      getWifiStatus: jest.fn().mockResolvedValue(wifiStatusFixture),
      deleteRouter: jest.fn().mockResolvedValue({ ok: true }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [RoutersController],
      providers: [{ provide: RoutersService, useValue: service }],
    }).compile();

    controller = app.get<RoutersController>(RoutersController);
  });

  describe('route wiring', () => {
    const routeOf = (key: keyof RoutersController) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        RoutersController.prototype,
        key,
      ) as PropertyDescriptor;
      return {
        method: Reflect.getMetadata(METHOD_METADATA, descriptor.value),
        path: Reflect.getMetadata(PATH_METADATA, descriptor.value),
      };
    };

    it('exposes GET /routers/:id/wifi-status', () => {
      expect(routeOf('getWifiStatus')).toEqual({
        method: RequestMethod.GET,
        path: ':id/wifi-status',
      });
    });

    it('exposes DELETE /routers/:id', () => {
      expect(routeOf('deleteRouter')).toEqual({
        method: RequestMethod.DELETE,
        path: ':id',
      });
    });
  });

  describe('getWifiStatus', () => {
    it('returns the wifi status from the service', async () => {
      await expect(controller.getWifiStatus(7)).resolves.toEqual(
        wifiStatusFixture,
      );
      expect(service.getWifiStatus).toHaveBeenCalledWith(7);
    });
  });

  describe('deleteRouter', () => {
    it('returns the delete result from the service', async () => {
      await expect(controller.deleteRouter(7)).resolves.toEqual({ ok: true });
      expect(service.deleteRouter).toHaveBeenCalledWith(7);
    });
  });
});
