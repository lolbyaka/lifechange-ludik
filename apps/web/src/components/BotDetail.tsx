import { Link, useParams } from 'react-router-dom';
import { useBot } from '../hooks/useBots';
import type { Position } from '../types/bot';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function PositionsTable({ positions }: { positions: Position[] }) {
  if (positions.length === 0) {
    return (
      <p className="text-slate-500 text-sm">No positions yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-700/50 bg-slate-800/50 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="px-4 py-3 font-medium">Side</th>
            <th className="px-4 py-3 font-medium text-right">Quantity</th>
            <th className="px-4 py-3 font-medium text-right">Entry</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Opened</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {positions.map((pos) => (
            <tr key={pos.id} className="text-slate-200">
              <td className="px-4 py-2.5 font-medium">{pos.symbol}</td>
              <td className="px-4 py-2.5">
                <span
                  className={
                    pos.side === 'LONG'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }
                >
                  {pos.side}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{pos.quantity}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{pos.entryPrice}</td>
              <td className="px-4 py-2.5">
                <span
                  className={
                    pos.status === 'OPEN'
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }
                >
                  {pos.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-slate-400">{formatDate(pos.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BotDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: bot, isLoading, error } = useBot(id ?? null);

  if (isLoading || !id) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-slate-400">Loading…</span>
      </div>
    );
  }

  if (error || !bot) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load bot: {(error as Error)?.message ?? 'Not found'}
        <div className="mt-3">
          <Link to="/bots" className="text-sm text-red-200 hover:underline">
            ← Back to bots
          </Link>
        </div>
      </div>
    );
  }

  const exchangeName = bot.exchange?.name ?? bot.exchange?.type ?? 'Exchange';
  const positions = bot.positions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/bots"
          className="rounded p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
          aria-label="Back to bots"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </Link>
        <h2 className="text-lg font-medium text-slate-200">
          {bot.strategy} · {bot.ticker} · {bot.direction}
        </h2>
      </div>

      <section className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
          Bot config
        </h3>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500">Exchange</dt>
            <dd className="font-medium text-slate-200">
              <Link
                to={`/exchanges/${bot.exchangeId}`}
                className="text-emerald-400 hover:underline"
              >
                {exchangeName}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Strategy</dt>
            <dd className="font-medium text-slate-200">{bot.strategy}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Direction</dt>
            <dd className="font-medium text-slate-200">{bot.direction}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Ticker</dt>
            <dd className="font-medium text-slate-200">{bot.ticker}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Amount (USD)</dt>
            <dd className="font-medium text-slate-200">{bot.amount}</dd>
          </div>
        </dl>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
          Positions
        </h3>
        <p className="mb-3 text-sm text-slate-400">
          Positions opened by this bot when matching signals arrive.
        </p>
        <PositionsTable positions={positions} />
      </section>
    </div>
  );
}
