import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Env } from '../env';

const firebaseKeys = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'),
);

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
}

export async function requireFirebaseUser(request: Request, env: Env): Promise<AuthenticatedUser> {
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) throw new Error('AUTH_REQUIRED');

  const token = authorization.slice('Bearer '.length);
  const { payload } = await jwtVerify(token, firebaseKeys, {
    algorithms: ['RS256'],
    audience: env.FIREBASE_PROJECT_ID,
    issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
  });

  if (!payload.sub) throw new Error('AUTH_REQUIRED');
  return {
    uid: payload.sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    emailVerified: payload.email_verified === true,
  };
}
