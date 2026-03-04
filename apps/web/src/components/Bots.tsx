import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useBots,
  useCreateBot,
  useUpdateBot,
  useDeleteBot,
} from '../hooks/useBots';
import { useExchanges } from '../hooks/useExchanges';
import type { CreateTradeBotInput, TradeBot } from '../types/bot';
import { BotForm } from './BotForm';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function Bots() {
  const [searchParams] = useSearchParams();
  const exchangeIdFromUrl = searchParams.get('exchangeId') ?? undefined;

  const { data: bots, isLoading, error } = useBots(exchangeIdFromUrl);
  const { data: exchanges } = useExchanges();
  const createMutation = useCreateBot();
  const updateMutation = useUpdateBot();
  const deleteMutation = useDeleteBot();

  const [editing, setEditing] = useState<TradeBot | null>(null);
  const [showForm, setShowForm] = useState(false);

  const exchangeOptions =
    exchanges?.map((ex) => ({
      id: ex.id,
      name: ex.name,
      type: ex.type,
    })) ?? [];

  const handleCreate = (data: CreateTradeBotInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleEditSubmit = (data: CreateTradeBotInput) => {
    if (!editing) return;
    updateMutation.mutate(
      {
        id: editing.id,
        data: {
          strategy: data.strategy,
          direction: data.direction,
          ticker: data.ticker,
          amount: data.amount,
        },
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this bot? Positions linked to it will remain in the database.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading bots…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load bots: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Bots</h2>
        {!showForm && !editing && exchanges && exchanges.length > 0 && (
          <Button
            type="button"
            size="sm"
            onClick={() => setShowForm(true)}
          >
            Add bot
          </Button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Bots open positions when a matching signal arrives (same strategy, ticker, and direction).
        {exchangeIdFromUrl && (
          <span className="ml-1">
            Showing bots for this exchange.{' '}
            <Link to="/bots" className="text-primary hover:underline">
              Show all
            </Link>
          </span>
        )}
      </p>

      {(showForm || editing) && (
        <BotForm
          bot={editing}
          exchangeId={editing?.exchangeId ?? exchangeIdFromUrl ?? ''}
          exchangeOptions={exchangeOptions}
          onSubmit={editing ? handleEditSubmit : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {bots?.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No bots yet. Add a bot to have positions opened automatically when signals arrive.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {bots?.map((bot) => (
            <li key={bot.id}>
              <Card className="flex items-center justify-between gap-4 px-4 py-3">
                <Link
                  to={`/bots/${bot.id}`}
                  className="min-w-0 flex-1 hover:opacity-90"
                >
                  <span className="font-medium text-foreground">
                    {bot.exchange?.name ?? bot.exchange?.type ?? 'Exchange'} · {bot.strategy} · {bot.ticker}
                  </span>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {bot.direction} · ${bot.amount} USD
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(bot.createdAt)}
                  </p>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(bot);
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
                      handleDelete(bot.id);
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
    </div>
  );
}
