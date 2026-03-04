import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useBot } from '../hooks/useBots';
import type { Position } from '../types/bot';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

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
      <p className="text-sm text-muted-foreground">No positions yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="px-4 py-3 font-medium">Side</th>
            <th className="px-4 py-3 font-medium text-right">Quantity</th>
            <th className="px-4 py-3 font-medium text-right">Entry</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Opened</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {positions.map((pos) => (
            <tr key={pos.id} className="text-foreground">
              <td className="px-4 py-2.5 font-medium">{pos.symbol}</td>
              <td className="px-4 py-2.5">
                <Badge
                  variant="outline"
                  className={
                    pos.side === 'LONG'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
                      : 'border-amber-500/40 bg-amber-500/10 text-amber-700'
                  }
                >
                  {pos.side}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-right tabular-nums">{pos.quantity}</td>
              <td className="px-4 py-2.5 text-right tabular-nums">{pos.entryPrice}</td>
              <td className="px-4 py-2.5">
                <Badge
                  variant="outline"
                  className={
                    pos.status === 'OPEN'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
                      : 'border-border bg-muted text-muted-foreground'
                  }
                >
                  {pos.status}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {formatDate(pos.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BotDetail() {
  const { id, exchangeId: exchangeIdFromPath } = useParams<{ id: string; exchangeId?: string }>();
  const [searchParams] = useSearchParams();
  const exchangeIdFromQuery = searchParams.get('exchangeId');
  const { data: bot, isLoading, error } = useBot(id ?? null);

  if (isLoading || !id) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (error || !bot) {
    const resolvedExchangeId = exchangeIdFromPath ?? exchangeIdFromQuery ?? null;
    const errorBackTo = resolvedExchangeId ? `/exchanges/${resolvedExchangeId}` : '/';
    const errorBackLabel = resolvedExchangeId ? '← Back to exchange' : '← Back to exchanges';

    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load bot: {(error as Error)?.message ?? 'Not found'}
        </AlertDescription>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link to={errorBackTo}>{errorBackLabel}</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  const exchangeName = bot.exchange?.name ?? bot.exchange?.type ?? 'Exchange';
  const positions = bot.positions ?? [];
  const preferredExchangeId = exchangeIdFromPath ?? exchangeIdFromQuery ?? bot.exchangeId ?? null;
  const backTo = preferredExchangeId ? `/exchanges/${preferredExchangeId}` : '/';
  const backLabel = preferredExchangeId ? '← Back to exchange' : '← Back to exchanges';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label="Back"
        >
          <Link to={backTo}>
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
        </Button>
        <h2 className="text-lg font-semibold tracking-tight">
          {bot.strategy} · {bot.ticker} · {bot.direction}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Bot config
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Exchange</dt>
              <dd className="font-medium text-foreground">
                <Link
                  to={`/exchanges/${bot.exchangeId}`}
                  className="text-primary hover:underline"
                >
                  {exchangeName}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Strategy</dt>
              <dd className="font-medium text-foreground">{bot.strategy}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Direction</dt>
              <dd className="font-medium text-foreground">{bot.direction}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Ticker</dt>
              <dd className="font-medium text-foreground">{bot.ticker}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Amount (USD)</dt>
              <dd className="font-medium text-foreground">{bot.amount}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Positions
        </h3>
        <p className="text-sm text-muted-foreground">
          Positions opened by this bot when matching signals arrive.
        </p>
        <PositionsTable positions={positions} />
      </section>
    </div>
  );
}
