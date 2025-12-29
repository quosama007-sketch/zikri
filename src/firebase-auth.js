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
    
    console.log('[SIGNUP] Creating account for username:', username);
    console.log('[SIGNUP] Internal email:', email);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('[SIGNUP] Firebase Auth user created:', user.uid);
    
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
    
    console.log('[SIGNUP] Firestore user document created');
    
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
    console.log('[LOGIN] Attempting login for username:', username);
    
    // Find user by username (case-sensitive)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('[LOGIN] ❌ Username not found in Firestore:', username);
      return { 
        success: false, 
        error: `Username "${username}" not found.\n\nPlease check:\n• Username is spelled correctly\n• Username is case-sensitive (${username} ≠ ${username.toLowerCase()})\n• You have signed up first\n\nNeed an account? Click "First time user? Sign Up Here!"` 
      };
    }
    
    console.log('[LOGIN] ✓ Username found in Firestore');
    
    // Get the user's internal email
    const userDoc = querySnapshot.docs[0];
    const email = `${username.toLowerCase().replace(/[^a-z0-9]/g, '')}@zikrapp.internal`;
    
    console.log('[LOGIN] Constructed internal email:', email);
    console.log('[LOGIN] Attempting Firebase Auth signin...');
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('[LOGIN] ✓ Firebase Auth successful');
    
    // Get user data
    const userData = userDoc.data();
    
    console.log('[LOGIN] ✓ Login successful for:', username);
    
    return { 
      success: true, 
      userId: user.uid,
      userData: userData 
    };
  } catch (error) {
    console.error('[LOGIN] ❌ Login error:', error);
    console.error('[LOGIN] Error code:', error.code);
    console.error('[LOGIN] Error message:', error.message);
    
    if (error.code === 'auth/wrong-password') {
      return { 
        success: false, 
        error: `Incorrect password for username "${username}".\n\nPlease check your password and try again.` 
      };
    }
    if (error.code === 'auth/invalid-credential') {
      return { 
        success: false, 
        error: `Invalid credentials.\n\nPossible issues:\n• Wrong password\n• Account created with old system (not compatible)\n\nTry signing up again with "First time user? Sign Up Here!"` 
      };
    }
    if (error.code === 'auth/user-not-found') {
      return { 
        success: false, 
        error: `Account not found in Firebase Auth.\n\nPlease sign up first:\nClick "First time user? Sign Up Here!"` 
      };
    }
    
    return { 
      success: false, 
      error: `Login failed: ${error.message}\n\nIf you're a new user, click "First time user? Sign Up Here!"` 
    };
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
