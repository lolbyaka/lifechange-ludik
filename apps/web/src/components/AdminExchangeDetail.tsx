import { Link, useParams } from 'react-router-dom';
import { useRootExchange } from '../hooks/useRootExchanges';
import { useExchangeMarkets, useExchangeHealth } from '../hooks/useExchanges';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

export function AdminExchangeDetail() {
  const { id } = useParams<{ id: string }>();
  const {
    data: rootExchange,
    isLoading: rootLoading,
    error: rootError,
  } = useRootExchange(id ?? null);
  const {
    data: marketsResponse,
    isLoading: marketsLoading,
    error: marketsError,
  } = useExchangeMarkets(rootExchange?.type ?? null);
  const {
    data: health,
    isLoading: healthLoading,
    error: healthError,
  } = useExchangeHealth(rootExchange?.type ?? null);

  if (!id) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Missing exchange id in URL.</AlertDescription>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">← Back to admin</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  if (rootLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading exchange…</span>
      </div>
    );
  }

  if (rootError || !rootExchange) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load exchange: {(rootError as Error)?.message ?? 'Not found'}
        </AlertDescription>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin">← Back to admin</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  const displayName = rootExchange.name ?? rootExchange.type;
  const lastUpdated =
    (marketsResponse as any)?.loadedAt ?? (marketsResponse as any)?.updatedAt ?? null;
  const markets = (marketsResponse as any)?.markets ?? [];

  const healthStatus = health?.status ?? 'unknown';
  const healthLabel =
    healthStatus === 'connected'
      ? 'Connected'
      : healthStatus === 'disconnected'
        ? 'Disconnected'
        : 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label="Back to admin"
        >
          <Link to="/admin">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </Button>
        <h2 className="text-lg font-semibold capitalize tracking-tight">
          Admin · {displayName}
        </h2>
      </div>

      <section className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Exchange details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm text-foreground sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Type</div>
                <div className="mt-0.5 capitalize">{String(rootExchange.type)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Name</div>
                <div className="mt-0.5">{rootExchange.name || '—'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Wallet</div>
                <div className="mt-0.5 break-all">
                  {rootExchange.walletAddress || '—'}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Created / Updated
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  <div>
                    Created:{' '}
                    {new Date(rootExchange.createdAt).toLocaleString()}
                  </div>
                  <div>
                    Updated:{' '}
                    {new Date(rootExchange.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Connection
                </div>
                <div className="mt-1 flex items-center gap-2 text-sm">
                  {healthLoading ? (
                    <span className="inline-flex items-center gap-2 text-muted-foreground">
                      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-border border-t-foreground" />
                      Checking…
                    </span>
                  ) : healthError ? (
                    <span className="text-amber-600">
                      Failed to load health
                    </span>
                  ) : (
                    <>
                      <span
                        className={[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          healthStatus === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/40'
                            : healthStatus === 'disconnected'
                              ? 'bg-red-500/10 text-red-700 ring-1 ring-red-500/40'
                              : 'bg-muted text-muted-foreground ring-1 ring-border',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'mr-1 inline-block h-2 w-2 rounded-full',
                            healthStatus === 'connected'
                              ? 'bg-emerald-500'
                              : healthStatus === 'disconnected'
                                ? 'bg-red-500'
                                : 'bg-muted-foreground',
                          ].join(' ')}
                        />
                        {healthLabel}
                      </span>
                      {health?.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          Last update:{' '}
                          {new Date(health.timestamp).toLocaleString()}
                        </span>
                      )}
                      {health?.reason && healthStatus === 'disconnected' && (
                        <span className="text-xs text-muted-foreground">
                          · {health.reason}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Markets
          </h3>
        </div>

        {marketsLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
            Loading markets…
          </div>
        )}

        {marketsError && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load markets: {(marketsError as Error).message}
            </AlertDescription>
          </Alert>
        )}

        {lastUpdated && !marketsLoading && !marketsError && (
          <p className="text-xs text-muted-foreground">
            Last updated:{' '}
            {new Date(lastUpdated).toLocaleString()}
          </p>
        )}

        {markets && markets.length > 0 && !marketsLoading && !marketsError && (
          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="min-w-full text-left text-xs">
              <thead className="border-b border-border bg-muted text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">Symbol</th>
                  <th className="px-3 py-2 font-medium">Base</th>
                  <th className="px-3 py-2 font-medium">Quote</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {markets.slice(0, 200).map((m: any, idx: number) => (
                  <tr key={m.symbol ?? m.id ?? idx} className="text-foreground">
                    <td className="px-3 py-2">{m.symbol ?? m.id ?? '—'}</td>
                    <td className="px-3 py-2">
                      {m.base ?? m.baseAsset ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      {m.quote ?? m.quoteAsset ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {m.status ?? (m.active === false ? 'disabled' : 'trading')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {markets.length > 200 && (
              <p className="px-3 py-2 text-[10px] text-muted-foreground">
                Showing first 200 markets of {markets.length}.
              </p>
            )}
          </div>
        )}

        {!marketsLoading &&
          !marketsError &&
          (!markets || markets.length === 0) && (
            <p className="text-sm text-muted-foreground">
              No markets snapshot available yet for this exchange.
            </p>
          )}
      </section>
    </div>
  );
}

