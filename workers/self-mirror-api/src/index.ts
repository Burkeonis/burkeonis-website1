import type { Env } from './env';
import { checkout, portal, status, webhook } from './billing/routes';
import { safeError } from './http';
import { recordEvent } from './observability/events';
import { reflect } from './reflection/route';
import { runtimeConfig } from './config/route';
import { quotaStatus } from './quota/route';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (request.method === 'POST' && url.pathname === '/api/self-mirror/billing/checkout') return checkout(request, env);
      if (request.method === 'POST' && url.pathname === '/api/self-mirror/billing/portal') return portal(request, env);
      if (request.method === 'POST' && url.pathname === '/api/self-mirror/billing/webhook') return webhook(request, env);
      if (request.method === 'GET' && url.pathname === '/api/self-mirror/billing/status') return status(request, env);
      if (request.method === 'POST' && url.pathname === '/api/self-mirror/reflections') return reflect(request, env);
      if (request.method === 'GET' && url.pathname === '/api/self-mirror/config') return runtimeConfig(env);
      if (request.method === 'GET' && url.pathname === '/api/self-mirror/usage') return quotaStatus(request, env);
      return safeError('NOT_FOUND', 404);
    } catch (error) {
      const code = error instanceof Error ? error.message : 'WORKER_EXCEPTION';
      if (code === 'AUTH_REQUIRED') return safeError('AUTH_REQUIRED', 401);
      if (code === 'PRO_REQUIRED') return safeError('PRO_REQUIRED', 403);
      await recordEvent(env, 'worker_exception', 'unhandled');
      return safeError('WORKER_EXCEPTION', 500);
    }
  },
};
