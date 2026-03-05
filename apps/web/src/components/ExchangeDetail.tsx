import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  useExchange,
  useExchangeBalance,
  useExchangeTradesHistory,
} from '../hooks/useExchanges';
import { useBots, useCreateBot, useUpdateBot, useDeleteBot } from '../hooks/useBots';
import type { ExchangeBalance, CcxtPosition } from '../api/exchanges';
import type { CreateTradeBotInput, TradeBot } from '../types/bot';
import { BotForm } from './BotForm';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

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
      <p className="text-sm text-muted-foreground">No balances or all zero.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Currency</th>
            <th className="px-4 py-3 font-medium text-right">Total</th>
            <th className="px-4 py-3 font-medium text-right">Free</th>
            <th className="px-4 py-3 font-medium text-right">Used</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {entries.map(({ currency, total: t, free: f, used: u }) => (
            <tr key={currency} className="text-foreground">
              <td className="px-4 py-2.5 font-medium">{currency}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{t.toLocaleString()}</td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {f.toLocaleString()}
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                {u.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDateTime(timestamp?: number, iso?: string) {
  try {
    if (iso) return new Date(iso).toLocaleString();
    if (typeof timestamp === 'number') return new Date(timestamp).toLocaleString();
  } catch {
    // fall through
  }
  return iso ?? (timestamp ? String(timestamp) : '—');
}

function PositionsHistoryTable({ positions }: { positions: CcxtPosition[] }) {
  if (!positions.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No positions recorded yet for this exchange.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="px-4 py-3 font-medium">Direction</th>
            <th className="px-4 py-3 font-medium">Side</th>
            <th className="px-4 py-3 font-medium text-right">Size</th>
            <th className="px-4 py-3 font-medium text-right">Price</th>
            <th className="px-4 py-3 font-medium text-right">Notional</th>
            <th className="px-4 py-3 font-medium text-right">Fee</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {positions.map((pos, index) => {
            const size =
              typeof pos.amount === 'number'
                ? pos.amount
                : pos.info?.sz
                  ? Number(pos.info.sz)
                  : undefined;
            const feeCurrency = pos.fee?.currency ?? pos.info?.feeToken;
            const feeAmount =
              typeof pos.fee?.cost === 'number'
                ? pos.fee.cost
                : pos.info?.fee
                  ? Number(pos.info.fee)
                  : undefined;

            const key = pos.id ?? `${pos.symbol ?? 'position'}-${pos.timestamp ?? index}-${index}`;

            return (
              <tr key={key} className="text-foreground">
                <td className="px-4 py-2.5 text-muted-foreground">
                  {formatDateTime(pos.timestamp, pos.datetime)}
                </td>
                <td className="px-4 py-2.5 font-medium">
                  {pos.symbol ?? pos.info?.coin ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {pos.info?.dir ?? '—'}
                </td>
                <td className="px-4 py-2.5 uppercase">
                  {pos.side ?? pos.info?.side ?? '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {typeof size === 'number' ? size.toLocaleString() : '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {typeof pos.price === 'number'
                    ? pos.price.toLocaleString()
                    : pos.info?.px
                      ? Number(pos.info.px).toLocaleString()
                      : '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {typeof pos.cost === 'number'
                    ? pos.cost.toLocaleString()
                    : '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                  {typeof feeAmount === 'number'
                    ? `${feeAmount.toLocaleString()} ${feeCurrency ?? ''}`.trim()
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: exchange, isLoading: exchangeLoading, error: exchangeError } = useExchange(id ?? null);
  const { data: balance, isLoading: balanceLoading, error: balanceError } = useExchangeBalance(id ?? null);
  const { data: bots, isLoading: botsLoading, error: botsError } = useBots(id ?? undefined);
  const {
    data: tradesHistory,
    isLoading: tradesLoading,
    error: tradesError,
  } = useExchangeTradesHistory(id ?? null, 100);
  const createMutation = useCreateBot();
  const updateMutation = useUpdateBot();
  const deleteMutation = useDeleteBot();

  const [editingBot, setEditingBot] = useState<TradeBot | null>(null);
  const [showBotForm, setShowBotForm] = useState(false);

  const handleCreateBot = (data: CreateTradeBotInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowBotForm(false),
    });
  };

  const handleEditBotSubmit = (data: CreateTradeBotInput) => {
    if (!editingBot) return;
    updateMutation.mutate(
      {
        id: editingBot.id,
        data: {
          strategy: data.strategy,
          direction: data.direction,
          ticker: data.ticker,
          amount: data.amount,
        },
      },
      { onSuccess: () => setEditingBot(null) },
    );
  };

  const handleDeleteBot = (botId: string) => {
    if (window.confirm('Delete this bot? Positions linked to it will remain in the database.')) {
      deleteMutation.mutate(botId);
    }
  };

  if (exchangeLoading || !id) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (exchangeError || !exchange) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load exchange: {(exchangeError as Error)?.message ?? 'Not found'}
        </AlertDescription>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/">← Back to exchanges</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  const displayName = exchange.name ?? exchange.type;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label="Back to exchanges"
        >
          <Link to="/">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </Button>
        <h2 className="text-lg font-semibold capitalize tracking-tight">{displayName}</h2>
      </div>

      <section className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {balanceLoading && (
              <div className="flex items-center gap-2 py-4 text-muted-foreground">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
                Loading balance…
              </div>
            )}
            {balanceError && (
              <Alert variant="destructive">
                <AlertDescription>
                  Failed to load balance: {(balanceError as Error).message}
                </AlertDescription>
              </Alert>
            )}
            {balance && !balanceLoading && <BalanceTable balance={balance} />}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4 border-t border-border/60 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Trades history
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          All trades opened on this exchange by any bot.
        </p>

        {tradesLoading && (
          <div className="flex items-center gap-2 py-4 text-muted-foreground">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
            Loading trades…
          </div>
        )}

        {tradesError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load trades: {(tradesError as Error).message}
            </AlertDescription>
          </Alert>
        )}

        {tradesHistory && !tradesLoading && !tradesError && (
          <PositionsHistoryTable positions={tradesHistory} />
        )}
      </section>

      <section className="space-y-4 border-t border-border/60 pt-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Bots
          </h3>
          {!showBotForm && !editingBot && exchange && (
            <Button
              type="button"
              size="sm"
              onClick={() => setShowBotForm(true)}
            >
              Add bot
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Bots open positions automatically when matching signals arrive for this exchange.
        </p>

        {(showBotForm || editingBot) && exchange && (
          <BotForm
            bot={editingBot}
            exchangeId={editingBot?.exchangeId ?? id ?? ''}
            exchangeOptions={[
              {
                id: id ?? '',
                name: exchange.name,
                type: exchange.type,
              },
            ]}
            onSubmit={editingBot ? handleEditBotSubmit : handleCreateBot}
            onCancel={() => {
              setShowBotForm(false);
              setEditingBot(null);
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {botsLoading && (
          <div className="flex items-center gap-2 py-4 text-muted-foreground">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
            Loading bots…
          </div>
        )}

        {botsError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load bots: {(botsError as Error).message}
            </AlertDescription>
          </Alert>
        )}

        {bots && bots.length === 0 && !showBotForm && !editingBot && !botsLoading && !botsError && (
          <Card>
            <CardContent className="px-4 py-4 text-sm text-muted-foreground">
              No bots yet for this exchange. Add a bot to have positions opened automatically when signals arrive.
            </CardContent>
          </Card>
        )}

        {bots && bots.length > 0 && (
          <ul className="space-y-3">
            {bots.map((bot) => (
              <li key={bot.id}>
                <Card className="flex items-center justify-between gap-4 px-4 py-3">
                  <Link
                    to={`/exchanges/${encodeURIComponent(id ?? '')}/bots/${encodeURIComponent(bot.id)}`}
                    className="min-w-0 flex-1 hover:opacity-90"
                  >
                    <span className="font-medium text-foreground">
                      {bot.strategy} · {bot.ticker}
                    </span>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {bot.direction} · ${bot.amount} USD
                    </p>
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingBot(bot);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteBot(bot.id);
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
