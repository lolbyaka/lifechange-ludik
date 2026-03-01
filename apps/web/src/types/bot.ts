export const BOT_STRATEGIES = ['DIY', 'Momentum'] as const;
export type BotStrategy = (typeof BOT_STRATEGIES)[number];

export const BOT_DIRECTIONS = ['LONG', 'SHORT', 'BOTH'] as const;
export type BotDirection = (typeof BOT_DIRECTIONS)[number];

export interface TradeBotExchangeRef {
  id: string;
  name: string | null;
  type: string;
}

export interface TradeBot {
  id: string;
  exchangeId: string;
  strategy: string;
  direction: BotDirection;
  ticker: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
  exchange?: TradeBotExchangeRef;
  positions?: Position[];
}

export type PositionStatus = 'OPEN' | 'CLOSED';

export interface Position {
  id: string;
  botId: string;
  signalId: string | null;
  exchangeId: string;
  symbol: string;
  side: string;
  quantity: string;
  entryPrice: string;
  status: PositionStatus;
  externalOrderId: string | null;
  tpOrderId: string | null;
  slOrderId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTradeBotInput {
  exchangeId: string;
  strategy: string;
  direction: BotDirection;
  ticker: string;
  amount: string;
}

export interface UpdateTradeBotInput {
  strategy?: string;
  direction?: BotDirection;
  ticker?: string;
  amount?: string;
}
