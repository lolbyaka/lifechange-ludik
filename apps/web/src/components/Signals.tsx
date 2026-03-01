import { Link } from 'react-router-dom';
import { useSignals } from '../hooks/useSignals';

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
        <span className="text-slate-400">Loading signals…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load signals: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-slate-200">Signals</h2>
      <p className="text-sm text-slate-400">
        Signals are created automatically when a webhook is received. Newest first.
      </p>

      {signals?.length === 0 ? (
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-8 text-center text-slate-400">
          No signals yet. Trigger a webhook from the Webhooks page to create one.
        </div>
      ) : (
        <ul className="space-y-3">
          {signals?.map((s) => (
            <li
              key={s.id}
              className="rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-3"
            >
              <Link to={`/signals/${s.id}`} className="block hover:opacity-90">
                <span className="font-medium text-slate-200">
                  {s.strategy} · {s.symbol}
                </span>
                <p className="mt-0.5 text-sm text-slate-500">
                  TP: {s.tpROI}% · SL: {s.slROI}% · Size: {s.positionSize}
                  {s.leverage ? ` · ${s.leverage}x` : ''}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(s.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
