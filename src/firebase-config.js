// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyCTpaMr6UUXaIYG2WYB4q_HnPWq3LZZ0nM",
  authDomain: "zikr-app-45783.firebaseapp.com",
  projectId: "zikr-app-45783",
  storageBucket: "zikr-app-45783.firebasestorage.app",
  messagingSenderId: "549599601468",
  appId: "1:549599601468:web:d428204d5a53269109f439"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
