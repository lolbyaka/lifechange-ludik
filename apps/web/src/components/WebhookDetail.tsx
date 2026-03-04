import { Link, useParams } from 'react-router-dom';
import { useWebhook } from '../hooks/useWebhooks';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';

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
        <span className="text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (error || !webhook) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Failed to load webhook: {(error as Error)?.message ?? 'Not found'}
        </AlertDescription>
        <div className="mt-3">
          <Button asChild variant="outline" size="sm">
            <Link to="/webhooks">← Back to webhooks</Link>
          </Button>
        </div>
      </Alert>
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
        <Button
          asChild
          variant="ghost"
          size="icon"
          aria-label="Back to webhooks"
        >
          <Link to="/webhooks">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        </Button>
        <h2 className="text-lg font-semibold tracking-tight">Webhook</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Received at
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground">{formatDate(webhook.createdAt)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Payload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap break-words rounded-md border bg-muted p-4 text-xs sm:text-sm font-mono text-foreground overflow-x-auto">
            {payloadJson}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
