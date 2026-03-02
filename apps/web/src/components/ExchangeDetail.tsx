import { Link, useParams } from 'react-router-dom';
import {
  useExchange,
  useExchangeBalance,
  useExchangeMarkets,
  useExchangeTickers,
  useLoadMarkets,
} from '../hooks/useExchanges';
import type {
  ExchangeBalance,
  ExchangeMarketsResponse,
  CcxtMarket,
  CcxtTicker,
} from '../api/exchanges';

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

const SWAP_FUTURES_TYPES = ['swap', 'future', 'futures'];

function isSwapOrFutures(m: CcxtMarket): boolean {
  const t = (m.type ?? '').toString().toLowerCase();
  return SWAP_FUTURES_TYPES.some((type) => t === type);
}

function MarketsTable({ data }: { data: ExchangeMarketsResponse }) {
  const { markets, loadedAt } = data;
  const all = (markets || []) as CcxtMarket[];
  const rows = all.filter(isSwapOrFutures);
  if (rows.length === 0) {
    return (
      <p className="text-slate-500 text-sm">
        No markets loaded. Use &quot;Load markets&quot; to fetch from the exchange.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {loadedAt != null && (
        <p className="text-slate-500 text-xs">
          Last updated: {new Date(loadedAt).toLocaleString()}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-700/50 max-h-80 overflow-y-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 border-b border-slate-700/50 bg-slate-800/50 text-slate-400">
            <tr>
              <th className="px-4 py-2 font-medium">Symbol</th>
              <th className="px-4 py-2 font-medium">Base</th>
              <th className="px-4 py-2 font-medium">Quote</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {rows.map((m) => (
              <tr key={m.id ?? m.symbol ?? String(m)} className="text-slate-200">
                <td className="px-4 py-2 font-mono text-xs">{m.symbol ?? '—'}</td>
                <td className="px-4 py-2">{m.base ?? '—'}</td>
                <td className="px-4 py-2">{m.quote ?? '—'}</td>
                <td className="px-4 py-2">{m.type ?? '—'}</td>
                <td className="px-4 py-2">{m.active == null ? '—' : m.active ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TickersTable({
  tickers,
  swapFuturesSymbols,
}: {
  tickers: Record<string, CcxtTicker>;
  swapFuturesSymbols: Set<string>;
}) {
  const entries = Object.entries(tickers || {}).filter(
    ([k, v]) =>
      k !== 'info' &&
      v != null &&
      typeof v === 'object' &&
      (swapFuturesSymbols.size === 0 || swapFuturesSymbols.has(k))
  );
  if (entries.length === 0) {
    return (
      <p className="text-slate-500 text-sm">
        No ticker data. Load markets first; tickers are fetched from the exchange.
      </p>
    );
  }
  const sorted = entries
    .map(([symbol, t]) => ({ symbol, ...t }))
    .sort((a, b) => (b.baseVolume ?? 0) - (a.baseVolume ?? 0))
    .slice(0, 100);
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700/50 max-h-80 overflow-y-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 border-b border-slate-700/50 bg-slate-800/50 text-slate-400">
          <tr>
            <th className="px-4 py-2 font-medium">Symbol</th>
            <th className="px-4 py-2 font-medium text-right">Last</th>
            <th className="px-4 py-2 font-medium text-right">Change %</th>
            <th className="px-4 py-2 font-medium text-right">Volume</th>
            <th className="px-4 py-2 font-medium text-right">Bid / Ask</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700/30">
          {sorted.map((t) => (
            <tr key={t.symbol ?? ''} className="text-slate-200">
              <td className="px-4 py-2 font-mono text-xs">{t.symbol ?? '—'}</td>
              <td className="px-4 py-2 text-right tabular-nums">{formatNum(t.last)}</td>
              <td className="px-4 py-2 text-right tabular-nums">
                {t.percentage != null ? (
                  <span className={t.percentage >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {t.percentage >= 0 ? '+' : ''}{t.percentage.toFixed(2)}%
                  </span>
                ) : (
                  '—'
                )}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-slate-400">
                {formatNum(t.baseVolume)}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-slate-400">
                {formatNum(t.bid)} / {formatNum(t.ask)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatNum(n: unknown): string {
  if (n == null || typeof n !== 'number') return '—';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

export function ExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: exchange, isLoading: exchangeLoading, error: exchangeError } = useExchange(id ?? null);
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useExchangeBalance(id ?? null);
  const { data: marketsData, isLoading: marketsLoading, error: marketsError } = useExchangeMarkets(id ?? null);
  const { data: tickers, isLoading: tickersLoading, error: tickersError } = useExchangeTickers(id ?? null);
  const loadMarketsMutation = useLoadMarkets();

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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => id && loadMarketsMutation.mutate(id)}
              disabled={!id || loadMarketsMutation.isPending}
              className="rounded-md border border-slate-600 bg-slate-800/80 px-2.5 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700/80 disabled:opacity-50"
            >
              {loadMarketsMutation.isPending ? 'Loading markets…' : 'Load markets'}
            </button>
            <Link
              to={`/bots?exchangeId=${encodeURIComponent(id!)}`}
              className="text-sm text-emerald-400 hover:underline"
            >
              View bots →
            </Link>
          </div>
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
        {loadMarketsMutation.isError && (
          <p className="mt-2 text-sm text-amber-400">
            Load markets failed: {(loadMarketsMutation.error as Error).message}
          </p>
        )}
        {loadMarketsMutation.isSuccess && (
          <p className="mt-2 text-sm text-emerald-400">
            Markets loaded ({Array.isArray(loadMarketsMutation.data) ? loadMarketsMutation.data.length : 0} markets).
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
          Markets
        </h3>
        {marketsLoading && (
          <div className="flex items-center gap-2 py-4 text-slate-400">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-200" />
            Loading markets…
          </div>
        )}
        {marketsError && (
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-amber-300">
            Failed to load markets: {(marketsError as Error).message}
          </div>
        )}
        {marketsData && !marketsLoading && (
          <MarketsTable data={marketsData} />
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
          Tickers
        </h3>
        {tickersLoading && (
          <div className="flex items-center gap-2 py-4 text-slate-400">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-slate-200" />
            Loading tickers…
          </div>
        )}
        {tickersError && (
          <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-amber-300">
            Failed to load tickers: {(tickersError as Error).message}
          </div>
        )}
        {tickers && !tickersLoading && (
          <TickersTable
            tickers={tickers}
            swapFuturesSymbols={
              marketsData
                ? new Set(
                    (marketsData.markets as CcxtMarket[])
                      .filter(isSwapOrFutures)
                      .map((m) => m.symbol)
                      .filter(Boolean) as string[]
                  )
                : new Set()
            }
          />
        )}
      </section>
    </div>
  );
}
