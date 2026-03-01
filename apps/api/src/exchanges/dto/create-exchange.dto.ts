import { ExchangeType } from '@prisma/client';

export class CreateExchangeDto {
  name?: string; // optional; defaults to type when not provided
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  walletAddress?: string; // required for e.g. Hyperliquid (EVM address)
  type: ExchangeType;
}
