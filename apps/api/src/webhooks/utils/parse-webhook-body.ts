/**
 * Normalizes incoming webhook body to a plain object.
 * Handles body sent as JSON object or as string (including malformed key:value strings).
 */
export function parseWebhookBody(body: unknown): Record<string, unknown> {
  if (body === null || body === undefined) {
    return {};
  }

  if (typeof body === 'object' && !Array.isArray(body) && body.constructor === Object) {
    return body as Record<string, unknown>;
  }

  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      if (body.includes(':')) {
        try {
          return JSON.parse('{' + body + '}') as Record<string, unknown>;
        } catch {
          console.error('Failed to parse webhook body as key-value:', body);
          return {};
        }
      }
      console.error('Failed to parse webhook body:', body);
      return {};
    }
  }

  return {};
}
