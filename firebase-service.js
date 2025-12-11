// firebase-service.js
// Firebase integration for Zikr Game

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs 
} from 'firebase/firestore';

// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// AUTHENTICATION FUNCTIONS
// ==========================================

export const registerUser = async (username, password) => {
  try {
    // Create auth user (using username@zikrgame.app as email format)
    const email = `${username.toLowerCase()}@zikrgame.app`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      username: username,
      email: email,
      totalPoints: 0,
      unlockedPhrases: [1, 2, 3, 4],
      totalZikrTime: 0,
      achievements: [],
      sessionsCompleted: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: new Date().toISOString().split('T')[0],
      phraseCounts: {},
      dailyPoints: 0,
      lastPointsResetDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });
    
    return { success: true, userId: user.uid, username };
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'Username already exists' };
    }
    return { success: false, error: error.message };
  }
};

export const loginUser = async (username, password) => {
  try {
    const email = `${username.toLowerCase()}@zikrgame.app`;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return { 
        success: true, 
        userId: user.uid,
        userData: userDoc.data() 
      };
    } else {
      return { success: false, error: 'User data not found' };
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      return { success: false, error: 'Invalid username or password' };
    }
    return { success: false, error: error.message };
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// USER DATA FUNCTIONS
// ==========================================

export const getUserData = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    }
    return { success: false, error: 'User not found' };
  } catch (error) {
    console.error('Get user data error:', error);
    return { success: false, error: error.message };
  }
};

export const updateUserData = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Update user data error:', error);
    return { success: false, error: error.message };
  }
};

export const saveGameProgress = async (userId, progressData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const updates = {
      totalPoints: progressData.totalPoints,
      unlockedPhrases: progressData.unlockedPhrases,
      totalZikrTime: progressData.totalZikrTime,
      achievements: progressData.achievements,
      sessionsCompleted: progressData.sessionsCompleted,
      currentStreak: progressData.currentStreak,
      longestStreak: progressData.longestStreak,
      lastPlayedDate: progressData.lastPlayedDate,
      phraseCounts: progressData.phraseCounts,
      dailyPoints: progressData.dailyPoints,
      lastPointsResetDate: progressData.lastPointsResetDate,
      updatedAt: new Date().toISOString()
    };
    
    await updateDoc(userRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Save progress error:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// LEADERBOARD FUNCTIONS
// ==========================================

export const getLeaderboard = async (limitCount = 10) => {
  try {
    const leaderboardQuery = query(
      collection(db, 'users'),
      orderBy('totalPoints', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(leaderboardQuery);
    const leaderboard = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      leaderboard.push({
        userId: doc.id,
        username: data.username,
        totalPoints: data.totalPoints,
        achievements: data.achievements?.length || 0
      });
    });
    
    return { success: true, leaderboard };
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// PHRASE COUNT TRACKING
// ==========================================

export const incrementPhraseCount = async (userId, phraseId, currentCounts) => {
  try {
    const newCount = (currentCounts[phraseId] || 0) + 1;
    const updates = {
      [`phraseCounts.${phraseId}`]: newCount
    };
    
    await updateDoc(doc(db, 'users', userId), updates);
    return { success: true, newCount };
  } catch (error) {
    console.error('Increment phrase count error:', error);
    return { success: false, error: error.message };
  }
};

// ==========================================
// AUTH STATE LISTENER
// ==========================================

export const onAuthStateChange = (callback) => {
  return auth.onAuthStateChanged(callback);
};

export { auth, db };
