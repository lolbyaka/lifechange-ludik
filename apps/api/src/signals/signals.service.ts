import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Signal } from '@prisma/client';

@Injectable()
export class SignalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Signal[]> {
    return this.prisma.signal.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Signal> {
    const signal = await this.prisma.signal.findUnique({
      where: { id },
    });
    if (!signal) {
      throw new NotFoundException(`Signal with id "${id}" not found`);
    }
    return signal;
  }
}
