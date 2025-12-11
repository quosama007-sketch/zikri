import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
