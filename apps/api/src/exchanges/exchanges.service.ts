import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CcxtService } from '../ccxt/ccxt.service';
import { CreateExchangeDto } from './dto/create-exchange.dto';
import { UpdateExchangeDto } from './dto/update-exchange.dto';
import { Exchange } from '@prisma/client';

@Injectable()
export class ExchangesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ccxt: CcxtService,
  ) {}

  async create(dto: CreateExchangeDto): Promise<Exchange> {
    return this.prisma.exchange.create({
      data: {
        name: dto.name ?? dto.type,
        apiKey: dto.apiKey,
        secretKey: dto.secretKey,
        passphrase: dto.passphrase,
        walletAddress: dto.walletAddress,
        type: dto.type,
      },
    });
  }

  async findAll(): Promise<Exchange[]> {
    return this.prisma.exchange.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Exchange> {
    const exchange = await this.prisma.exchange.findUnique({
      where: { id },
    });
    if (!exchange) {
      throw new NotFoundException(`Exchange with id "${id}" not found`);
    }
    return exchange;
  }

  async update(id: string, dto: UpdateExchangeDto): Promise<Exchange> {
    await this.findOne(id);
    const updated = await this.prisma.exchange.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.apiKey !== undefined && { apiKey: dto.apiKey }),
        ...(dto.secretKey !== undefined && { secretKey: dto.secretKey }),
        ...(dto.passphrase !== undefined && { passphrase: dto.passphrase }),
        ...(dto.walletAddress !== undefined && { walletAddress: dto.walletAddress }),
        ...(dto.type !== undefined && { type: dto.type }),
      },
    });
    this.ccxt.invalidate(id);
    return updated;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    await this.findOne(id);
    await this.prisma.exchange.delete({
      where: { id },
    });
    this.ccxt.invalidate(id);
    return { deleted: true };
  }
}
