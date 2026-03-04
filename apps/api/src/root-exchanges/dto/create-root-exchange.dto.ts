import { ExchangeType } from '@prisma/client';

export class CreateRootExchangeDto {
  name?: string;
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  walletAddress?: string;
  type: ExchangeType;
}

