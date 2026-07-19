import type { Env } from '../env';

const encoder = new TextEncoder();
const COOKIE = 'sm_anon';

const bytesToHex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hmac(secret: string, value: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToHex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

export async function anonymousSubject(request: Request, env: Env) {
  const cookieHeader = request.headers.get('Cookie') ?? '';
  const cookieValue = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  let id = '';
  let setCookie: string | null = null;
  if (cookieValue) {
    const [candidate, signature] = cookieValue.split('.');
    if (candidate && signature && await hmac(env.ANON_SESSION_SECRET, candidate) === signature) id = candidate;
  }
  if (!id) {
    id = crypto.randomUUID();
    const signature = await hmac(env.ANON_SESSION_SECRET, id);
    setCookie = `${COOKIE}=${id}.${signature}; Path=/api/self-mirror; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`;
  }
  return { subjectHash: await hmac(env.ANON_SESSION_SECRET, `anonymous:${id}`), setCookie };
}

export const authenticatedSubject = (uid: string, env: Env) => hmac(env.ANON_SESSION_SECRET, `firebase:${uid}`);
