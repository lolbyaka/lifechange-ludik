import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { SignalsModule } from './signals/signals.module';
import { BotsModule } from './bots/bots.module';

@Module({
  imports: [
    PrismaModule,
    ExchangesModule,
    WebhooksModule,
    SignalsModule,
    BotsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
