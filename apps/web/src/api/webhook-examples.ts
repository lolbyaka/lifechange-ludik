import type { WebhookPayload } from '../types/webhook';

/** Predefined DIY strategy example for testing webhook endpoint */
export const WEBHOOK_EXAMPLE_DIY: WebhookPayload = {
  symbol: 'ETH',
  direction: 'LONG',
  positionSize: '0.03',
  leverageSize: '20',
  tpROI: '5',
  slROI: '50',
  strategy: 'DIY',
};

/** Predefined Momentum strategy example for testing webhook endpoint */
export const WEBHOOK_EXAMPLE_MOMENTUM: WebhookPayload = {
  symbol: 'ETH',
  direction: 'LONG',
  positionSize: '0.026',
  leverageSize: '25',
  tv_price: '{{close}}',
  name: 'main',
  tpROI: '10',
  slROI: '35',
  longMALine: '{{plot("Long MA Line")}}',
  crossMASignalDown: '{{plot("Cross MA Signal Down")}}',
  crossMASignalUp: '{{plot("Cross MA Signal Up")}}',
  momentumLine: '{{plot("Momentum Line")}}',
  MALine: '{{plot("MA Line")}}',
  strategy: 'Momentum',
};

export const WEBHOOK_EXAMPLES = [
  { id: 'diy', label: 'DIY', payload: WEBHOOK_EXAMPLE_DIY },
  { id: 'momentum', label: 'Momentum', payload: WEBHOOK_EXAMPLE_MOMENTUM },
] as const;
