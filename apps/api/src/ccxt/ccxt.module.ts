import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CcxtService } from './ccxt.service';

@Module({
  imports: [PrismaModule],
  providers: [CcxtService],
  exports: [CcxtService],
})
export class CcxtModule {}
