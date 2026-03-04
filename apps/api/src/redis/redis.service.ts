import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Redis as RedisClient } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private pub!: RedisClient;
  private sub!: RedisClient;

  getPublisher(): RedisClient {
    if (!this.pub) {
      throw new Error('Redis publisher is not initialized');
    }

    return this.pub;
  }

  getSubscriber(): RedisClient {
    if (!this.sub) {
      throw new Error('Redis subscriber is not initialized');
    }

    return this.sub;
  }

  async onModuleInit() {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
    this.pub = new Redis(url);
    this.sub = new Redis(url);

    const onError = (err: unknown) => {
      // eslint-disable-next-line no-console
      console.error('Redis error in API service', err);
    };

    this.pub.on('error', onError);
    this.sub.on('error', onError);
  }

  async onModuleDestroy() {
    if (this.pub) {
      await this.pub.quit();
    }
    if (this.sub) {
      await this.sub.quit();
    }
  }
}

