import { describe, expect, it } from 'vitest';
import { cloudReflectionError, CloudReflectionError } from './errors';

describe('cloud reflection errors', () => {
  it('maps known server codes to safe actionable messages', async () => {
    const error = await cloudReflectionError(new Response(JSON.stringify({
      error: { code: 'QUOTA_EXCEEDED', message: 'internal detail' },
      resetAt: 1234,
    }), { status: 429, headers: { 'Content-Type': 'application/json' } }));

    expect(error).toBeInstanceOf(CloudReflectionError);
    expect(error.code).toBe('QUOTA_EXCEEDED');
    expect(error.status).toBe(429);
    expect(error.resetAt).toBe(1234);
    expect(error.message).toContain('cloud reflection limit');
    expect(error.message).not.toContain('internal detail');
  });

  it('uses the generic no-conclusion message for malformed or unknown errors', async () => {
    const malformed = await cloudReflectionError(new Response('bad gateway', { status: 502 }));
    const unknown = await cloudReflectionError(new Response(JSON.stringify({
      error: { code: 'PRIVATE_INTERNAL_CODE' },
    }), { status: 500 }));

    expect(malformed.code).toBe('REFLECTION_UNAVAILABLE');
    expect(malformed.message).toContain('No conclusion has been generated');
    expect(unknown.message).toContain('No conclusion has been generated');
    expect(unknown.message).not.toContain('PRIVATE_INTERNAL_CODE');
  });
});
