import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExchangeService } from './exchange.service';

@Module({
  imports: [PrismaModule],
  providers: [ExchangeService],
})
export class ExchangeModule {}

