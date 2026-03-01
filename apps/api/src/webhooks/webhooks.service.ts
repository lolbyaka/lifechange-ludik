import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { Webhook } from '@prisma/client';
import { extractWebhookFilters } from './utils/extract-webhook-filters';
import { webhookPayloadToSignalData } from './utils/webhook-payload-to-signal';
import { ExchangeBotService } from '../bots/exchange-bot.service';

export interface WebhookListFilters {
  symbol?: string;
  strategy?: string;
  direction?: string;
}

@Injectable()
export class WebhooksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly exchangeBotService: ExchangeBotService,
  ) {}

  private buildWhere(filters: WebhookListFilters) {
    const where: { symbol?: string; strategy?: string; direction?: string } = {};
    if (filters.symbol?.trim()) where.symbol = filters.symbol.trim();
    if (filters.strategy?.trim()) where.strategy = filters.strategy.trim();
    if (filters.direction?.trim()) where.direction = filters.direction.trim();
    return Object.keys(where).length ? where : undefined;
  }

  async create(payload: Record<string, unknown>): Promise<Webhook> {
    const payloadStr = JSON.stringify(payload);
    const { symbol, strategy, direction } = extractWebhookFilters(payload);
    const webhook = await this.prisma.webhook.create({
      data: { payload: payloadStr, symbol, strategy, direction },
    });
    // Side effect: create Signal from same payload, then try to open positions for matching bots
    const signalData = webhookPayloadToSignalData(payload);
    console.log('create', signalData);
    if (signalData) {
      try {
        const signal = await this.prisma.signal.create({
          data: {
            strategy: signalData.strategy,
            symbol: signalData.symbol,
            direction: signalData.direction,
            slROI: signalData.slROI,
            tpROI: signalData.tpROI,
            positionSize: signalData.positionSize,
            leverage: signalData.leverage,
            longMALine: signalData.longMALine,
            crossMASignalDown: signalData.crossMASignalDown,
            crossMASignalUp: signalData.crossMASignalUp,
            momentumLine: signalData.momentumLine,
            MALine: signalData.MALine,
          },
        });
        this.exchangeBotService
          .tryOpenPositionsForSignal(signal)
          .catch((err) =>
            console.error('ExchangeBot tryOpenPositionsForSignal failed:', err),
          );
      } catch (err) {
        console.error('Failed to create signal from webhook:', err);
      }
    }
    return webhook;
  }

  async findAll(filters: WebhookListFilters = {}): Promise<Webhook[]> {
    const where = this.buildWhere(filters);
    return this.prisma.webhook.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Webhook> {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
    });
    if (!webhook) {
      throw new NotFoundException(`Webhook with id "${id}" not found`);
    }
    return webhook;
  }

  async update(id: string, dto: UpdateWebhookDto): Promise<Webhook> {
    await this.findOne(id);
    const data: {
      payload?: string;
      symbol?: string | null;
      strategy?: string | null;
      direction?: string | null;
    } = {};
    if (dto.payload !== undefined) {
      data.payload = JSON.stringify(dto.payload);
      const { symbol, strategy, direction } = extractWebhookFilters(
        dto.payload as Record<string, unknown>,
      );
      data.symbol = symbol;
      data.strategy = strategy;
      data.direction = direction;
    }
    return this.prisma.webhook.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<{ deleted: true }> {
    await this.findOne(id);
    await this.prisma.webhook.delete({
      where: { id },
    });
    return { deleted: true };
  }
}
