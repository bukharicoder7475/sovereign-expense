import { initializeApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCKNnskDoQXnjhUFon_QVSUCg2e67vLqFE",
  authDomain: "sovereign-dd216.firebaseapp.com",
  projectId: "sovereign-dd216",
  storageBucket: "sovereign-dd216.firebasestorage.app",
  messagingSenderId: "936701652873",
  appId: "1:936701652873:web:fe9103591684ed9d66fb58",
  measurementId: "G-V6LVRLR5M7"
};

let app = null;
let auth = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} catch (e) {
  console.warn('Firebase init error:', e.message);
}

let recaptchaVerifier = null;

export function getRecaptchaVerifier(container) {
  if (!auth || !container) return null;
  if (recaptchaVerifier) {
    try { recaptchaVerifier.clear(); } catch (e) {}
  }
  recaptchaVerifier = new RecaptchaVerifier(auth, container, {
    size: 'normal',
    callback: () => {},
    'expired-callback': () => {}
  });
  return recaptchaVerifier;
}

export function getCurrentRecaptchaVerifier() {
  return recaptchaVerifier;
}

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export const isFirebaseConfigured = () => !!auth;
