# 🔥 FIREBASE INTEGRATION GUIDE

## 📋 **Overview:**

This guide shows how to replace localStorage with Firebase in your Zikr Game.

---

## 🎯 **What Changes:**

### **Before (localStorage):**
- Data saved in browser only
- Lost when cache cleared
- Can't sync across devices
- No real-time updates

### **After (Firebase):**
- Data saved in cloud
- Persistent forever
- Syncs across all devices
- Real-time leaderboard

---

## 📝 **Step-by-Step Integration:**

### **Step 1: Add Firebase Config**

1. Copy `firebase-service.js` to your `src/` folder
2. Open Firebase Console → Project Settings
3. Copy your Firebase config
4. Replace the config in `firebase-service.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIza...", // Your actual key
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ... rest of config
};
```

### **Step 2: Update App.jsx Imports**

At the top of `App.jsx`, add:

```javascript
import { 
  registerUser, 
  loginUser, 
  logoutUser,
  getUserData,
  saveGameProgress,
  getLeaderboard,
  incrementPhraseCount,
  onAuthStateChange 
} from './firebase-service';
```

### **Step 3: Replace Authentication**

**Find the `handleAuth` function and replace with:**

```javascript
const handleAuth = async (username, password, isLogin) => {
  if (!username || !password) {
    alert('Please enter both username and password');
    return;
  }
  
  let result;
  if (isLogin) {
    result = await loginUser(username, password);
  } else {
    result = await registerUser(username, password);
  }
  
  if (result.success) {
    // Load user data from Firebase
    const userData = result.userData || await getUserData(result.userId);
    
    setCurrentUser({
      userId: result.userId,
      username: userData.data?.username || username,
      ...userData.data
    });
    setIsAuthenticated(true);
    setShowAuth(false);
    setTotalPoints(userData.data?.totalPoints || 0);
    
    console.log('✅ Logged in successfully');
  } else {
    alert(result.error || 'Authentication failed');
  }
};
```

### **Step 4: Replace saveProgress Function**

**Find `saveProgress` and update to:**

```javascript
const saveProgress = async (points, additionalTime = 0, sessionAccuracy = 0, sessionPoints = 0) => {
  if (!currentUser || !currentUser.userId) return;
  
  const newTotalTime = (currentUser.totalZikrTime || 0) + additionalTime;
  const newSessionsCompleted = (currentUser.sessionsCompleted || 0) + 1;
  
  // Check achievements (existing code)
  const currentAchievements = currentUser.achievements || [];
  const newAchievements = [...currentAchievements];
  
  ACHIEVEMENTS.forEach(achievement => {
    if (!currentAchievements.includes(achievement.id)) {
      let earned = false;
      
      switch (achievement.requirement.type) {
        case 'sessions':
          earned = newSessionsCompleted >= achievement.requirement.count;
          break;
        case 'phrase_count':
          const phraseCount = (currentUser.phraseCounts || {})[achievement.requirement.phraseId] || 0;
          earned = phraseCount >= achievement.requirement.count;
          console.log(`[ACHIEVEMENT CHECK] ${achievement.name}: phraseId ${achievement.requirement.phraseId} count ${phraseCount} >= ${achievement.requirement.count}? ${earned}`);
          break;
        // ... rest of achievement checks
      }
      
      if (earned) {
        newAchievements.push(achievement.id);
        console.log(`🎉 Achievement unlocked: ${achievement.name}`);
      }
    }
  });
  
  // Prepare data for Firebase
  const progressData = {
    totalPoints: points,
    unlockedPhrases: getUnlockedPhraseIds(points),
    totalZikrTime: newTotalTime,
    achievements: newAchievements,
    sessionsCompleted: newSessionsCompleted,
    currentStreak: currentUser.currentStreak,
    longestStreak: currentUser.longestStreak,
    lastPlayedDate: currentUser.lastPlayedDate,
    phraseCounts: currentUser.phraseCounts || {},
    dailyPoints: currentUser.dailyPoints || 0,
    lastPointsResetDate: currentUser.lastPointsResetDate || new Date().toISOString().split('T')[0]
  };
  
  // Save to Firebase
  const result = await saveGameProgress(currentUser.userId, progressData);
  
  if (result.success) {
    console.log('✅ Progress saved to Firebase');
    setCurrentUser({ ...currentUser, ...progressData });
    return newAchievements.length > currentAchievements.length;
  } else {
    console.error('❌ Failed to save progress:', result.error);
    return false;
  }
};
```

### **Step 5: Update handlePhraseTap**

**In `handlePhraseTap`, update phrase count tracking:**

```javascript
// Track phrase count for achievements
if (currentUser && phraseDataId) {
  const oldCount = (currentUser.phraseCounts || {})[phraseDataId] || 0;
  const newCount = oldCount + 1;
  
  const updatedUser = {
    ...currentUser,
    phraseCounts: {
      ...(currentUser.phraseCounts || {}),
      [phraseDataId]: newCount
    },
    dailyPoints: (currentUser.dailyPoints || 0) + points
  };
  
  console.log(`[PHRASE COUNT] ID ${phraseDataId}: ${oldCount} → ${newCount}`);
  
  // Save to Firebase (non-blocking)
  incrementPhraseCount(currentUser.userId, phraseDataId, currentUser.phraseCounts || {});
  
  setCurrentUser(updatedUser);
}
```

### **Step 6: Update Leaderboard**

**Replace the leaderboard loading:**

```javascript
const loadLeaderboard = async () => {
  const result = await getLeaderboard(10);
  
  if (result.success) {
    setLeaderboardData(result.leaderboard);
  } else {
    console.error('Failed to load leaderboard:', result.error);
  }
};

// Call in useEffect when leaderboard screen opens
useEffect(() => {
  if (screen === 'leaderboard') {
    loadLeaderboard();
  }
}, [screen]);
```

### **Step 7: Add Auth State Listener**

**Add this useEffect to handle auth state:**

```javascript
useEffect(() => {
  const unsubscribe = onAuthStateChange(async (user) => {
    if (user) {
      // User is signed in
      const result = await getUserData(user.uid);
      if (result.success) {
        setCurrentUser({ userId: user.uid, ...result.data });
        setIsAuthenticated(true);
        setTotalPoints(result.data.totalPoints || 0);
      }
    } else {
      // User is signed out
      setCurrentUser(null);
      setIsAuthenticated(false);
      setShowAuth(true);
    }
  });
  
  return () => unsubscribe();
}, []);
```

### **Step 8: Update Logout Function**

```javascript
const handleLogout = async () => {
  const result = await logoutUser();
  if (result.success) {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setShowAuth(true);
    setScreen('menu');
  }
};
```

---

## 🔒 **Firestore Security Rules:**

In Firebase Console → Firestore → Rules, set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Leaderboard is read-only for all authenticated users
    match /users/{userId} {
      allow read: if request.auth != null;
    }
  }
}
```

---

## ✅ **Testing Firebase Integration:**

1. **Test Registration:**
   - Sign up with new username
   - Check Firebase Console → Firestore → users
   - Should see new user document

2. **Test Login:**
   - Login with existing account
   - Should load user data
   - Check console for "✅ Logged in successfully"

3. **Test Game Progress:**
   - Play a game session
   - End game
   - Check Firestore - totalPoints should update

4. **Test Multi-Device:**
   - Login on phone
   - Login on laptop (same account)
   - Play on phone → points update
   - Refresh laptop → should see new points!

5. **Test Achievements:**
   - Complete 1000 taps of Allahu Akbar
   - End game
   - Check console for "[ACHIEVEMENT CHECK]"
   - Check Firestore → achievements array

---

## 📊 **Monitoring:**

Firebase Console shows:
- **Authentication**: Active users
- **Firestore**: Database reads/writes
- **Usage**: Free tier limits (50K reads/day, 20K writes/day)

---

## 🚨 **Common Issues:**

### **Issue: "Permission denied"**
- Check Firestore rules
- Ensure user is authenticated

### **Issue: "Module not found"**
- Run: `npm install firebase`
- Check import paths

### **Issue: "API key invalid"**
- Double-check firebaseConfig
- Copy from Firebase Console

### **Issue: "Data not syncing"**
- Check internet connection
- Check Firebase Console → Firestore for data
- Look for errors in browser console

---

## 💰 **Firebase Pricing:**

**Free Tier (Spark Plan):**
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage
- **Perfect for starting!**

**Paid Tier (Blaze Plan):**
- Pay-as-you-go
- ~$0.06 per 100K reads
- ~$0.18 per 100K writes
- Only pay if you exceed free tier

**Estimate for 100 users:**
- ~1000 writes/day (10 sessions each)
- ~5000 reads/day (profile, leaderboard)
- **Cost: $0 (within free tier!)**

---

## 🎯 **Benefits After Integration:**

1. ✅ **Multi-device sync** - Play on phone, continue on laptop
2. ✅ **Data persistence** - Never lose progress
3. ✅ **Real leaderboard** - Compete with friends
4. ✅ **Backup** - Firebase keeps your data safe
5. ✅ **Scalability** - Handles 1000s of users

---

## 📥 **Files Created:**

- `firebase-service.js` - All Firebase functions
- This integration guide

**Next steps:**
1. Add firebase-service.js to your src/ folder
2. Update firebase config
3. Follow integration steps above
4. Test thoroughly
5. Deploy to Vercel!

---

**Questions? Check Firebase docs: https://firebase.google.com/docs**
