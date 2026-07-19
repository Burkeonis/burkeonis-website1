export class ReflectionUnavailableError extends Error {
  constructor(message = 'Self Mirror could not complete this reflection. No conclusion has been generated. Your entry remains stored locally.') {
    super(message);
    this.name = 'ReflectionUnavailableError';
  }
}

const CLOUD_ERROR_MESSAGES: Record<string, string> = {
  AUTH_REQUIRED: 'Sign in before using this reflection mode. Your entry remains stored locally.',
  PRO_REQUIRED: 'This reflection mode requires Self Mirror Pro. Your entry remains stored locally.',
  QUOTA_EXCEEDED: 'Your cloud reflection limit has been reached. Your entry remains stored locally. Use Ollama or BYOK, or try cloud processing after the limit resets.',
  TURNSTILE_REQUIRED: 'The security check expired or was not completed. Complete it again, then retry. Your entry remains stored locally.',
  INVALID_REFLECTION_REQUEST: 'This reflection could not be sent safely. Your entry remains stored locally.',
  REFLECTION_UNAVAILABLE: 'Self Mirror could not complete this reflection. No conclusion has been generated. Your entry remains stored locally.',
};

interface ErrorEnvelope {
  error?: { code?: unknown };
  resetAt?: unknown;
}

export class CloudReflectionError extends ReflectionUnavailableError {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly resetAt: number | null = null,
  ) {
    super(CLOUD_ERROR_MESSAGES[code] ?? CLOUD_ERROR_MESSAGES.REFLECTION_UNAVAILABLE);
    this.name = 'CloudReflectionError';
  }
}

export async function cloudReflectionError(response: Response) {
  let envelope: ErrorEnvelope = {};
  try {
    envelope = await response.json() as ErrorEnvelope;
  } catch {
    // Do not expose upstream response bodies to the interface.
  }
  const code = typeof envelope.error?.code === 'string'
    ? envelope.error.code
    : 'REFLECTION_UNAVAILABLE';
  const resetAt = typeof envelope.resetAt === 'number' && Number.isFinite(envelope.resetAt)
    ? envelope.resetAt
    : null;
  return new CloudReflectionError(code, response.status, resetAt);
}
