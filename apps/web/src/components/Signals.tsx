import { Link } from 'react-router-dom';
import { useSignals } from '../hooks/useSignals';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function Signals() {
  const { data: signals, isLoading, error } = useSignals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading signals…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load signals: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold tracking-tight">Signals</h2>
      <p className="text-sm text-muted-foreground">
        Signals are created automatically when a webhook is received. Newest first.
      </p>

      {signals?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No signals yet. Trigger a webhook from the Webhooks page to create one.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {signals?.map((s) => (
            <li key={s.id}>
              <Card className="px-4 py-3">
                <Link to={`/signals/${s.id}`} className="block hover:opacity-90">
                  <span className="font-medium text-foreground">
                    {s.strategy} · {s.symbol}
                  </span>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    TP: {s.tpROI}% · SL: {s.slROI}% · Size: {s.positionSize}
                    {s.leverage ? ` · ${s.leverage}x` : ''}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(s.createdAt)}
                  </p>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
