import { doc, getDoc, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase-config';

// Get user data
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

// Save game progress
export const saveGameProgress = async (userId, progressData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...progressData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Save progress error:', error);
    return { success: false, error: error.message };
  }
};

// Get leaderboard
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

// Increment phrase count
export const incrementPhraseCount = async (userId, phraseId, currentCount) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`phraseCounts.${phraseId}`]: currentCount + 1
    });
    return { success: true };
  } catch (error) {
    console.error('Increment phrase count error:', error);
    return { success: false, error: error.message };
  }
};
