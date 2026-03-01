import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTradeBotDto } from './dto/create-trade-bot.dto';
import { UpdateTradeBotDto } from './dto/update-trade-bot.dto';
import { TradeBot } from '@prisma/client';

@Injectable()
export class BotsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTradeBotDto): Promise<TradeBot> {
    return this.prisma.tradeBot.create({
      data: {
        exchangeId: dto.exchangeId,
        strategy: dto.strategy,
        direction: dto.direction,
        ticker: dto.ticker,
        amount: dto.amount,
      },
    });
  }

  async findAll(exchangeId?: string): Promise<TradeBot[]> {
    return this.prisma.tradeBot.findMany({
      where: exchangeId ? { exchangeId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { exchange: { select: { id: true, name: true, type: true } } },
    });
  }

  async findOne(id: string): Promise<TradeBot> {
    const bot = await this.prisma.tradeBot.findUnique({
      where: { id },
      include: { exchange: true, positions: true },
    });
    if (!bot) {
      throw new NotFoundException(`TradeBot with id "${id}" not found`);
    }
    return bot;
  }

  async update(id: string, dto: UpdateTradeBotDto): Promise<TradeBot> {
    await this.findOne(id);
    return this.prisma.tradeBot.update({
      where: { id },
      data: {
        ...(dto.strategy !== undefined && { strategy: dto.strategy }),
        ...(dto.direction !== undefined && { direction: dto.direction }),
        ...(dto.ticker !== undefined && { ticker: dto.ticker }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
      },
    });
  }

  async remove(id: string): Promise<{ deleted: true }> {
    await this.findOne(id);
    await this.prisma.tradeBot.delete({
      where: { id },
    });
    return { deleted: true };
  }
}
