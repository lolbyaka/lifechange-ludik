import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ExchangeType } from '@prisma/client';
import {
  ExchangeClient,
  ExchangeMarket,
} from './exchange-client';
import { createCcxtExchangeClient } from './ccxt-exchange.client';

@Injectable()
export class ExchangeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExchangeService.name);
  private client: ExchangeClient | null = null;
  private rootExchangeId: string | null = null;
  private rootExchangeType: ExchangeType | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    const exchangeCode = process.env.EXCHANGE_CODE as ExchangeType | undefined;

    if (!exchangeCode) {
      this.logger.error('EXCHANGE_CODE env var is required for exchange service');
      return;
    }

    this.logger.log(
      `Exchange service starting for exchange type: ${exchangeCode}`,
    );

    try {
      const rootExchange = await this.prisma.rootExchange.findFirst({
        where: { type: exchangeCode },
      });

      if (!rootExchange) {
        this.logger.error(`RootExchange not found for code: ${exchangeCode}`);
        await this.publishHealth('disconnected', 'ROOT_EXCHANGE_NOT_FOUND');
        return;
      }

      this.rootExchangeId = rootExchange.id;
      this.rootExchangeType = rootExchange.type;

      this.client = await createCcxtExchangeClient(rootExchange);
      await this.client.connect();

      await this.publishHealth('connected');

      this.logger.log(`Connected to exchange ${rootExchange.type} (${rootExchange.id})`);

      // Initial markets load on startup
      await this.reloadMarkets();

      // Listen for external requests to refresh markets for this exchange type
      const sub = this.redis.getSubscriber();
      await sub.subscribe('refresh.exchange.markets');
      sub.on('message', (channel, message) => {
        if (channel !== 'refresh.exchange.markets') return;
        void this.handleRefreshMarketsMessage(message);
      });

      this.logger.log('Subscribed to refresh.exchange.markets channel');
    } catch (error) {
      this.logger.error('Failed to load RootExchange on startup', error as Error);
      await this.publishHealth('disconnected', 'INIT_ERROR');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.disconnect().catch(() => {});
    }
    await this.publishHealth('disconnected', 'SHUTDOWN');
  }

  private async handleRefreshMarketsMessage(message: string): Promise<void> {
    if (!this.rootExchangeType) {
      return;
    }

    try {
      const parsed = JSON.parse(message) as { type?: string };
      if (!parsed.type) {
        return;
      }

      const incomingType = String(parsed.type).toLowerCase();
      const currentType = String(this.rootExchangeType).toLowerCase();

      if (incomingType !== currentType) {
        this.logger.debug(
          `Ignoring refresh.exchange.markets for type ${parsed.type} (current: ${this.rootExchangeType})`,
        );
        return;
      }

      this.logger.log(
        `Handling refresh.exchange.markets for type ${this.rootExchangeType}`,
      );
      await this.reloadMarkets();
    } catch (err) {
      this.logger.error(
        'Failed to handle refresh.exchange.markets message',
        err as Error,
      );
    }
  }

  @Cron('0 */10 * * * *') // every 10 minutes
  async reloadMarkets(): Promise<void> {
    if (!this.client || !this.rootExchangeId || !this.rootExchangeType) {
      return;
    }

    try {
      const now = Date.now();
      const markets = await this.client.fetchMarkets();
      const duration = Date.now() - now;
      this.logger.log(`Markets reloaded in ${duration}ms`);
      this.logger.log(`Markets: ${markets.length}`);
      // this.logger.log(JSON.stringify(markets.map((m) => m.symbol), null, 2));
      await this.publishMarkets(markets);
    } catch (err) {
      this.logger.error('Failed to reload markets', err as Error);
      await this.publishHealth('disconnected', 'MARKET_REFRESH_FAILED');
    }
  }

  private async publishHealth(
    status: 'connected' | 'disconnected',
    reason?: string,
  ): Promise<void> {
    if (!this.rootExchangeId || !this.rootExchangeType) return;
    const payload = JSON.stringify({
      v: 1,
      exchangeId: this.rootExchangeId,
      type: this.rootExchangeType,
      status,
      reason: reason ?? null,
      timestamp: new Date().toISOString(),
    });
    const client = this.redis.getClient();
    await client.publish('exchange.health', payload);
  }

  private async publishMarkets(markets: ExchangeMarket[]): Promise<void> {
    if (!this.rootExchangeId || !this.rootExchangeType) return;

    const compact = markets.map((m) => ({
      symbol: m.symbol,
      baseAsset: m.baseAsset,
      quoteAsset: m.quoteAsset,
      pricePrecision: m.pricePrecision,
      quantityPrecision: m.quantityPrecision,
      minOrderSize: m.minOrderSize,
      minNotional: m.minNotional,
      maxLeverage: m.maxLeverage,
      maxPositionSize: m.maxPositionSize,
      status: m.status,
    }));

    const payload = JSON.stringify({
      v: 1,
      exchangeId: this.rootExchangeId,
      type: this.rootExchangeType,
      markets: compact,
      updatedAt: new Date().toISOString(),
    });

    const client = this.redis.getClient();
    await client.publish('exchange.markets', payload);
  }
}

