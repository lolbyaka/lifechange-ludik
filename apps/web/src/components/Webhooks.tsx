import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWebhooks, useTriggerWebhook, useDeleteWebhook } from '../hooks/useWebhooks';
import { WEBHOOK_EXAMPLES } from '../api/webhook-examples';
import type { WebhookListFilters } from '../api/webhooks';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function getPayloadPreview(
  payloadStr: string,
  symbol?: string | null,
  strategy?: string | null,
  direction?: string | null,
): string {
  if (symbol ?? strategy ?? direction) {
    const parts = [strategy ?? '—', symbol ?? '—', direction ?? '—'].filter((p) => p !== '—');
    return parts.length ? parts.join(' · ') : '—';
  }
  try {
    const p = JSON.parse(payloadStr) as Record<string, unknown>;
    const s = typeof p.strategy === 'string' ? p.strategy : '—';
    const sym = typeof p.symbol === 'string' ? p.symbol : '—';
    const d = typeof p.direction === 'string' ? p.direction : '—';
    return [s, sym, d].filter((x) => x !== '—').join(' · ') || '—';
  } catch {
    return payloadStr.slice(0, 40) + (payloadStr.length > 40 ? '…' : '');
  }
}

export function Webhooks() {
  const [ticker, setTicker] = useState('');
  const [strategy, setStrategy] = useState('');
  const [direction, setDirection] = useState('');
  const filters: WebhookListFilters = useMemo(() => {
    const f: WebhookListFilters = {};
    if (ticker.trim()) f.symbol = ticker.trim();
    if (strategy.trim()) f.strategy = strategy.trim();
    if (direction.trim()) f.direction = direction.trim();
    return f;
  }, [ticker, strategy, direction]);

  const { data: webhooks, isLoading, error } = useWebhooks(filters);
  const triggerMutation = useTriggerWebhook();
  const deleteMutation = useDeleteWebhook();
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLabel, setModalLabel] = useState('');
  const [modalPayload, setModalPayload] = useState('');
  const [modalJsonError, setModalJsonError] = useState<string | null>(null);
  const hasActiveFilters = ticker.trim() !== '' || strategy.trim() !== '' || direction.trim() !== '';

  const openTriggerModal = (label: string, payload: Record<string, unknown>) => {
    setTriggerError(null);
    setTriggerSuccess(null);
    setModalJsonError(null);
    setModalLabel(label);
    setModalPayload(JSON.stringify(payload, null, 2));
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalPayload('');
    setModalLabel('');
    setModalJsonError(null);
  };

  const handleSendFromModal = () => {
    setModalJsonError(null);
    let parsed: Record<string, unknown>;
    try {
      const value = JSON.parse(modalPayload);
      if (value === null || typeof value !== 'object' || Array.isArray(value)) {
        setModalJsonError('Payload must be a JSON object');
        return;
      }
      parsed = value as Record<string, unknown>;
    } catch (e) {
      setModalJsonError((e as Error).message ?? 'Invalid JSON');
      return;
    }
    triggerMutation.mutate(parsed, {
      onSuccess: (res) => {
        setTriggerSuccess(`"${modalLabel}" sent. Webhook id: ${res.id}`);
        closeModal();
      },
      onError: (err) => {
        setTriggerError((err as Error).message);
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this webhook record?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-slate-400">Loading webhooks…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load webhooks: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-medium text-slate-200">Webhooks</h2>

      {/* Test webhook with predefined examples */}
      <section className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
          Test webhook
        </h3>
        <p className="mb-4 text-sm text-slate-400">
          Send a predefined payload to POST /webhooks (creates a new webhook record).
        </p>
        <div className="flex flex-wrap gap-3">
          {WEBHOOK_EXAMPLES.map(({ id, label, payload }) => (
            <button
              key={id}
              type="button"
              onClick={() => openTriggerModal(label, payload)}
              disabled={triggerMutation.isPending}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
            >
              Trigger {label}
            </button>
          ))}
        </div>
        {triggerMutation.isPending && (
          <p className="mt-2 text-sm text-slate-400">Sending…</p>
        )}
        {triggerSuccess && (
          <p className="mt-2 text-sm text-emerald-400">{triggerSuccess}</p>
        )}
        {triggerError && (
          <p className="mt-2 text-sm text-red-400">{triggerError}</p>
        )}
      </section>

      {/* Trigger payload modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="trigger-modal-title"
        >
          <div className="w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
            <div className="border-b border-slate-700 px-4 py-3">
              <h3 id="trigger-modal-title" className="text-base font-medium text-slate-200">
                Edit payload — {modalLabel}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Edit the JSON below, then click Send to trigger the webhook.
              </p>
            </div>
            <div className="p-4">
              <textarea
                value={modalPayload}
                onChange={(e) => {
                  setModalPayload(e.target.value);
                  setModalJsonError(null);
                }}
                rows={16}
                spellCheck={false}
                className="w-full rounded-md border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder="{}"
              />
              {modalJsonError && (
                <p className="mt-2 text-sm text-red-400">{modalJsonError}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-700 px-4 py-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendFromModal}
                disabled={triggerMutation.isPending}
                className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {triggerMutation.isPending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <section className="rounded-lg border border-slate-700/50 bg-slate-900/30 p-4">
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
          Filters
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="filter-ticker" className="block text-xs font-medium text-slate-500">
              Ticker
            </label>
            <input
              id="filter-ticker"
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              placeholder="e.g. ETH"
              className="mt-1 w-32 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 placeholder-slate-500 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label htmlFor="filter-strategy" className="block text-xs font-medium text-slate-500">
              Strategy
            </label>
            <select
              id="filter-strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="mt-1 w-36 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">All</option>
              <option value="DIY">DIY</option>
              <option value="Momentum">Momentum</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-direction" className="block text-xs font-medium text-slate-500">
              Direction
            </label>
            <select
              id="filter-direction"
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="mt-1 w-32 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1.5 text-sm text-slate-100 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="">All</option>
              <option value="LONG">LONG</option>
              <option value="SHORT">SHORT</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setTicker('');
                setStrategy('');
                setDirection('');
              }}
              className="rounded-md border border-slate-600 px-2.5 py-1.5 text-sm text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* List of received webhooks */}
      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-500">
          Received webhooks
        </h3>
        {webhooks?.length === 0 ? (
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-8 text-center text-slate-400">
            No webhooks yet. Use the test buttons above or send POST /webhooks from an external source.
          </div>
        ) : (
          <ul className="space-y-3">
            {webhooks?.map((w) => (
              <li
                key={w.id}
                className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-3"
              >
                <Link
                  to={`/webhooks/${w.id}`}
                  className="min-w-0 flex-1 hover:opacity-90"
                >
                  <span className="font-mono text-sm text-slate-300">
                    {getPayloadPreview(w.payload, w.symbol, w.strategy, w.direction)}
                  </span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDate(w.createdAt)}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(w.id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="shrink-0 rounded px-2 py-1 text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-50"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
