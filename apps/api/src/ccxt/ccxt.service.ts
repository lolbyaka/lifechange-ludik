import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExchangeType } from '@prisma/client';

// CCXT types (minimal for our usage)
type CcxtExchange = {
  fetchBalance(params?: object): Promise<Record<string, unknown>>;
  fetchPositions(symbols?: string[], params?: object): Promise<unknown[]>;
  fetchTicker(symbol: string, params?: object): Promise<unknown>;
  fetchTickers(symbols?: string[], params?: object): Promise<Record<string, unknown>>;
  fetchMarkets(params?: object): Promise<unknown[]>;
  fetchOpenOrders(symbol?: string, since?: number, limit?: number, params?: object): Promise<unknown[]>;
  fetchClosedOrders(symbol?: string, since?: number, limit?: number, params?: object): Promise<unknown[]>;
  createOrder(
    symbol: string,
    type: string,
    side: string,
    amount: number,
    price?: number,
    params?: object,
  ): Promise<unknown>;
  cancelOrder(id: string, symbol?: string, params?: object): Promise<unknown>;
  close(): Promise<void>;
};

/** Maps our Prisma ExchangeType to CCXT exchange id (they match for supported exchanges). */
const EXCHANGE_TYPE_TO_CCXT_ID: Record<ExchangeType, string> = {
  [ExchangeType.binance]: 'binance',
  [ExchangeType.bybit]: 'bybit',
  [ExchangeType.okx]: 'okx',
  [ExchangeType.backpack]: 'backpack',
  [ExchangeType.kraken]: 'kraken',
  [ExchangeType.hyperliquid]: 'hyperliquid',
  [ExchangeType.aster]: 'aster',
};

@Injectable()
export class CcxtService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns a configured CCXT exchange instance for the given exchange id (our DB id).
   * Caller is responsible for calling `exchange.close()` when done if needed (e.g. for WS).
   * For one-off REST calls we create and close inside each method.
   */
  async getClient(exchangeId: string): Promise<CcxtExchange> {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id: exchangeId },
    });
    if (!exchange) {
      throw new NotFoundException(`Exchange with id "${exchangeId}" not found`);
    }

    const ccxtId = EXCHANGE_TYPE_TO_CCXT_ID[exchange.type];
    if (!ccxtId) {
      throw new BadRequestException(`Exchange type "${exchange.type}" is not supported by CCXT`);
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const ccxt = require('ccxt');
    const ExchangeClass = ccxt[ccxtId];
    if (!ExchangeClass) {
      throw new BadRequestException(`CCXT does not have an exchange implementation for "${ccxtId}"`);
    }

    // Hyperliquid (and similar DEXs) require walletAddress = your EVM public address (0x...)
    if (exchange.type === ExchangeType.hyperliquid && !exchange.walletAddress?.trim()) {
      throw new BadRequestException(
        'Hyperliquid requires a Wallet address (your EVM public address, e.g. 0x…). Edit this exchange and set the Wallet address field.',
      );
    }

    const options: Record<string, unknown> = {
      apiKey: exchange.apiKey,
      secret: exchange.secretKey,
      password: exchange.passphrase ?? undefined,
      enableRateLimit: true,
    };
    if (exchange.walletAddress?.trim()) {
      options.walletAddress = exchange.walletAddress.trim();
    }
    const client = new ExchangeClass(options) as CcxtExchange;

    return client;
  }

  /**
   * Runs an operation with a short-lived CCXT client. Ensures client is not kept in memory.
   */
  private async withClient<T>(
    exchangeId: string,
    fn: (client: CcxtExchange) => Promise<T>,
  ): Promise<T> {
    const client = await this.getClient(exchangeId);
    try {
      return await fn(client);
    } finally {
      if (typeof client.close === 'function') {
        await client.close().catch(() => {});
      }
    }
  }

  async fetchBalance(exchangeId: string, params?: object): Promise<Record<string, unknown>> {
    return this.withClient(exchangeId, (client) => client.fetchBalance(params));
  }

  async fetchPositions(
    exchangeId: string,
    symbols?: string[],
    params?: object,
  ): Promise<unknown[]> {
    return this.withClient(exchangeId, (client) =>
      client.fetchPositions(symbols, params),
    );
  }

  async fetchTicker(
    exchangeId: string,
    symbol: string,
    params?: object,
  ): Promise<unknown> {
    return this.withClient(exchangeId, (client) =>
      client.fetchTicker(symbol, params),
    );
  }

  async fetchTickers(
    exchangeId: string,
    symbols?: string[],
    params?: object,
  ): Promise<Record<string, unknown>> {
    return this.withClient(exchangeId, (client) =>
      client.fetchTickers(symbols, params),
    );
  }

  async fetchMarkets(exchangeId: string, params?: object): Promise<unknown[]> {
    return this.withClient(exchangeId, (client) => client.fetchMarkets(params));
  }

  async fetchOpenOrders(
    exchangeId: string,
    symbol?: string,
    since?: number,
    limit?: number,
    params?: object,
  ): Promise<unknown[]> {
    return this.withClient(exchangeId, (client) =>
      client.fetchOpenOrders(symbol, since, limit, params),
    );
  }

  async fetchClosedOrders(
    exchangeId: string,
    symbol?: string,
    since?: number,
    limit?: number,
    params?: object,
  ): Promise<unknown[]> {
    return this.withClient(exchangeId, (client) =>
      client.fetchClosedOrders(symbol, since, limit, params),
    );
  }

  async createOrder(
    exchangeId: string,
    symbol: string,
    type: string,
    side: string,
    amount: number,
    price?: number,
    params?: object,
  ): Promise<unknown> {
    return this.withClient(exchangeId, (client) =>
      client.createOrder(symbol, type, side, amount, price, params),
    );
  }

  async cancelOrder(
    exchangeId: string,
    orderId: string,
    symbol?: string,
    params?: object,
  ): Promise<unknown> {
    return this.withClient(exchangeId, (client) =>
      client.cancelOrder(orderId, symbol, params),
    );
  }
}
