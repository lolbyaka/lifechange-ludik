import { Link, useParams } from 'react-router-dom';
import { useSignal } from '../hooks/useSignals';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function SignalDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: signal, isLoading, error } = useSignal(id ?? null);

  if (isLoading || !id) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load signal: {(error as Error)?.message ?? 'Not found'}
        </AlertDescription>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/signals">← Back to signals</Link>
          </Button>
        </div>
      </Alert>
    );
  }

  const optionalFields = [
    { label: 'Leverage', value: signal.leverage },
    { label: 'Long MA Line', value: signal.longMALine },
    { label: 'Cross MA Signal Down', value: signal.crossMASignalDown },
    { label: 'Momentum Line', value: signal.momentumLine },
    { label: 'MA Line', value: signal.MALine },
  ].filter((f) => f.value != null && f.value !== '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label="Back to signals"
        >
          <Link to="/signals">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </Button>
        <h2 className="text-lg font-semibold tracking-tight">
          {signal.strategy} · {signal.symbol}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Created
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">{formatDate(signal.createdAt)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Trading params
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm">
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Strategy</dt>
              <dd className="text-foreground">{signal.strategy}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Symbol</dt>
              <dd className="text-foreground">{signal.symbol}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">TP ROI</dt>
              <dd className="text-foreground">{signal.tpROI}%</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">SL ROI</dt>
              <dd className="text-foreground">{signal.slROI}%</dd>
            </div>
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-muted-foreground">Position size</dt>
              <dd className="text-foreground">{signal.positionSize}</dd>
            </div>
            {optionalFields.map(({ label, value }) => (
              <div key={label} className="flex gap-2">
                <dt className="w-28 shrink-0 text-muted-foreground">{label}</dt>
                <dd className="break-all font-mono text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
