import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase-config';

// Register new user
export const registerUser = async (username, password) => {
  try {
    const email = `${username.toLowerCase()}@zikrgame.app`;
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document
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

// Login user
export const loginUser = async (username, password) => {
  try {
    const email = `${username.toLowerCase()}@zikrgame.app`;
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (userDoc.exists()) {
      return { 
        success: true, 
        userId: user.uid,
        userData: userDoc.data() 
      };
    }
    return { success: false, error: 'User data not found' };
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return { success: false, error: 'Invalid username or password' };
    }
    return { success: false, error: error.message };
  }
};

// Logout
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Sign in anonymously as guest
export const signInAsGuest = async (username) => {
  try {
    const userCredential = await signInAnonymously(auth);
    const user = userCredential.user;
    
    // Create user document for guest
    await setDoc(doc(db, 'users', user.uid), {
      username: username,
      email: null,
      isAnonymous: true,
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
      createdAt: new Date().toISOString()
    });
    
    return { 
      success: true, 
      userId: user.uid, 
      username,
      isAnonymous: true 
    };
  } catch (error) {
    console.error('Guest sign-in error:', error);
    return { success: false, error: error.message };
  }
};

// Upgrade anonymous account to email account
export const upgradeAnonymousAccount = async (email, password) => {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.isAnonymous) {
      return { success: false, error: 'Not a guest account' };
    }
    
    // Create credential
    const credential = EmailAuthProvider.credential(email, password);
    
    // Link anonymous account with email
    const userCredential = await linkWithCredential(user, credential);
    
    // Update user document
    await updateDoc(doc(db, 'users', user.uid), {
      email: email,
      isAnonymous: false,
      upgradedAt: new Date().toISOString()
    });
    
    return { 
      success: true, 
      userId: userCredential.user.uid,
      message: 'Account upgraded successfully!'
    };
  } catch (error) {
    console.error('Account upgrade error:', error);
    if (error.code === 'auth/email-already-in-use') {
      return { success: false, error: 'This email is already registered. Please use a different email.' };
    }
    return { success: false, error: error.message };
  }
};
