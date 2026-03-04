import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { ExchangeModule } from './exchange/exchange.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, RedisModule, ExchangeModule],
})
export class AppModule {}

