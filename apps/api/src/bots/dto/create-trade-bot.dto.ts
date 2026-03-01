import { TradeBotDirection } from '@prisma/client';

export class CreateTradeBotDto {
  exchangeId: string;
  strategy: string; // e.g. DIY, Momentum
  direction: TradeBotDirection;
  ticker: string;
  amount: string; // USD amount allowed to trade
}
