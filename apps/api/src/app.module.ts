import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SignalsModule } from './signals/signals.module';
import { BotsModule } from './bots/bots.module';
import { RootExchangesModule } from './root-exchanges/root-exchanges.module';
import { RedisModule } from './redis/redis.module';
import { ExchangeEventsModule } from './exchange-events/exchange-events.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ExchangeEventsModule,
    ExchangesModule,
    WebhooksModule,
    SignalsModule,
    BotsModule,
    RootExchangesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
