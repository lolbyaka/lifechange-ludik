import { useState, useEffect } from 'react';
import type {
  TradeBot,
  CreateTradeBotInput,
  BotDirection,
  BotStrategy,
} from '../types/bot';
import { BOT_STRATEGIES, BOT_DIRECTIONS } from '../types/bot';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface BotFormProps {
  bot: TradeBot | null;
  exchangeId: string;
  exchangeOptions: { id: string; name: string | null; type: string }[];
  onSubmit: (data: CreateTradeBotInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function BotForm({
  bot,
  exchangeId: initialExchangeId,
  exchangeOptions,
  onSubmit,
  onCancel,
  isLoading = false,
}: BotFormProps) {
  const [exchangeId, setExchangeId] = useState(initialExchangeId);
  const [strategy, setStrategy] = useState<BotStrategy>('Momentum');
  const [direction, setDirection] = useState<BotDirection>('BOTH');
  const [ticker, setTicker] = useState('');
  const [amount, setAmount] = useState('');

  const isEdit = !!bot;

  useEffect(() => {
    if (bot) {
      setExchangeId(bot.exchangeId);
      setStrategy(bot.strategy as BotStrategy);
      setDirection(bot.direction);
      setTicker(bot.ticker);
      setAmount(bot.amount);
    } else {
      setExchangeId(initialExchangeId);
    }
  }, [bot, initialExchangeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      exchangeId,
      strategy,
      direction,
      ticker: ticker.trim(),
      amount: amount.trim(),
    });
  };

  const pending = isLoading;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm"
    >
      <h3 className="font-medium">
        {isEdit ? 'Edit bot' : 'Add bot'}
      </h3>

      {!isEdit && (
        <div>
          <label htmlFor="bot-exchange" className="block text-sm font-medium text-foreground">
            Exchange
          </label>
          <select
            id="bot-exchange"
            value={exchangeId}
            onChange={(e) => setExchangeId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select exchange</option>
            {exchangeOptions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name ?? ex.type}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="bot-strategy" className="block text-sm font-medium text-foreground">
          Strategy
        </label>
        <select
          id="bot-strategy"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as BotStrategy)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {BOT_STRATEGIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bot-direction" className="block text-sm font-medium text-foreground">
          Direction
        </label>
        <select
          id="bot-direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value as BotDirection)}
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {BOT_DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bot-ticker" className="block text-sm font-medium text-foreground">
          Ticker
        </label>
        <Input
          id="bot-ticker"
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          required
          placeholder="e.g. BTC/USDT:US"
        />
      </div>

      <div>
        <label htmlFor="bot-amount" className="block text-sm font-medium text-foreground">
          Amount (USD)
        </label>
        <Input
          id="bot-amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="e.g. 100"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </Button>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
