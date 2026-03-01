import { useState, useEffect } from 'react';
import type {
  TradeBot,
  CreateTradeBotInput,
  BotDirection,
  BotStrategy,
} from '../types/bot';
import { BOT_STRATEGIES, BOT_DIRECTIONS } from '../types/bot';

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
      className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4 space-y-4"
    >
      <h3 className="font-medium text-slate-200">
        {isEdit ? 'Edit bot' : 'Add bot'}
      </h3>

      {!isEdit && (
        <div>
          <label htmlFor="bot-exchange" className="block text-sm font-medium text-slate-400">
            Exchange
          </label>
          <select
            id="bot-exchange"
            value={exchangeId}
            onChange={(e) => setExchangeId(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
        <label htmlFor="bot-strategy" className="block text-sm font-medium text-slate-400">
          Strategy
        </label>
        <select
          id="bot-strategy"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as BotStrategy)}
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {BOT_STRATEGIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bot-direction" className="block text-sm font-medium text-slate-400">
          Direction
        </label>
        <select
          id="bot-direction"
          value={direction}
          onChange={(e) => setDirection(e.target.value as BotDirection)}
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          {BOT_DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="bot-ticker" className="block text-sm font-medium text-slate-400">
          Ticker
        </label>
        <input
          id="bot-ticker"
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          required
          placeholder="e.g. BTC/USDT:US"
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div>
        <label htmlFor="bot-amount" className="block text-sm font-medium text-slate-400">
          Amount (USD)
        </label>
        <input
          id="bot-amount"
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          placeholder="e.g. 100"
          className="mt-1 block w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          {pending ? 'Saving…' : isEdit ? 'Update' : 'Add'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
