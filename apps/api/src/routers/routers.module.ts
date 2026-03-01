import { Module } from '@nestjs/common';
import { DatabaseModule } from '../db/db.module';
import { RoutersController } from './routers.controller';
import { RoutersService } from './routers.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RoutersController],
  providers: [RoutersService],
})
export class RoutersModule {}
