import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: RedisClient;
  private sub!: RedisClient;

  getClient(): RedisClient {
    if (!this.client) {
      throw new Error('Redis client is not initialized');
    }

    return this.client;
  }

  getSubscriber(): RedisClient {
    if (!this.sub) {
      throw new Error('Redis subscriber is not initialized');
    }

    return this.sub;
  }

  async onModuleInit() {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.client = new Redis(url);
    this.sub = new Redis(url);

    const onError = (err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Redis error in exchange service', err);
    };

    this.client.on('error', onError);
    this.sub.on('error', onError);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
    if (this.sub) {
      await this.sub.quit();
    }
  }
}

