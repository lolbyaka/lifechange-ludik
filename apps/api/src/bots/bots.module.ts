import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CcxtModule } from '../ccxt/ccxt.module';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { ExchangeBotService } from './exchange-bot.service';

@Module({
  imports: [PrismaModule, CcxtModule],
  controllers: [BotsController],
  providers: [BotsService, ExchangeBotService],
  exports: [BotsService, ExchangeBotService],
})
export class BotsModule {}
