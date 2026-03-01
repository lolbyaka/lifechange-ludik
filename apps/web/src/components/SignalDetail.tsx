import { Link, useParams } from 'react-router-dom';
import { useSignal } from '../hooks/useSignals';

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
        <span className="text-slate-400">Loading…</span>
      </div>
    );
  }

  if (error || !signal) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load signal: {(error as Error)?.message ?? 'Not found'}
        <div className="mt-3">
          <Link to="/signals" className="text-sm text-red-200 hover:underline">
            ← Back to signals
          </Link>
        </div>
      </div>
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
        <Link
          to="/signals"
          className="rounded p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
          aria-label="Back to signals"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-lg font-medium text-slate-200">
          {signal.strategy} · {signal.symbol}
        </h2>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-500">
          Created
        </h3>
        <p className="text-sm text-slate-300">{formatDate(signal.createdAt)}</p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-500">
          Trading params
        </h3>
        <dl className="grid gap-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-slate-500 w-28 shrink-0">Strategy</dt>
            <dd className="text-slate-200">{signal.strategy}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-slate-500 w-28 shrink-0">Symbol</dt>
            <dd className="text-slate-200">{signal.symbol}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-slate-500 w-28 shrink-0">TP ROI</dt>
            <dd className="text-slate-200">{signal.tpROI}%</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-slate-500 w-28 shrink-0">SL ROI</dt>
            <dd className="text-slate-200">{signal.slROI}%</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-slate-500 w-28 shrink-0">Position size</dt>
            <dd className="text-slate-200">{signal.positionSize}</dd>
          </div>
          {optionalFields.map(({ label, value }) => (
            <div key={label} className="flex gap-2">
              <dt className="text-slate-500 w-28 shrink-0">{label}</dt>
              <dd className="font-mono text-slate-200 break-all">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
