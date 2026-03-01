/**
 * Webhook payload is flexible (e.g. DIY vs Momentum strategy).
 * We store the full payload as JSON; no strict DTO for create.
 */
export type CreateWebhookDto = Record<string, unknown>;
