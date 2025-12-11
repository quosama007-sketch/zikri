import { doc, getDoc, updateDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
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

// Get leaderboard with top 10 + user context
export const getLeaderboard = async (currentUserId = null) => {
  try {
    // Query to get all users, sorted by points
    const leaderboardQuery = query(
      collection(db, 'users'),
      orderBy('totalPoints', 'desc')
    );
    
    const querySnapshot = await getDocs(leaderboardQuery);
    const allUsers = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allUsers.push({
        userId: doc.id,
        username: data.username,
        totalPoints: data.totalPoints || 0,
        achievements: data.achievements?.length || 0,
        currentStreak: data.currentStreak || 0
      });
    });
    
    // Find current user's position
    let userPosition = -1;
    if (currentUserId) {
      userPosition = allUsers.findIndex(user => user.userId === currentUserId);
    }
    
    // Build leaderboard: Top 10 + user context
    let leaderboard = [];
    let userContext = [];
    
    // Always include top 10
    const top10 = allUsers.slice(0, 10);
    leaderboard = top10.map((user, index) => ({
      ...user,
      rank: index + 1,
      isCurrentUser: user.userId === currentUserId
    }));
    
    // If user is not in top 10, add user context (2 above, user, 2 below)
    if (userPosition >= 10) {
      const startIndex = Math.max(10, userPosition - 2); // Don't overlap with top 10
      const endIndex = Math.min(allUsers.length, userPosition + 3); // User + 2 below
      
      userContext = allUsers.slice(startIndex, endIndex).map((user, index) => ({
        ...user,
        rank: startIndex + index + 1,
        isCurrentUser: user.userId === currentUserId
      }));
    }
    
    return { 
      success: true, 
      leaderboard,
      userContext,
      userRank: userPosition >= 0 ? userPosition + 1 : null,
      totalUsers: allUsers.length
    };
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
