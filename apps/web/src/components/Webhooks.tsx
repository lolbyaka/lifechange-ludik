import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useWebhooks, useTriggerWebhook, useDeleteWebhook } from '../hooks/useWebhooks';
import { WEBHOOK_EXAMPLES } from '../api/webhook-examples';
import type { WebhookListFilters } from '../api/webhooks';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

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
        <span className="text-muted-foreground">Loading webhooks…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load webhooks: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Webhooks</h2>
        <p className="text-sm text-muted-foreground">
          Inspect and manually trigger webhook payloads used to create trading signals.
        </p>
      </div>

      {/* Test webhook with predefined examples */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Test webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Send a predefined payload to <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /webhooks</code>{' '}
            (creates a new webhook record).
          </p>
          <div className="flex flex-wrap gap-3">
            {WEBHOOK_EXAMPLES.map(({ id, label, payload }) => (
              <Button
                key={id}
                type="button"
                size="sm"
                onClick={() => openTriggerModal(label, payload)}
                disabled={triggerMutation.isPending}
              >
                Trigger {label}
              </Button>
            ))}
          </div>
          {triggerMutation.isPending && (
            <p className="mt-2 text-sm text-muted-foreground">Sending…</p>
          )}
          {triggerSuccess && (
            <p className="mt-2 text-sm text-emerald-600">{triggerSuccess}</p>
          )}
          {triggerError && (
            <p className="mt-2 text-sm text-destructive">{triggerError}</p>
          )}
        </CardContent>
      </Card>

      {/* Trigger payload modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="trigger-modal-title"
        >
          <Card className="w-full max-w-2xl border border-border shadow-lg">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle id="trigger-modal-title" className="text-base font-semibold">
                Edit payload — {modalLabel}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Edit the JSON below, then click Send to trigger the webhook.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <Textarea
                value={modalPayload}
                onChange={(e) => {
                  setModalPayload(e.target.value);
                  setModalJsonError(null);
                }}
                rows={16}
                spellCheck={false}
                className="font-mono text-xs"
                placeholder="{}"
              />
              {modalJsonError && (
                <p className="mt-2 text-sm text-destructive">{modalJsonError}</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSendFromModal}
                  disabled={triggerMutation.isPending}
                >
                  {triggerMutation.isPending ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label
                htmlFor="filter-ticker"
                className="block text-xs font-medium text-muted-foreground"
              >
                Ticker
              </label>
              <div className="mt-1 w-32">
                <Input
                  id="filter-ticker"
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="e.g. ETH"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="filter-strategy"
                className="block text-xs font-medium text-muted-foreground"
              >
                Strategy
              </label>
              <select
                id="filter-strategy"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="mt-1 w-36 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                <option value="DIY">DIY</option>
                <option value="Momentum">Momentum</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="filter-direction"
                className="block text-xs font-medium text-muted-foreground"
              >
                Direction
              </label>
              <select
                id="filter-direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="mt-1 w-32 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                <option value="LONG">LONG</option>
                <option value="SHORT">SHORT</option>
              </select>
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTicker('');
                  setStrategy('');
                  setDirection('');
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* List of received webhooks */}
      <section>
        <h3 className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Received webhooks
        </h3>
        {webhooks?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No webhooks yet. Use the test buttons above or send{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">POST /webhooks</code> from an
              external source.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {webhooks?.map((w) => (
              <li key={w.id}>
                <Card className="flex items-center justify-between gap-4 px-4 py-3">
                  <Link
                    to={`/webhooks/${w.id}`}
                    className="min-w-0 flex-1 hover:opacity-90"
                  >
                    <span className="font-mono text-xs sm:text-sm text-foreground">
                      {getPayloadPreview(w.payload, w.symbol, w.strategy, w.direction)}
                    </span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(w.createdAt)}
                    </p>
                  </Link>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(w.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
