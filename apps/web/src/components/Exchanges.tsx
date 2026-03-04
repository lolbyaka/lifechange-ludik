import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useExchanges, useCreateExchange, useDeleteExchange } from '../hooks/useExchanges';
import type { CreateExchangeInput, Exchange } from '../types/exchange';
import { ExchangeForm } from './ExchangeForm';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';

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
        <span className="text-muted-foreground">Loading exchanges…</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load exchanges: {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">Exchanges</h2>
        {!showForm && !editing && (
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowForm(true)}>
              Add exchange
            </Button>
          </div>
        )}
      </div>

      {(showForm || editing) && (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? 'Edit exchange' : 'Add exchange'}</CardTitle>
          </CardHeader>
          <CardContent>
            <ExchangeForm
              exchange={editing}
              onSubmit={handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
              isLoading={createMutation.isPending}
            />
          </CardContent>
        </Card>
      )}

      {exchanges?.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No exchanges yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
          {exchanges?.map((ex) => (
            <li key={ex.id}>
              <Card className="flex items-center justify-between gap-4 px-4 py-3">
                <Link
                  to={`/exchanges/${ex.id}`}
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
                    onClick={(e) => {
                      e.preventDefault();
                      setEditing(ex);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleDelete(ex.id);
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
        </>
      )}
    </div>
  );
}
