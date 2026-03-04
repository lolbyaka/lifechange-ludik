import { Global, Module } from '@nestjs/common';
import { ExchangeEventsService } from './exchange-events.service';
import { RedisModule } from '../redis/redis.module';

@Global()
@Module({
  imports: [RedisModule],
  providers: [ExchangeEventsService],
  exports: [ExchangeEventsService],
})
export class ExchangeEventsModule {}

