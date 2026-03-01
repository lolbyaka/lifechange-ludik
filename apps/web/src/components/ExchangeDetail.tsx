import { Link, useParams } from 'react-router-dom';
import { useExchange, useExchangeBalance } from '../hooks/useExchanges';
import type { ExchangeBalance } from '../api/exchanges';

function BalanceTable({ balance }: { balance: ExchangeBalance }) {
  const total = balance.total ?? {};
  const free = balance.free ?? {};
  const used = balance.used ?? {};
  const currencies = new Set([
    ...Object.keys(total),
    ...Object.keys(free),
    ...Object.keys(used),
  ]);
  const entries = Array.from(currencies)
    .filter((c) => c !== 'info' && typeof total[c] === 'number')
    .map((currency) => ({
      currency,
      total: total[currency] ?? 0,
      free: free[currency] ?? 0,
      used: used[currency] ?? 0,
    }))
    .filter((e) => e.total > 0 || e.free > 0 || e.used > 0)
    .sort((a, b) => (b.total || 0) - (a.total || 0));

  if (entries.length === 0) {
    return (
      <p className="text-slate-500 text-sm">No balances or all zero.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-700/50 bg-slate-800/50 text-slate-400">
          <tr>
            <th className="px-4 py-3 font-medium">Currency</th>
            <th className="px-4 py-3 font-medium text-right">Total</th>
            <th className="px-4 py-3 font-medium text-right">Free</th>
            <th className="px-4 py-3 font-medium text-right">Used</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {entries.map(({ currency, total: t, free: f, used: u }) => (
            <tr key={currency} className="text-slate-200">
              <td className="px-4 py-2.5 font-medium">{currency}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{t.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-400">{f.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-slate-400">{u.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: exchange, isLoading: exchangeLoading, error: exchangeError } = useExchange(id ?? null);
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useExchangeBalance(id ?? null);

  if (exchangeLoading || !id) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-slate-400">Loading…</span>
      </div>
    );
  }

  if (exchangeError || !exchange) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load exchange: {(exchangeError as Error)?.message ?? 'Not found'}
        <div className="mt-3">
          <Link to="/" className="text-sm text-red-200 hover:underline">← Back to exchanges</Link>
        </div>
      </div>
    );
  }

  const displayName = exchange.name ?? exchange.type;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="rounded p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
          aria-label="Back to exchanges"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-lg font-medium capitalize text-slate-200">{displayName}</h2>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wider text-slate-500">Balance</h3>
          <Link
            to={`/bots?exchangeId=${encodeURIComponent(id!)}`}
            className="text-sm text-emerald-400 hover:underline"
          >
            View bots →
          </Link>
        </div>
        {balanceLoading && (
          <div className="flex items-center gap-2 py-4 text-slate-400">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-200" />
            Loading balance…
          </div>
        )}
        {balanceError && (
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-amber-300">
            Failed to load balance: {(balanceError as Error).message}
          </div>
        )}
        {balance && !balanceLoading && <BalanceTable balance={balance} />}
      </section>
    </div>
  );
}
