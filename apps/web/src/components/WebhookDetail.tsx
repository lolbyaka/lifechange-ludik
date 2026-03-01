import { Link, useParams } from 'react-router-dom';
import { useWebhook } from '../hooks/useWebhooks';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function WebhookDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: webhook, isLoading, error } = useWebhook(id ?? null);

  if (isLoading || !id) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-slate-400">Loading…</span>
      </div>
    );
  }

  if (error || !webhook) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load webhook: {(error as Error)?.message ?? 'Not found'}
        <div className="mt-3">
          <Link to="/webhooks" className="text-sm text-red-200 hover:underline">
            ← Back to webhooks
          </Link>
        </div>
      </div>
    );
  }

  let payloadJson: string;
  try {
    const parsed = JSON.parse(webhook.payload);
    payloadJson = JSON.stringify(parsed, null, 2);
  } catch {
    payloadJson = webhook.payload;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/webhooks"
          className="rounded p-1.5 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
          aria-label="Back to webhooks"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-lg font-medium text-slate-200">Webhook</h2>
      </div>

      <section>
        <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-500">
          Received at
        </h3>
        <p className="text-sm text-slate-300">{formatDate(webhook.createdAt)}</p>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-500">
          Payload
        </h3>
        <pre className="overflow-x-auto rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 text-sm text-slate-300 whitespace-pre-wrap font-mono">
          {payloadJson}
        </pre>
      </section>
    </div>
  );
}
