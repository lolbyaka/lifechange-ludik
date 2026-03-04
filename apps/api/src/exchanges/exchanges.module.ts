import { Module } from '@nestjs/common';
import { CcxtModule } from '../ccxt/ccxt.module';
import { ExchangesService } from './exchanges.service';
import { ExchangesController } from './exchanges.controller';
import { ExchangeEventsModule } from '../exchange-events/exchange-events.module';

@Module({
  imports: [CcxtModule, ExchangeEventsModule],
  controllers: [ExchangesController],
  providers: [ExchangesService],
  exports: [ExchangesService],
})
export class ExchangesModule {}
