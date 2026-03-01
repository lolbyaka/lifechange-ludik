export interface Webhook {
  id: string;
  payload: string;
  symbol: string | null;
  strategy: string | null;
  direction: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WebhookPayload = Record<string, unknown>;
