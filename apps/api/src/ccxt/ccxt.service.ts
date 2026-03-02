import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
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

interface CachedExchange {
  client: CcxtExchange;
  markets: unknown[];
  /** Timestamp when markets were last fetched (ms). */
  loadedAt?: number;
}

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

/** Force futures/perp market type for order and market resolution (not spot). */
const EXCHANGE_DEFAULT_TYPE_FUTURES: Partial<Record<ExchangeType, string>> = {
  [ExchangeType.binance]: 'future',
  [ExchangeType.bybit]: 'future',
  [ExchangeType.okx]: 'swap',
  [ExchangeType.backpack]: 'swap',
  [ExchangeType.kraken]: 'future',
  [ExchangeType.hyperliquid]: 'swap',
  [ExchangeType.aster]: 'swap',
};

@Injectable()
export class CcxtService implements OnModuleInit, OnModuleDestroy {
  private readonly cache = new Map<string, CachedExchange>();
  private readonly exchangeLocks = new Map<string, Promise<unknown>>();

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    const exchangesWithBots = await this.prisma.exchange.findMany({
      where: { tradeBots: { some: {} } },
      select: { id: true },
    });
    for (const { id } of exchangesWithBots) {
      try {
        await this.getOrCreateClient(id);
        await this.getCachedMarkets(id);
      } catch (err) {
        console.error(
          `[CcxtService] Preload failed for exchange ${id}:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  async onModuleDestroy(): Promise<void> {
    for (const entry of this.cache.values()) {
      if (typeof entry.client.close === 'function') {
        await entry.client.close().catch(() => {});
      }
    }
    this.cache.clear();
    this.exchangeLocks.clear();
  }

  /**
   * Remove cached client and markets for an exchange (e.g. after credentials update).
   * Next request will create a new client.
   */
  invalidate(exchangeId: string): void {
    const entry = this.cache.get(exchangeId);
    if (entry && typeof entry.client.close === 'function') {
      entry.client.close().catch(() => {});
    }
    this.cache.delete(exchangeId);
  }

  private withExchangeLock<T>(exchangeId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.exchangeLocks.get(exchangeId) ?? Promise.resolve();
    const current = prev.then(() => fn(), () => fn());
    this.exchangeLocks.set(exchangeId, current);
    return current as Promise<T>;
  }

  /**
   * Returns a configured CCXT exchange instance for the given exchange id (our DB id).
   * Caller is responsible for calling `exchange.close()` when done if needed (e.g. for WS).
   * For one-off REST calls we create and close inside each method.
   */
  async getClient(exchangeId: string): Promise<CcxtExchange> {
    return this.createClient(exchangeId);
  }

  private async createClient(exchangeId: string): Promise<CcxtExchange> {
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

    const defaultType = EXCHANGE_DEFAULT_TYPE_FUTURES[exchange.type];
    const normalizeCred = (v: string) => v.trim().replace(/\r\n|\n|\r/g, '');
    const secret = typeof exchange.secretKey === 'string' ? normalizeCred(exchange.secretKey) : exchange.secretKey;
    const options: Record<string, unknown> = {
      apiKey:
        typeof exchange.apiKey === 'string'
          ? normalizeCred(exchange.apiKey)
          : exchange.apiKey,
      secret,
      ...(exchange.passphrase ? { password: normalizeCred(String(exchange.passphrase)) } : {}),
      enableRateLimit: true,
      ...(defaultType ? { defaultType } : {}),
    };
    if (exchange.walletAddress?.trim()) {
      options.walletAddress = exchange.walletAddress.trim();
    }
    if (exchange.type === ExchangeType.hyperliquid) {
      options.privateKey = secret;
    }
    if (exchange.type === ExchangeType.backpack) {
      options.recvWindow = 60000;
      options['X-Window'] = 60000;
    }
    const client = new ExchangeClass(options) as CcxtExchange;

    return client;
  }

  private async getOrCreateClient(exchangeId: string): Promise<CcxtExchange> {
    const entry = this.cache.get(exchangeId);
    if (entry) {
      return entry.client;
    }
    const client = await this.createClient(exchangeId);
    this.cache.set(exchangeId, { client, markets: [] });
    return client;
  }

  private async getCachedMarkets(exchangeId: string, params?: object): Promise<unknown[]> {
    const entry = this.cache.get(exchangeId);
    if (!entry) {
      throw new Error('Exchange not in cache');
    }
    if (entry.markets.length > 0) {
      return entry.markets;
    }
    const markets = await entry.client.fetchMarkets(params);
    entry.markets = Array.isArray(markets) ? markets : [];
    entry.loadedAt = Date.now();
    return entry.markets;
  }

  /**
   * Runs an operation with a short-lived CCXT client. Ensures client is not kept in memory.
   * Used for exchangeIds not in the pool (e.g. no bots, or after invalidate).
   */
  private async withClient<T>(
    exchangeId: string,
    fn: (client: CcxtExchange) => Promise<T>,
  ): Promise<T> {
    const client = await this.createClient(exchangeId);
    try {
      return await fn(client);
    } finally {
      if (typeof client.close === 'function') {
        await client.close().catch(() => {});
      }
    }
  }

  private async withPooledOrOneOff<T>(
    exchangeId: string,
    fn: (client: CcxtExchange) => Promise<T>,
  ): Promise<T> {
    if (this.cache.has(exchangeId)) {
      return this.withExchangeLock(exchangeId, async () => {
        const entry = this.cache.get(exchangeId);
        if (!entry) return fn(await this.createClient(exchangeId));
        return fn(entry.client);
      });
    }
    return this.withClient(exchangeId, fn);
  }

  async fetchBalance(exchangeId: string, params?: object): Promise<Record<string, unknown>> {
    return this.withPooledOrOneOff(exchangeId, (client) => client.fetchBalance(params));
  }

  async fetchPositions(
    exchangeId: string,
    symbols?: string[],
    params?: object,
  ): Promise<unknown[]> {
    return this.withPooledOrOneOff(exchangeId, (client) =>
      client.fetchPositions(symbols, params),
    );
  }

  async fetchTicker(
    exchangeId: string,
    symbol: string,
    params?: object,
  ): Promise<unknown> {
    return this.withPooledOrOneOff(exchangeId, (client) =>
      client.fetchTicker(symbol, params),
    );
  }

  async fetchTickers(
    exchangeId: string,
    symbols?: string[],
    params?: object,
  ): Promise<Record<string, unknown>> {
    return this.withPooledOrOneOff(exchangeId, (client) =>
      client.fetchTickers(symbols, params),
    );
  }

  async fetchMarkets(exchangeId: string, params?: object): Promise<unknown[]> {
    return this.withExchangeLock(exchangeId, async () => {
      await this.getOrCreateClient(exchangeId);
      return this.getCachedMarkets(exchangeId, params);
    });
  }

  /**
   * Force-refresh markets from the exchange and update in-memory cache.
   * Use this to "load" markets (e.g. after adding an exchange or to get latest list).
   */
  async refreshMarkets(exchangeId: string, params?: object): Promise<unknown[]> {
    return this.withExchangeLock(exchangeId, async () => {
      await this.getOrCreateClient(exchangeId);
      const entry = this.cache.get(exchangeId);
      if (!entry) {
        throw new Error('Exchange not in cache');
      }
      const markets = await entry.client.fetchMarkets(params);
      entry.markets = Array.isArray(markets) ? markets : [];
      entry.loadedAt = Date.now();
      return entry.markets;
    });
  }

  /**
   * Returns markets plus when they were last loaded (for UI).
   */
  async getMarketsWithMeta(exchangeId: string): Promise<{ markets: unknown[]; loadedAt: number | null }> {
    const markets = await this.fetchMarkets(exchangeId);
    const entry = this.cache.get(exchangeId);
    return {
      markets: Array.isArray(markets) ? markets : [],
      loadedAt: entry?.loadedAt ?? null,
    };
  }

  async fetchOpenOrders(
    exchangeId: string,
    symbol?: string,
    since?: number,
    limit?: number,
    params?: object,
  ): Promise<unknown[]> {
    return this.withPooledOrOneOff(exchangeId, (client) =>
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
    return this.withPooledOrOneOff(exchangeId, (client) =>
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
    return this.withPooledOrOneOff(exchangeId, (client) =>
      client.createOrder(symbol, type, side, amount, price, params),
    );
  }

  async cancelOrder(
    exchangeId: string,
    orderId: string,
    symbol?: string,
    params?: object,
  ): Promise<unknown> {
    return this.withPooledOrOneOff(exchangeId, (client) =>
      client.cancelOrder(orderId, symbol, params),
    );
  }
}
