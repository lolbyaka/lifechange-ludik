import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ExchangeType } from '@prisma/client';

type ExchangeHealthStatus = {
  status: 'connected' | 'disconnected';
  type: ExchangeType;
  timestamp: string;
  reason: string | null;
};

type MarketsSnapshot = {
  type: ExchangeType;
  markets: Array<{
    symbol: string;
    baseAsset?: string;
    quoteAsset?: string;
    pricePrecision?: number;
    quantityPrecision?: number;
    minOrderSize?: number;
    minNotional?: number;
    maxLeverage?: number;
    maxPositionSize?: number;
    status?: string;
  }>;
  updatedAt: string;
};

@Injectable()
export class ExchangeEventsService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeEventsService.name);

  private healthByExchange = new Map<string, ExchangeHealthStatus>();
  private marketsByExchange = new Map<string, MarketsSnapshot>();

  constructor(private readonly redis: RedisService) {}

  async onModuleInit() {
    const sub = this.redis.getSubscriber();

    await sub.subscribe('exchange.health', 'exchange.markets');
    sub.on('message', (channel, message) => {
      if (channel === 'exchange.health') {
        this.handleHealth(message);
      } else if (channel === 'exchange.markets') {
        this.logger.log(`Received message on channel ${channel}: ${message}`);
        this.handleMarkets(message);
      }
    });

    this.logger.log('Subscribed to exchange.health and exchange.markets channels');
  }

  private handleHealth(message: string): void {
    try {
      const parsed = JSON.parse(message) as {
        type: ExchangeType;
        status: 'connected' | 'disconnected';
        reason?: string | null;
        timestamp: string;
      };
      this.healthByExchange.set(String(parsed.type), {
        status: parsed.status,
        type: parsed.type,
        timestamp: parsed.timestamp,
        reason: parsed.reason ?? null,
      });
    } catch (err) {
      this.logger.error('Failed to parse exchange.health message', err as Error);
    }
  }

  private handleMarkets(message: string): void {
    try {
      const parsed = JSON.parse(message) as {
        type: ExchangeType;
        markets: MarketsSnapshot['markets'];
        updatedAt: string;
      };
      this.marketsByExchange.set(String(parsed.type), {
        type: parsed.type,
        markets: parsed.markets ?? [],
        updatedAt: parsed.updatedAt,
      });
    } catch (err) {
      this.logger.error('Failed to parse exchange.markets message', err as Error);
    }
  }

  getHealth(exchangeId: string): ExchangeHealthStatus | null {
    return this.healthByExchange.get(exchangeId) ?? null;
  }

  getMarkets(exchangeId: string): MarketsSnapshot | null {
    return this.marketsByExchange.get(exchangeId) ?? null;
  }

  refreshMarkets(type: string): void {
    const publisher = this.redis.getPublisher();
    publisher.publish('refresh.exchange.markets', JSON.stringify({
      type
    }));
  }
}

