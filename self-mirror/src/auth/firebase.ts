import { initializeApp, getApps } from 'firebase/app';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const configured = Object.values(config).every((value) => typeof value === 'string' && value.length > 0);
const app = configured ? (getApps()[0] ?? initializeApp(config)) : null;
export const auth = app ? getAuth(app) : null;

export const signInWithGoogle = () => {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  return signInWithPopup(auth, new GoogleAuthProvider());
};
export const signInWithEmail = (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  return signInWithEmailAndPassword(auth, email, password);
};
export const registerWithEmail = async (email: string, password: string) => {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
  return credential;
};
export const resetPassword = (email: string) => {
  if (!auth) throw new Error('Firebase Authentication is not configured.');
  return sendPasswordResetEmail(auth, email);
};
export const signOutUser = () => auth ? signOut(auth) : Promise.resolve();
