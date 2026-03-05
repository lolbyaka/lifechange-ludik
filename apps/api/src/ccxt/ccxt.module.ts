import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CcxtService } from './ccxt.service';
import { Logger } from '@nestjs/common';

@Module({
  imports: [PrismaModule],
  providers: [CcxtService, Logger],
  exports: [CcxtService],
})
export class CcxtModule {}
