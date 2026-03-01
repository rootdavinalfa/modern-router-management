import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/db.module';
import { RoutersModule } from './routers/routers.module';

@Module({
  imports: [DatabaseModule, RoutersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
