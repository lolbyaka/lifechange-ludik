import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRootExchangeDto } from './dto/create-root-exchange.dto';
import { UpdateRootExchangeDto } from './dto/update-root-exchange.dto';
import { RootExchange } from '@prisma/client';

@Injectable()
export class RootExchangesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRootExchangeDto): Promise<RootExchange> {
    return this.prisma.rootExchange.create({
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

  async findAll(): Promise<RootExchange[]> {
    return this.prisma.rootExchange.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<RootExchange> {
    const rootExchange = await this.prisma.rootExchange.findUnique({
      where: { id },
    });
    if (!rootExchange) {
      throw new NotFoundException(`Root exchange with id "${id}" not found`);
    }
    return rootExchange;
  }

  async update(id: string, dto: UpdateRootExchangeDto): Promise<RootExchange> {
    await this.findOne(id);
    return this.prisma.rootExchange.update({
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
  }

  async remove(id: string): Promise<{ deleted: true }> {
    await this.findOne(id);
    await this.prisma.rootExchange.delete({
      where: { id },
    });
    return { deleted: true };
  }
}

