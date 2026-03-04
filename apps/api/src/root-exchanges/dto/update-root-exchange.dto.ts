import { ExchangeType } from '@prisma/client';

export class UpdateRootExchangeDto {
  name?: string;
  apiKey?: string;
  secretKey?: string;
  passphrase?: string;
  walletAddress?: string;
  type?: ExchangeType;
}

