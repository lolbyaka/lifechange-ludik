import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExchanges, useCreateExchange, useDeleteExchange } from '../hooks/useExchanges';
import type { CreateExchangeInput, Exchange } from '../types/exchange';
import { ExchangeForm } from './ExchangeForm';

function maskKey(key: string) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export function Exchanges() {
  const { data: exchanges, isLoading, error } = useExchanges();
  const createMutation = useCreateExchange();
  const deleteMutation = useDeleteExchange();
  const [editing, setEditing] = useState<Exchange | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = (data: CreateExchangeInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this exchange connection?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-slate-400">Loading exchanges…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load exchanges: {(error as Error).message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-slate-200">Exchanges</h2>
        {!showForm && !editing && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Add exchange
          </button>
        )}
      </div>

      {(showForm || editing) && (
        <ExchangeForm
          exchange={editing}
          onSubmit={handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          isLoading={createMutation.isPending}
        />
      )}

      {exchanges?.length === 0 && !showForm ? (
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-8 text-center text-slate-400">
          No exchanges yet. Add one to get started.
        </div>
      ) : (
        <ul className="space-y-3">
          {exchanges?.map((ex) => (
            <li
              key={ex.id}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-3"
            >
              <Link
                to={`/exchanges/${ex.id}`}
                className="min-w-0 flex-1 hover:opacity-90"
              >
                <span className="font-medium capitalize text-slate-200">
                  {ex.name ?? ex.type}
                </span>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  API key: {maskKey(ex.apiKey)}
                </p>
              </Link>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setEditing(ex);
                  }}
                  className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(ex.id);
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
