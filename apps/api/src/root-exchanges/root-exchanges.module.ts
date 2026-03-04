import { Module } from '@nestjs/common';
import { RootExchangesService } from './root-exchanges.service';
import { RootExchangesController } from './root-exchanges.controller';

@Module({
  controllers: [RootExchangesController],
  providers: [RootExchangesService],
})
export class RootExchangesModule {}

