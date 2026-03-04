import { useState } from 'react';
import {
  useRootExchanges,
  useCreateRootExchange,
  useUpdateRootExchange,
  useDeleteRootExchange,
} from '../hooks/useRootExchanges';
import type { RootExchange, CreateRootExchangeInput } from '../types/root-exchange';
import { RootExchangeForm } from './RootExchangeForm';

function maskKey(key: string) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export function Admin() {
  const { data: exchanges, isLoading, error } = useRootExchanges();
  const createMutation = useCreateRootExchange();
  const updateMutation = useUpdateRootExchange();
  const deleteMutation = useDeleteRootExchange();
  const [editing, setEditing] = useState<RootExchange | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleCreate = (data: CreateRootExchangeInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleEditSubmit = (data: CreateRootExchangeInput) => {
    if (!editing) return;
    updateMutation.mutate(
      {
        id: editing.id,
        data: {
          name: data.name,
          apiKey: data.apiKey,
          secretKey: data.secretKey,
          passphrase: data.passphrase,
          walletAddress: data.walletAddress,
          type: data.type,
        },
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this root exchange configuration?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-slate-400">Loading admin exchanges…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-red-300">
        Failed to load root exchanges: {(error as Error).message}
      </div>
    );
  }

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-slate-200">Admin · Root Exchanges</h2>
        {!showForm && !editing && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Add root exchange
          </button>
        )}
      </div>

      <p className="text-sm text-slate-400">
        Manage root-level exchange configurations. These share the same fields as regular exchanges
        but are stored in a separate model for admin-level setup.
      </p>

      {(showForm || editing) && (
        <RootExchangeForm
          exchange={editing}
          onSubmit={editing ? handleEditSubmit : handleCreate}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          isLoading={pending}
        />
      )}

      {exchanges?.length === 0 && !showForm ? (
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-8 text-center text-slate-400">
          No root exchanges yet. Add one to configure global exchange settings.
        </div>
      ) : (
        <ul className="space-y-3">
          {exchanges?.map((ex) => (
            <li
              key={ex.id}
              className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-900/30 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <span className="font-medium capitalize text-slate-200">
                  {ex.name ?? ex.type}
                </span>
                <p className="mt-0.5 truncate text-sm text-slate-500">
                  API key: {maskKey(ex.apiKey)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(ex)}
                  className="rounded px-2 py-1 text-sm text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(ex.id)}
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

