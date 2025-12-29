import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase-config';

// Register new user with USERNAME (case-sensitive)
export const registerUser = async (username, password) => {
  try {
    // Check if username already exists (case-sensitive)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: `Username "${username}" already exists. Please choose a different username.` };
    }
    
    // Create unique email from username for Firebase Auth
    // This ensures each username maps to a unique Firebase auth account
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@zikrapp.internal`;
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document with ACTUAL username (case-sensitive)
    await setDoc(doc(db, 'users', user.uid), {
      username: username, // CASE-SENSITIVE username
      email: null, // No email for users
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
      return { success: false, error: 'Username already exists. Please choose a different username.' };
    }
    if (error.code === 'auth/weak-password') {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    return { success: false, error: error.message };
  }
};

// Login user with USERNAME (case-sensitive)
export const loginUser = async (username, password) => {
  try {
    // Find user by username (case-sensitive)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { success: false, error: 'Invalid username or password' };
    }
    
    // Get the user's internal email
    const userDoc = querySnapshot.docs[0];
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@zikrapp.internal`;
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data
    const userData = userDoc.data();
    
    return { 
      success: true, 
      userId: user.uid,
      userData: userData 
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      return { success: false, error: 'Invalid username or password' };
    }
    return { success: false, error: 'Invalid username or password' };
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
