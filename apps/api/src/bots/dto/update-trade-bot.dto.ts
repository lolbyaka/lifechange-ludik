import { TradeBotDirection } from '@prisma/client';

export class UpdateTradeBotDto {
  strategy?: string;
  direction?: TradeBotDirection;
  ticker?: string;
  amount?: string;
}
