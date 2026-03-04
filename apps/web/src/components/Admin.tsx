import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useRootExchanges,
  useCreateRootExchange,
  useUpdateRootExchange,
  useDeleteRootExchange,
} from '../hooks/useRootExchanges';
import type { RootExchange, CreateRootExchangeInput } from '../types/root-exchange';
import { RootExchangeForm } from './RootExchangeForm';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

function maskKey(key: string) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••••••' + key.slice(-4);
}

export function Admin() {
  const {
    data: rootExchanges,
    isLoading: rootLoading,
    error: rootError,
  } = useRootExchanges();
  const createMutation = useCreateRootExchange();
  const updateMutation = useUpdateRootExchange();
  const deleteMutation = useDeleteRootExchange();
  const [editing, setEditing] = useState<RootExchange | null>(null);
  const [showForm, setShowForm] = useState(false);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleCreate = (data: CreateRootExchangeInput) => {
    createMutation.mutate(data, {
      onSuccess: closeForm,
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
      { onSuccess: closeForm },
    );
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this root exchange configuration?')) {
      deleteMutation.mutate(id);
    }
  };

  if (rootLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-muted-foreground">Loading admin exchanges…</span>
      </div>
    );
  }

  if (rootError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load root exchanges: {(rootError as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  const pending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Admin · Root Exchanges</h2>
          {!showForm && !editing && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              Add root exchange
            </Button>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          Manage root-level exchange configurations. These share the same fields as regular exchanges
          but are stored in a separate model for admin-level setup.
        </p>

        {(showForm || editing) && (
          <div
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
            onClick={closeForm}
          >
            <div
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{editing ? 'Edit root exchange' : 'Add root exchange'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <RootExchangeForm
                    exchange={editing}
                    onSubmit={editing ? handleEditSubmit : handleCreate}
                    onCancel={closeForm}
                    isLoading={pending}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {rootExchanges?.length === 0 && !showForm ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No root exchanges yet. Add one to configure global exchange settings.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {rootExchanges?.map((ex) => (
              <li key={ex.id}>
                <Card className="flex items-center justify-between gap-4 px-4 py-3">
                  <Link
                    to={`/admin/exchange/${ex.id}`}
                    className="min-w-0 flex-1 hover:opacity-90"
                  >
                    <div className="font-medium capitalize text-foreground">
                      {ex.name ?? ex.type}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      API key: {maskKey(ex.apiKey)}
                    </p>
                  </Link>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => setEditing(ex)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      type="button"
                      onClick={() => handleDelete(ex.id)}
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
      </section>
    </div>
  );
}

