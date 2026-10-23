import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type UserCredential,
} from "firebase/auth";

export interface FirebaseClientConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export function getFirebaseConfig(): FirebaseClientConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
  };
}

export function isFirebaseConfigured(): boolean {
  const config = getFirebaseConfig();
  return Boolean(config.apiKey && config.projectId);
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (appInstance) return appInstance;

  const existing = getApps();
  if (existing.length > 0) {
    appInstance = getApp();
    return appInstance;
  }

  const config = getFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    throw new Error(
      "Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_API_KEY and NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env file."
    );
  }

  appInstance = initializeApp(config);
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  authInstance = getAuth(app);
  return authInstance;
}

export interface GoogleSignInResult {
  email: string;
  name: string;
  photoURL: string | null;
  firebaseIdToken: string;
  googleIdToken?: string;
  uid: string;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase configuration missing. Please fill in NEXT_PUBLIC_FIREBASE_API_KEY and other Firebase variables in .env to enable Google Sign-In."
    );
  }

  const auth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: "select_account",
  });

  try {
    const result: UserCredential = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user.email) {
      throw new Error("Unable to retrieve email address from your Google account.");
    }

    const firebaseIdToken = await user.getIdToken();
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const googleIdToken = credential?.idToken || undefined;

    return {
      email: user.email,
      name: user.displayName || user.email.split("@")[0],
      photoURL: user.photoURL,
      firebaseIdToken,
      googleIdToken,
      uid: user.uid,
    };
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in cancelled: popup closed before completion.");
    }
    if (error.code === "auth/cancelled-popup-request") {
      throw new Error("Sign-in cancelled: previous popup request was superseded.");
    }
    if (error.code === "auth/popup-blocked") {
      throw new Error("Sign-in popup was blocked by your browser. Please allow popups for localhost:3000.");
    }
    if (error.code === "auth/unauthorized-domain") {
      throw new Error("Domain not authorized in Firebase Console. Go to Firebase Console -> Authentication -> Settings -> Authorized domains and add localhost.");
    }
    if (error.code === "auth/invalid-api-key") {
      throw new Error("Invalid Firebase API Key. Please verify NEXT_PUBLIC_FIREBASE_API_KEY in .env.");
    }
    throw new Error(error.message || "Failed to sign in with Google.");
  }
}
