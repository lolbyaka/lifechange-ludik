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
        <span className="text-slate-400">Loading bots…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load bots: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-200">Bots</h2>
        {!showForm && !editing && exchanges && exchanges.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Add bot
          </button>
        )}
      </div>

      <p className="text-sm text-slate-400">
        Bots open positions when a matching signal arrives (same strategy, ticker, and direction).
        {exchangeIdFromUrl && (
          <span className="ml-1">
            Showing bots for this exchange.{' '}
            <Link to="/bots" className="text-emerald-400 hover:underline">
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
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-8 text-center text-slate-400">
          No bots yet. Add a bot to have positions opened automatically when signals arrive.
        </div>
      ) : (
        <ul className="space-y-3">
          {bots?.map((bot) => (
            <li
              key={bot.id}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-3"
            >
              <Link
                to={`/bots/${bot.id}`}
                className="min-w-0 flex-1 hover:opacity-90"
              >
                <span className="font-medium text-slate-200">
                  {bot.exchange?.name ?? bot.exchange?.type ?? 'Exchange'} · {bot.strategy} · {bot.ticker}
                </span>
                <p className="mt-0.5 text-sm text-slate-500">
                  {bot.direction} · ${bot.amount} USD
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDate(bot.createdAt)}
                </p>
              </Link>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditing(bot);
                  }}
                  className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(bot.id);
                  }}
                  disabled={deleteMutation.isPending}
                  className="rounded px-2 py-1 text-sm text-red-400 hover:bg-red-950/50 hover:text-red-300 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
