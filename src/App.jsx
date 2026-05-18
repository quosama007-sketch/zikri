import React, { useState, useEffect, useRef } from "react";
import {
  Trophy,
  Pause,
  Play,
  Lock,
  Unlock,
  LogOut,
  User,
  Sparkles,
  Star,
  Flame,
  Target,
  Zap,
  Crown,
  Medal,
  Users,
  Circle,
  Shield,
  Calendar,
  Bell,
  Share2,
  Download,
  ExternalLink,
} from "lucide-react";
import {
  ZIKR_PHRASES,
  NAMES_OF_ALLAH,
  ACHIEVEMENTS,
  ZIKR_FACTS,
  getPhraseColor,
} from "./constants";
import {
  getUnlockedPhraseIds,
  getUnlockedAsmaIds,
  getBackgroundIndex,
  getSpeed,
  calculateFreezeTokens,
  createParticleBurst,
  createFireworks,
  createTapEffect,
  checkAllAchievements,
  checkTokenEarning,
  updateDailyStats,
  getAchievementById,
} from "./services/game";
import {
  validateCredentials,
  getFriendlyErrorMessage,
  formatNumber,
  calculatePercentage,
  debounce,
} from "./services/utilities";

// Firebase imports
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase-config";
import { registerUser, loginUser, logoutUser } from "./firebase-auth";
import {
  getUserData,
  saveGameProgress,
  getLeaderboard,
  incrementPhraseCount,
} from "./firebase-data";

// Notification imports
import { DEFAULT_NOTIFICATION_SETTINGS } from "./notifications-config";
import {
  requestNotificationPermission,
  initializeNotifications,
  sendAchievementNotification,
  sendTestNotification,
  getNotificationPermission,
} from "./notification-service";

// Virtue imports
import {
  VIRTUE_ONE_LINERS,
  getRandomVirtue,
  shouldUnlockVirtue,
  getUnlockedVirtues,
} from "./virtues-config";

// Sharing imports
import {
  generateSharingCard,
  shareToSocial,
  downloadImage,
  getShareData,
} from "./sharing-service";
// Custom CSS for badge animations
const badgeStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes glow-pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }
  
  .animate-shimmer {
    animation: shimmer 3s infinite;
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .animate-glow-pulse {
    animation: glow-pulse 2s ease-in-out infinite;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = badgeStyles;
  document.head.appendChild(styleSheet);
}

const ZikrGame = () => {
  // ============================================================
  // ZIKRI APP — STATE VARIABLES
  // Organized for Flutter migration | See FLUTTER_ARCHITECTURE_PLAN.md
  // ============================================================

  // ============================================================
  // 1. AUTH STATE
  // Flutter → lib/providers/auth_provider.dart
  // Flutter screens → login_screen.dart | register_screen.dart
  // ============================================================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState(""); // form field only — not persisted
  const [password, setPassword] = useState(""); // form field only — never stored
  const [currentUser, setCurrentUser] = useState(null); // full user object from Firebase
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null=unchecked | true=available | false=taken
  const [checkingUsername, setCheckingUsername] = useState(false);

  // ============================================================
  // 2. NAVIGATION STATE
  // Flutter → MaterialApp routes | bottom nav index
  // ============================================================
  const [screen, setScreen] = useState("menu"); // menu | game | stats | profile | leaderboard | achievements | mode-select | tasbih-setup

  // ============================================================
  // 3. CORE GAME STATE
  // Flutter → lib/providers/game_provider.dart
  // Flutter screen → game_screen.dart
  // ============================================================
  const [gameMode, setGameMode] = useState("focus"); // focus | names | arcade | tasbih
  const [totalPoints, setTotalPoints] = useState(0); // persisted to Firebase
  const [sessionScore, setSessionScore] = useState(0); // current session (Focus mode)
  const [asmaSessionScore, setAsmaSessionScore] = useState(0); // current session (Names mode)
  const [tasbihSessionScore, setTasbihSessionScore] = useState(0); // current session (Tasbih mode)
  const [lives, setLives] = useState(5);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [bismillahCount, setBismillahCount] = useState(0); // total Bismillah spawns
  const [bismillahHelpCount, setBismillahHelpCount] = useState(0); // "help" spawns after misses
  const [phrases, setPhrases] = useState([]); // active falling phrases on screen
  const [isPaused, setIsPaused] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [newlyUnlockedPhrases, setNewlyUnlockedPhrases] = useState({}); // { phraseId: appearCount }
  const [newlyUnlockedAsmaNames, setNewlyUnlockedAsmaNames] = useState({}); // { asmaId: appearCount }
  const [totalPhrasesAppeared, setTotalPhrasesAppeared] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    totalTaps: 0,
    missedPhrases: 0,
    accuracy: 0,
    duration: 0,
  });

  // ============================================================
  // 4. SESSION TRACKING
  // Flutter → part of game_provider.dart
  // ============================================================
  const [sessionStartAsmaCount, setSessionStartAsmaCount] = useState(0); // Asma names unlocked at session start
  const [tasbihCompleted, setTasbihCompleted] = useState(false); // Did user hit Tasbih goal this session?

  // ============================================================
  // 5. TASBIH MODE STATE
  // Flutter → lib/providers/tasbih_provider.dart
  // Flutter screen → tasbih_screen.dart | tasbih_setup_screen.dart
  // ============================================================
  const [tasbihSelectedPhrase, setTasbihSelectedPhrase] = useState(null);
  const [tasbihTargetCount, setTasbihTargetCount] = useState(100);
  const [tasbihCurrentCount, setTasbihCurrentCount] = useState(0);
  const [tasbihTotalCounts, setTasbihTotalCounts] = useState({}); // { phraseId: totalCount } — persisted to Firebase

  // ============================================================
  // 6. ASMA UL HUSNA STATE
  // Flutter → part of game_provider.dart
  // Unlock logic: every 33 taps unlocks next name
  // ============================================================
  const [asmaTotalTaps, setAsmaTotalTaps] = useState(0); // cumulative taps across all sessions — persisted

  // ============================================================
  // 7. BACKGROUND & VISUAL STATE
  // Flutter → lib/providers/theme_provider.dart
  // ============================================================
  const [showBackgroundChange, setShowBackgroundChange] = useState(false);
  const [backgroundMessage, setBackgroundMessage] = useState("");
  const lastBackgroundRef = useRef(null); // ref — tracks last background to avoid repeat
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(1);
  const [darkMode, setDarkMode] = useState(false); // persisted to Firebase

  // ============================================================
  // 8. USER PROFILE & PREFERENCES
  // Flutter → lib/providers/user_provider.dart
  // Flutter screen → profile_screen.dart | settings_screen.dart
  // All fields persisted to Firebase
  // ============================================================
  const [userDisplayName, setUserDisplayName] = useState(""); // editable display name
  const [userGender, setUserGender] = useState(""); // 'male' | 'female' | ''
  const [profileAvatar, setProfileAvatar] = useState("dove"); // selected animal avatar
  const [leaderboardVisible, setLeaderboardVisible] = useState(true); // opt-out of leaderboard
  const [phraseSpeed, setPhraseSpeed] = useState(2); // 1=Slow | 2=Medium | 3=Fast

  // ============================================================
  // 9. NOTIFICATION STATE
  // Flutter → lib/services/notification_service.dart
  // ============================================================
  const [notificationSettings, setNotificationSettings] = useState(
    DEFAULT_NOTIFICATION_SETTINGS,
  ); // persisted to Firebase
  const [notificationPermission, setNotificationPermission] =
    useState("default"); // 'default' | 'granted' | 'denied'

  // ============================================================
  // 10. AUDIO STATE
  // Flutter → lib/services/audio_service.dart
  // Background music + sound effects + phrase audio are 3 separate systems
  // ============================================================
  // Background music
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef(null);
  const nextAudioRef = useRef(null); // preloading next track
  const isFadingRef = useRef(false); // prevents fade overlap

  // Sound effects
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const soundRefs = useRef({
    tapSuccess: null,
    phraseMiss: null,
    phraseUnlock: null,
    completion: null,
  });
  const soundVolumes = {
    tapSuccess: 0.6,
    phraseMiss: 0.4,
    phraseUnlock: 0.8,
    completion: 0.9,
  };

  // Phrase audio (zikr_1.mp3 → zikr_27.mp3)
  const [phraseAudioEnabled, setPhraseAudioEnabled] = useState(true);
  const [phraseAudioVolume, setPhraseAudioVolume] = useState(0.7); // 70% default
  const [phraseAudioLoaded, setPhraseAudioLoaded] = useState(false);
  const phraseAudioRefs = useRef({}); // { 1: AudioObject, 2: AudioObject, ... }

  // ============================================================
  // 11. STREAK & FREEZE TOKEN STATE
  // Flutter → lib/providers/streak_provider.dart
  // Logic: 1 token per 30,000 total points; tokens protect missed days
  // ============================================================
  const [showTokenEarned, setShowTokenEarned] = useState(false);
  const [showTokenUsed, setShowTokenUsed] = useState(false);
  const [tokenUsedMessage, setTokenUsedMessage] = useState("");
  const [showFreezeCalendar, setShowFreezeCalendar] = useState(false);
  const [selectedFreezeDates, setSelectedFreezeDates] = useState([]);

  // Streak shield notification popup
  const [showStreakShieldUsed, setShowStreakShieldUsed] = useState(false);
  const [shieldUsageInfo, setShieldUsageInfo] = useState({
    oldCount: 0,
    newCount: 0,
  });

  // ============================================================
  // 12. ACHIEVEMENT STATE
  // Flutter → lib/providers/achievement_provider.dart
  // Flutter screen → achievements_screen.dart
  // ============================================================
  const [showAchievementUnlocked, setShowAchievementUnlocked] = useState(false);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState([]);

  // ============================================================
  // 13. VIRTUE ONE-LINERS SYSTEM
  // Flutter → part of game_provider.dart (triggered on phrase tap milestones)
  // ============================================================
  const [showVirtuePopup, setShowVirtuePopup] = useState(false);
  const [currentVirtue, setCurrentVirtue] = useState(null);
  const [unlockedVirtues, setUnlockedVirtues] = useState([]);
  const [phraseTapCounts, setPhraseTapCounts] = useState({}); // { phraseId: count } — persisted to Firebase

  // ============================================================
  // 14. ZIKR FACTS SYSTEM
  // Flutter → widget shown between sessions or on phrase unlock
  // ============================================================
  const [currentZikrFact, setCurrentZikrFact] = useState(null);

  // ============================================================
  // 15. SOCIAL SHARING STATE
  // Flutter → lib/services/sharing_service.dart
  // Flutter screen → share_modal.dart
  // ============================================================
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [sharingCardUrl, setSharingCardUrl] = useState(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);

  // ============================================================
  // 16. LEADERBOARD STATE
  // Flutter → lib/providers/leaderboard_provider.dart
  // Flutter screen → leaderboard_screen.dart
  // ============================================================
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardUserContext, setLeaderboardUserContext] = useState([]); // user's surrounding rows

  // ============================================================
  // 17. CALENDAR ACTIVITY TRACKER STATE
  // Flutter → lib/screens/stats_screen.dart
  // ============================================================
  const [calendarMetric, setCalendarMetric] = useState("taps"); // 'taps' | 'points' | 'time'
  const [calendarView, setCalendarView] = useState("week"); // 'day' | 'week' | 'month' | 'year'
  const [selectedDate, setSelectedDate] = useState(new Date());

  // ============================================================
  // 18. PWA INSTALL STATE
  // Flutter → N/A (native app handles install natively)
  // ============================================================
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // ============================================================
  // 19. PERFORMANCE REFS (no Flutter equivalent — React-specific)
  // These are refs that mirror state for synchronous access in
  // async game loop callbacks. Flutter uses streams/notifiers instead.
  // ============================================================
  const gameLoopRef = useRef(null); // setTimeout/setInterval handle
  const nextPhraseIdRef = useRef(0); // auto-increment ID for falling phrases
  const gameStartTimeRef = useRef(null); // mirrors gameStartTime for loop access
  const previouslyUnlockedRef = useRef(new Set([1, 2, 3, 4])); // phrases unlocked before this session
  const sessionScoreRef = useRef(0); // mirrors sessionScore for real-time loop access
  const tasbihCurrentCountRef = useRef(0); // mirrors tasbihCurrentCount for real-time loop access
  const gameModeRef = useRef("focus"); // mirrors gameMode for immediate updates in loop
  const bismillahCountRef = useRef(0); // mirrors bismillahCount for immediate loop access
  const asmaTotalTapsRef = useRef(0); // mirrors asmaTotalTaps — prevents state timing issues
  // Load user data from localStorage
  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const result = await getUserData(user.uid);
        if (result.success) {
          setCurrentUser({ userId: user.uid, ...result.data });
          setIsAuthenticated(true);
          setTotalPoints(result.data.totalPoints || 0);
          setAsmaTotalTaps(result.data.asmaTotalTaps || 0); // Load Asma taps
          asmaTotalTapsRef.current = result.data.asmaTotalTaps || 0; // ✅ BUG FIX: Also set ref for immediate access
          setTasbihTotalCounts(result.data.tasbihTotalCounts || {}); // Load Tasbih counts
          // Load profile preferences
          setProfileAvatar(result.data.profileAvatar || "dove"); // Default to dove
          setPhraseSpeed(result.data.phraseSpeed || 2); // Default to Medium
          setUserGender(result.data.userGender || ""); // Default to empty
          setLeaderboardVisible(
            result.data.leaderboardVisible !== undefined
              ? result.data.leaderboardVisible
              : true,
          ); // Default to visible
          setDarkMode(result.data.darkMode || false); // Default to light mode
          setNotificationSettings(
            result.data.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS,
          ); // Load notification settings
          setPhraseTapCounts(result.data.phraseTapCounts || {}); // Load phrase tap counts for virtues
          setShowAuth(false);

          // Update daily streak - pass user data directly instead of waiting for state
          console.log("[APP LOAD] Updating daily streak after user login");
          const userData = { userId: user.uid, ...result.data };
          updateDailyStreak(userData);

          // *** FIX: One-time check for missing streak achievements ***
          setTimeout(async () => {
            const currentAchievements = result.data.achievements || [];
            const currentStreak = result.data.currentStreak || 0;
            const newAchievements = [...currentAchievements];
            let achievementAdded = false;

            console.log(
              "[ACHIEVEMENT CATCHUP] Checking for missing streak achievements...",
            );
            console.log("[ACHIEVEMENT CATCHUP] Current streak:", currentStreak);
            console.log(
              "[ACHIEVEMENT CATCHUP] Current achievements:",
              currentAchievements,
            );

            ACHIEVEMENTS.forEach((achievement) => {
              if (
                !currentAchievements.includes(achievement.id) &&
                achievement.requirement.type === "streak"
              ) {
                const earned = currentStreak >= achievement.requirement.count;

                if (earned) {
                  newAchievements.push(achievement.id);
                  achievementAdded = true;
                  console.log(
                    `🎉 [ACHIEVEMENT CATCHUP] Awarding missing achievement: ${achievement.name} (${currentStreak} days >= ${achievement.requirement.count} required)`,
                  );

                  // Show achievement notification
                  setTimeout(() => {
                    setNewAchievement({
                      name: achievement.name,
                      description: achievement.description,
                      icon: achievement.icon,
                    });
                    setShowAchievement(true);
                  }, 1000);
                }
              }
            });

            // Update achievements in database if any were added
            if (achievementAdded) {
              try {
                await saveGameProgress(user.uid, {
                  achievements: newAchievements,
                });

                // Update local state
                setCurrentUser((prev) => ({
                  ...prev,
                  achievements: newAchievements,
                }));

                console.log(
                  "[ACHIEVEMENT CATCHUP] Updated missing achievements in database",
                );
              } catch (error) {
                console.error("[ACHIEVEMENT CATCHUP] Error saving:", error);
              }
            } else {
              console.log(
                "[ACHIEVEMENT CATCHUP] No missing achievements found",
              );
            }
          }, 2000); // Wait 2 seconds after login to check
          // *** END FIX ***
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setIsAuthenticated(false);
        setShowAuth(true);
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Save profile preferences whenever they change
  useEffect(() => {
    const saveProfilePreferences = async () => {
      if (!currentUser || !currentUser.userId) return;

      const preferences = {
        profileAvatar,
        phraseSpeed,
        userGender,
        leaderboardVisible,
        darkMode,
        notificationSettings,
        phraseTapCounts,
      };

      const result = await saveGameProgress(currentUser.userId, preferences);
      if (result.success) {
        console.log("✅ Profile preferences saved");
      }
    };

    // Only save if user is authenticated (avoid saving on initial load)
    if (currentUser && currentUser.userId) {
      saveProfilePreferences();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profileAvatar,
    phraseSpeed,
    userGender,
    leaderboardVisible,
    darkMode,
    notificationSettings,
  ]); // currentUser and saveGameProgress intentionally omitted

  // Apply dark mode to HTML root element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  // Initialize notifications when user logs in and settings are enabled
  useEffect(() => {
    const initNotifications = async () => {
      if (!currentUser || !notificationSettings.enabled) return;

      // Check current permission status
      const permission = getNotificationPermission();
      setNotificationPermission(permission);

      // Initialize notification system if permitted
      if (permission === "granted") {
        await initializeNotifications(notificationSettings, currentUser);
        console.log("✅ Notifications initialized");
      }
    };

    if (currentUser) {
      initNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, notificationSettings.enabled]); // Initialize when user logs in or settings change

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show install button
      setShowInstallPrompt(true);
      console.log("✅ PWA install prompt available");
    };

    const handleAppInstalled = () => {
      // Hide the install button
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log("✅ PWA installed successfully");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Sync totalPoints when currentUser updates
  useEffect(() => {
    if (currentUser && currentUser.totalPoints !== undefined) {
      setTotalPoints(currentUser.totalPoints);
    }
  }, [currentUser]);

  // Auth functions
  const handleAuth = async () => {
    const validation = validateCredentials(username, password, isSignUp);

    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    let result;
    if (isSignUp) {
      result = await registerUser(username, password); // Case-sensitive username
    } else {
      result = await loginUser(username, password); // Case-sensitive username
    }

    if (result.success) {
      // ✅ DATA PROTECTION FIX: Check and link orphaned data
      let userData = result.userData || (await getUserData(result.userId)).data;

      // If no data found, check for orphaned data by username
      if (!userData || Object.keys(userData).length === 0) {
        console.log(
          "[DATA PROTECTION] No data found for userId, checking for orphaned data...",
        );

        try {
          // Search for data with matching username
          const usersRef = collection(db, "users");
          const q = query(usersRef, where("username", "==", username));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            console.log(
              "[DATA PROTECTION] ✅ Found orphaned data! Linking to current auth...",
            );

            // Get the orphaned data
            const orphanedDoc = querySnapshot.docs[0];
            const orphanedData = orphanedDoc.data();
            const oldUserId = orphanedDoc.id;

            // Copy data to correct userId
            await setDoc(doc(db, "users", result.userId), {
              ...orphanedData,
              userId: result.userId, // Update to new userId
              lastLoginDate: new Date(),
              dataRecovered: true,
              previousUserId: oldUserId,
            });

            // Delete old document
            if (oldUserId !== result.userId) {
              await deleteDoc(doc(db, "users", oldUserId));
            }

            // Reload userData
            userData = (await getUserData(result.userId)).data;

            console.log("[DATA PROTECTION] ✅ Data successfully linked!");
          } else {
            console.log(
              "[DATA PROTECTION] No orphaned data found, user will start fresh",
            );
          }
        } catch (error) {
          console.error(
            "[DATA PROTECTION] Error checking for orphaned data:",
            error,
          );
          // Continue anyway - user will start fresh
        }
      }

      setCurrentUser({
        userId: result.userId,
        username: userData?.username || username,
        ...userData,
      });
      setIsAuthenticated(true);
      setShowAuth(false);
      setTotalPoints(userData?.totalPoints || 0);
      setUsername(""); // Clear username
      setPassword(""); // Clear password
      setUsernameAvailable(null); // Reset check

      console.log("✅ Logged in successfully");
    } else {
      // Convert Firebase error codes to friendly messages
      const friendlyError = getFriendlyErrorMessage(result.error, username);
      alert(friendlyError);
    }
  };

  // Convert Firebase error codes to user-friendly messages

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setShowAuth(true);
      setScreen("menu");
    }
  };

  // Check username availability (real-time)
  const checkUsernameAvailability = async (usernameToCheck) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);

    try {
      // Query Firestore to check if username exists (case-sensitive)
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", usernameToCheck));
      const querySnapshot = await getDocs(q);

      setUsernameAvailable(querySnapshot.empty); // true if available, false if taken
    } catch (error) {
      console.error("Error checking username:", error);
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Load leaderboard from Firebase
  const loadLeaderboard = async () => {
    const result = await getLeaderboard(currentUser?.userId || null);
    if (result.success) {
      setLeaderboardData(result.leaderboard);
      setLeaderboardUserContext(result.userContext || []);
    } else {
      console.error("Failed to load leaderboard:", result.error);
    }
  };

  // Load leaderboard when screen changes
  useEffect(() => {
    if (screen === "leaderboard" && isAuthenticated) {
      loadLeaderboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, isAuthenticated]); // loadLeaderboard intentionally omitted

  // ===== STREAK FREEZE TOKEN SYSTEM =====

  // Activate manual freeze for selected dates
  const activateManualFreeze = async (dates) => {
    if (!currentUser || !currentUser.userId) return;

    const availableTokens = calculateFreezeTokens(currentUser.totalPoints || 0);
    const usedTokens = (currentUser.activeFreezes || []).length;
    const remainingTokens = availableTokens - usedTokens;

    if (dates.length > remainingTokens) {
      alert(`Not enough tokens! You have ${remainingTokens} tokens available.`);
      return;
    }

    // Add dates to active freezes
    const currentFreezes = currentUser.activeFreezes || [];
    const newFreezes = [...currentFreezes, ...dates];

    try {
      await saveGameProgress(currentUser.userId, {
        activeFreezes: newFreezes,
      });

      setCurrentUser((prev) => ({
        ...prev,
        activeFreezes: newFreezes,
      }));

      console.log("[FREEZE] Manual freeze activated for:", dates);
      setShowFreezeCalendar(false);
      setSelectedFreezeDates([]);

      alert(`Streak freeze activated for ${dates.length} day(s)!`);
    } catch (error) {
      console.error("[FREEZE] Error activating freeze:", error);
    }
  };

  // ===== END STREAK FREEZE TOKEN SYSTEM =====

  // ===== DAILY STREAK SYSTEM (Calendar-based) =====

  // Update daily streak (called when game starts)
  const updateDailyStreak = async (userData = null) => {
    // Use provided userData or fall back to currentUser state
    const user = userData || currentUser;

    console.log(
      "[STREAK UPDATE] Function called. User data:",
      user ? "exists" : "null",
    );
    if (!user || !user.userId) {
      console.log("[STREAK UPDATE] No user data, returning early");
      return;
    }

    console.log("[STREAK UPDATE] Current streak:", user.currentStreak);
    console.log("[STREAK UPDATE] Last played:", user.lastPlayedDate);

    const now = new Date();
    const todayDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ); // Today at midnight

    const lastPlayed = user.lastPlayedDate
      ? new Date(user.lastPlayedDate)
      : null;
    const lastPlayedDate = lastPlayed
      ? new Date(
          lastPlayed.getFullYear(),
          lastPlayed.getMonth(),
          lastPlayed.getDate(),
        )
      : null;

    let newStreak = user.currentStreak || 0;
    let newLongestStreak = user.longestStreak || 0;

    console.log("[STREAK UPDATE] Today:", todayDate.toISOString());
    console.log(
      "[STREAK UPDATE] Last played date:",
      lastPlayedDate ? lastPlayedDate.toISOString() : "never",
    );

    if (!lastPlayedDate) {
      // First time playing ever
      newStreak = 1;
      console.log("[STREAK] First play ever - streak set to 1");
    } else {
      // Calculate days between last played and today
      const daysDifference = Math.floor(
        (todayDate - lastPlayedDate) / (1000 * 60 * 60 * 24),
      );

      console.log("[STREAK] Days since last play:", daysDifference);

      if (daysDifference === 0) {
        // Already played today - keep streak
        console.log(
          "[STREAK] Already played today - maintaining streak:",
          newStreak,
        );
        return; // Don't update database, just return
      } else if (daysDifference === 1) {
        // Played yesterday - increment streak
        newStreak += 1;
        console.log(
          "[STREAK] Consecutive day - streak incremented to:",
          newStreak,
        );
      } else {
        // Missed 1+ days - check for freeze tokens or active freezes
        const missedDays = daysDifference - 1;
        console.log(
          "[STREAK] Missed",
          missedDays,
          "days - checking for freeze tokens...",
        );

        // Check if missed days have active freezes or can use tokens
        let canProtectStreak = false;
        const activeFreezes = user.activeFreezes || [];
        const availableTokens = calculateFreezeTokens(user.totalPoints || 0);
        const usedTokens = activeFreezes.length;
        const remainingTokens = availableTokens - usedTokens;

        // Check if all missed days are covered by active freezes
        const allMissedDaysFrozen = Array.from(
          { length: missedDays },
          (_, i) => {
            const missedDate = new Date(lastPlayedDate);
            missedDate.setDate(missedDate.getDate() + i + 1);
            const dateString = missedDate.toISOString().split("T")[0];
            return activeFreezes.includes(dateString);
          },
        ).every(Boolean);

        if (allMissedDaysFrozen) {
          // All missed days were manually frozen
          newStreak += 1;
          canProtectStreak = true;
          console.log("[FREEZE] All missed days covered by manual freezes");
        } else if (missedDays <= remainingTokens) {
          // Auto-use tokens to protect streak
          const newFreezes = [...activeFreezes];

          // Add missed days to active freezes (auto-use tokens)
          for (let i = 0; i < missedDays; i++) {
            const missedDate = new Date(lastPlayedDate);
            missedDate.setDate(missedDate.getDate() + i + 1);
            const dateString = missedDate.toISOString().split("T")[0];
            if (!newFreezes.includes(dateString)) {
              newFreezes.push(dateString);
            }
          }

          // Update active freezes locally (will be saved to DB below)
          const updatedUser = { ...user, activeFreezes: newFreezes };

          // Continue streak
          newStreak += 1;
          canProtectStreak = true;

          console.log(
            `[FREEZE] Auto-used ${missedDays} token(s) to protect streak`,
          );

          // Show detailed notification with shield count
          const oldShieldCount = remainingTokens;
          const newShieldCount = remainingTokens - missedDays;

          setShieldUsageInfo({
            oldCount: oldShieldCount,
            newCount: newShieldCount,
          });
          setTokenUsedMessage(
            `🛡️ Streak Shield Used!\n\nYou missed ${missedDays} day(s) but your ${newStreak - 1}-day streak is protected!\n\nShields: ${oldShieldCount} → ${newShieldCount}\n\nKeep your streak alive! 🔥`,
          );
          setShowStreakShieldUsed(true);
          setShowTokenUsed(true);
        } else {
          // Not enough tokens - streak breaks
          newStreak = 1;
          console.log("[FREEZE] Not enough tokens - streak reset to 1");

          // Show message about no tokens
          if (remainingTokens === 0) {
            setTokenUsedMessage(
              `You missed ${missedDays} day(s)!\nNo streak freezes available.\nStreak reset to 1.\nKeep playing to earn tokens!\n(Every 30,000 total points = 1 token)`,
            );
          } else {
            setTokenUsedMessage(
              `You missed ${missedDays} day(s)!\nOnly ${remainingTokens} token(s) available.\nStreak reset to 1.\nKeep playing to earn more tokens!`,
            );
          }
          setShowTokenUsed(true);
        }

        // Update active freezes in database if tokens were used
        if (canProtectStreak) {
          try {
            await saveGameProgress(user.userId, {
              activeFreezes: newFreezes,
            });
          } catch (error) {
            console.error("[FREEZE] Error updating active freezes:", error);
          }
        }
      }
    }

    // Update longest streak if current is higher
    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
      console.log("[STREAK] New longest streak!", newLongestStreak);
    }

    // Update in Firebase
    try {
      await saveGameProgress(user.userId, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastPlayedDate: now.toISOString(),
      });

      // Update local state
      setCurrentUser((prev) => {
        console.log(
          "[STREAK] Updating local state - old streak:",
          prev?.currentStreak,
          "→ new:",
          newStreak,
        );
        return {
          ...prev,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastPlayedDate: now.toISOString(),
        };
      });

      console.log("[STREAK] Updated in database:", {
        newStreak,
        newLongestStreak,
      });

      // *** FIX: Check for streak achievements after streak update ***
      const currentAchievements = user.achievements || [];
      const newAchievements = [...currentAchievements];
      let achievementUnlocked = false;

      ACHIEVEMENTS.forEach((achievement) => {
        if (
          !currentAchievements.includes(achievement.id) &&
          achievement.requirement.type === "streak"
        ) {
          const earned = newStreak >= achievement.requirement.count;

          if (earned) {
            newAchievements.push(achievement.id);
            achievementUnlocked = true;
            console.log(
              `🎉 [STREAK ACHIEVEMENT] Unlocked: ${achievement.name} (${newStreak} days streak)`,
            );

            // Show achievement notification
            setTimeout(() => {
              setNewAchievement({
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
              });
              setShowAchievement(true);
            }, 500);
          }
        }
      });

      // Update achievements in database if any were unlocked
      if (achievementUnlocked) {
        try {
          await saveGameProgress(user.userId, {
            achievements: newAchievements,
          });

          // Update local state with new achievements
          setCurrentUser((prev) => ({
            ...prev,
            achievements: newAchievements,
          }));

          console.log(
            "[STREAK ACHIEVEMENT] Updated in database:",
            newAchievements,
          );
        } catch (error) {
          console.error("[STREAK ACHIEVEMENT] Error saving:", error);
        }
      }
      // *** END FIX ***
    } catch (error) {
      console.error("[STREAK] Error updating streak:", error);
    }
  };

  // ===== END DAILY STREAK SYSTEM =====

  // Save user progress
  const saveProgress = async (
    points,
    additionalTime = 0,
    sessionAccuracy = 0,
    sessionPoints = 0,
  ) => {
    if (!currentUser || !currentUser.userId) return false;

    const newTotalTime = (currentUser.totalZikrTime || 0) + additionalTime;
    const newSessionsCompleted = (currentUser.sessionsCompleted || 0) + 1;

    // Use current streak (already updated by updateDailyStreak when game started)
    const newStreak = currentUser.currentStreak || 0;
    const newLongestStreak = currentUser.longestStreak || 0;

    // Track total points and check for token earning
    // 'points' parameter is the NEW total points (already calculated in endGame)
    // 'sessionPoints' is just the points earned this session
    const previousTotalPoints = currentUser.totalPoints || 0;
    const newTotalPoints = points; // Use the passed parameter directly!

    // Check if user earned new token (crossed 30K threshold)
    const tokenResult = checkTokenEarning(
      previousTotalPoints,
      newTotalPoints,
      calculateFreezeTokens,
    );

    if (tokenResult.earned) {
      // Show celebration notification
      setTimeout(() => {
        setShowTokenEarned(true);
      }, 1000);
    }

    // Check for new achievements
    const currentAchievements = currentUser.achievements || [];

    const gameData = {
      points,
      sessionAccuracy,
      sessionPoints,
      additionalTime,
      newSessionsCompleted,
      newTotalTime,
      newStreak,
    };

    const userData = {
      phraseCounts: currentUser.phraseCounts,
      dailyPoints: currentUser.dailyPoints,
    };

    const achievementResult = checkAllAchievements(
      gameData,
      userData,
      currentAchievements,
    );

    const newAchievements = achievementResult.newAchievements;
    const newlyUnlockedIds = achievementResult.newlyUnlockedIds;
    // Check if new achievements were unlocked this session
    // Achievement notifications
    if (newlyUnlockedIds.length > 0) {
      // Send achievement notifications
      if (
        notificationSettings.achievements?.enabled &&
        notificationPermission === "granted"
      ) {
        newlyUnlockedIds.forEach((achievementId) => {
          const achievement = getAchievementById(achievementId);
          if (achievement) {
            setTimeout(() => {
              sendAchievementNotification(achievement.name);
            }, 2000);
          }
        });
      }

      // Show achievement notification after a delay
      setTimeout(() => {
        setUnlockedAchievementIds(newlyUnlockedIds);
        setShowAchievementUnlocked(true);
      }, 1500);
    }

    // Prepare data for Firebase
    // NOTE: currentStreak and longestStreak are handled separately by updateDailyStreak()
    // Do NOT include them here to avoid race conditions and overwrites!
    const progressData = {
      totalPoints: points, // Single field, cumulative, never decreases
      unlockedPhrases: getUnlockedPhraseIds(points),
      totalZikrTime: newTotalTime,
      achievements: newAchievements,
      sessionsCompleted: newSessionsCompleted,
      // currentStreak and longestStreak removed - handled by updateDailyStreak()
      phraseCounts: currentUser.phraseCounts || {},
      dailyPoints: currentUser.dailyPoints || 0,
      lastPointsResetDate:
        currentUser.lastPointsResetDate ||
        new Date().toISOString().split("T")[0],
      asmaTotalTaps: asmaTotalTaps, // Save Asma tap count
      tasbihTotalCounts: tasbihTotalCounts, // Save Tasbih total counts
      activeFreezes: currentUser.activeFreezes || [], // Save active freeze dates
      // Profile preferences
      profileAvatar: profileAvatar, // Save selected avatar
      phraseSpeed: phraseSpeed, // Save speed preference
      userGender: userGender, // Save gender
      leaderboardVisible: leaderboardVisible, // Save leaderboard visibility
    };

    // Update daily stats for calendar tracker
    const updatedDailyStats = updateDailyStats(
      currentUser.dailyStats || {},
      sessionStats.totalTaps,
      sessionPoints,
      additionalTime,
    );

    progressData.dailyStats = updatedDailyStats;

    // Save to Firebase
    const result = await saveGameProgress(currentUser.userId, progressData);

    if (result.success) {
      console.log("✅ Progress saved to Firebase");
      setCurrentUser({ ...currentUser, ...progressData });
      return newAchievements.length > currentAchievements.length;
    } else {
      console.error("❌ Failed to save progress:", result.error);
      return false;
    }
  };

  // Get dynamic background based on total points (Focus Mode only)
  // ===== DYNAMIC BACKGROUND & AUDIO SYSTEM (FOCUS MODE) =====

  // Fade out audio smoothly
  const fadeOutAudio = (audio, duration = 1000) => {
    return new Promise((resolve) => {
      if (!audio || audio.paused) {
        resolve();
        return;
      }

      const startVolume = audio.volume;
      const step = startVolume / (duration / 50); // 50ms intervals

      const fadeInterval = setInterval(() => {
        if (audio.volume > step) {
          audio.volume = Math.max(0, audio.volume - step);
        } else {
          audio.volume = 0;
          audio.pause();
          clearInterval(fadeInterval);
          resolve();
        }
      }, 50);
    });
  };

  // Fade in audio smoothly
  const fadeInAudio = (audio, targetVolume = 0.5, duration = 1000) => {
    return new Promise((resolve) => {
      if (!audio) {
        resolve();
        return;
      }

      audio.volume = 0;
      audio.play().catch((err) => {
        console.log("[AUDIO] Play prevented:", err);
        resolve();
      });

      const step = targetVolume / (duration / 50); // 50ms intervals

      const fadeInterval = setInterval(() => {
        if (audio.volume < targetVolume - step) {
          audio.volume = Math.min(targetVolume, audio.volume + step);
        } else {
          audio.volume = targetVolume;
          clearInterval(fadeInterval);
          resolve();
        }
      }, 50);
    });
  };

  // Transition to new background and audio
  const transitionBackgroundAndAudio = async (newIndex) => {
    if (isFadingRef.current || newIndex === currentBackgroundIndex) return;

    isFadingRef.current = true;
    console.log(
      `[BG/AUDIO] Transitioning from ${currentBackgroundIndex} to ${newIndex}`,
    );

    // Fade out current audio
    if (audioRef.current && !audioRef.current.paused) {
      await fadeOutAudio(audioRef.current, 1500);
    }

    // Update background index (triggers CSS transition)
    setCurrentBackgroundIndex(newIndex);

    // Load and fade in new audio
    if (
      !isAudioMuted &&
      soundsEnabled &&
      gameMode === "focus" &&
      screen === "game"
    ) {
      const newAudio = new Audio(`/assets/audio/${newIndex}.mp3`);
      newAudio.loop = true;
      newAudio.volume = 0;

      // Preload next audio for smoother transitions
      if (newIndex < 11) {
        nextAudioRef.current = new Audio(`/assets/audio/${newIndex + 1}.mp3`);
        nextAudioRef.current.preload = "auto";
      }

      // Replace old audio ref
      audioRef.current = newAudio;

      // Fade in new audio
      await fadeInAudio(newAudio, 0.5, 1500);
    }

    isFadingRef.current = false;
  };

  // Monitor session score and update background/audio (Focus Mode only)
  useEffect(() => {
    if (gameMode === "focus" && screen === "game") {
      const newIndex = getBackgroundIndex(sessionScore);
      if (newIndex !== currentBackgroundIndex) {
        transitionBackgroundAndAudio(newIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionScore, gameMode, screen]); // Functions intentionally omitted

  // Initialize audio when game starts (Focus Mode)
  useEffect(() => {
    if (
      gameMode === "focus" &&
      screen === "game" &&
      !isAudioMuted &&
      soundsEnabled
    ) {
      const initAudio = async () => {
        // Start with background 1 audio
        const audio = new Audio("/assets/audio/1.mp3");
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;

        // Preload background 2 audio
        nextAudioRef.current = new Audio("/assets/audio/2.mp3");
        nextAudioRef.current.preload = "auto";

        // Fade in initial audio
        await fadeInAudio(audio, 0.5, 1500);
        setIsAudioLoaded(true);
      };

      initAudio();
    }

    // Cleanup when leaving game
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (nextAudioRef.current) {
        nextAudioRef.current = null;
      }
      setIsAudioLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode, screen]); // isAudioMuted, soundsEnabled, and functions intentionally omitted

  // Handle audio mute/unmute
  const toggleAudioMute = async () => {
    if (isAudioMuted) {
      // Unmute: fade in current audio
      setIsAudioMuted(false);
      if (audioRef.current) {
        await fadeInAudio(audioRef.current, 0.5, 1000);
      }
    } else {
      // Mute: fade out current audio
      setIsAudioMuted(true);
      if (audioRef.current) {
        await fadeOutAudio(audioRef.current, 1000);
      }
    }
  };

  // ===== SOUND EFFECTS SYSTEM =====

  // Load all sound effects
  const loadSoundEffects = () => {
    console.log("[SOUNDS] Loading sound effects...");

    try {
      // Load all sound files
      soundRefs.current.tapSuccess = new Audio("/assets/audio/Tap Success.mp3");
      soundRefs.current.phraseMiss = new Audio("/assets/audio/Phrase Miss.mp3");
      soundRefs.current.phraseUnlock = new Audio(
        "/assets/audio/Phrase Unlock.mp3",
      );
      soundRefs.current.completion = new Audio("/assets/audio/Completion.mp3");

      // Set volumes
      soundRefs.current.tapSuccess.volume = soundVolumes.tapSuccess;
      soundRefs.current.phraseMiss.volume = soundVolumes.phraseMiss;
      soundRefs.current.phraseUnlock.volume = soundVolumes.phraseUnlock;
      soundRefs.current.completion.volume = soundVolumes.completion;

      // Preload all sounds
      Object.values(soundRefs.current).forEach((sound) => {
        if (sound) sound.preload = "auto";
      });

      setSoundsLoaded(true);
      console.log("[SOUNDS] All sound effects loaded successfully!");
    } catch (error) {
      console.error("[SOUNDS] Error loading sound effects:", error);
    }
  };

  // Load phrase audio files (NEW!)
  const loadPhraseAudio = () => {
    console.log("[PHRASE AUDIO] Loading phrase audio files...");

    try {
      // Load all 27 zikr phrase audio files (zikr_1.mp3 to zikr_27.mp3)
      for (let i = 1; i <= 27; i++) {
        const audio = new Audio(`/assets/audio/zikr_${i}.mp3`);
        audio.volume = phraseAudioVolume;
        audio.preload = "auto";
        phraseAudioRefs.current[i] = audio;
      }
      console.log("[PHRASE AUDIO] ✅ Loaded 27 zikr phrase audio files");

      // Load all 99 Asma ul Husna audio files (asma_101.mp3 to asma_200.mp3)
      for (let i = 101; i <= 200; i++) {
        const audio = new Audio(`/assets/audio/asma_${i}.mp3`);
        audio.volume = phraseAudioVolume;
        audio.preload = "auto";
        phraseAudioRefs.current[i] = audio;
      }
      console.log("[PHRASE AUDIO] ✅ Loaded 99 Asma ul Husna audio files");

      setPhraseAudioLoaded(true);
      console.log(
        "[PHRASE AUDIO] 🎵 All 126 audio files loaded successfully! (27 zikr + 99 Asma)",
      );
    } catch (error) {
      console.error("[PHRASE AUDIO] Error loading phrase audio:", error);
    }
  };

  // Play phrase audio (Zikr and Asma!)
  const playPhraseAudio = (phraseId) => {
    if (!phraseAudioEnabled || !phraseAudioLoaded) return;

    const audio = phraseAudioRefs.current[phraseId];
    if (!audio) {
      console.warn(`[PHRASE AUDIO] Audio for phrase ${phraseId} not found`);
      return;
    }

    try {
      // Clone and play (allows overlapping)
      const audioClone = audio.cloneNode();
      audioClone.volume = phraseAudioVolume;
      audioClone.play().catch((err) => {
        console.log(
          `[PHRASE AUDIO] Play prevented for phrase ${phraseId}:`,
          err,
        );
      });

      // Log which type of audio is playing
      if (phraseId >= 1 && phraseId <= 27) {
        console.log(`[PHRASE AUDIO] 🔊 Playing zikr_${phraseId}.mp3`);
      } else if (phraseId >= 101 && phraseId <= 200) {
        console.log(`[PHRASE AUDIO] 🔊 Playing asma_${phraseId}.mp3`);
      }
    } catch (error) {
      console.error(`[PHRASE AUDIO] Error playing phrase ${phraseId}:`, error);
    }
  };

  // Play a sound effect
  const playSound = (soundName) => {
    if (!soundsEnabled || !soundsLoaded) return;

    const sound = soundRefs.current[soundName];
    if (!sound) {
      console.warn(`[SOUNDS] Sound "${soundName}" not found`);
      return;
    }

    try {
      // Clone and play (allows overlapping sounds)
      const soundClone = sound.cloneNode();
      soundClone.volume = sound.volume;
      soundClone.play().catch((err) => {
        console.log(`[SOUNDS] Play prevented for ${soundName}:`, err);
      });
    } catch (error) {
      console.error(`[SOUNDS] Error playing ${soundName}:`, error);
    }
  };

  // Load sound effects on component mount
  useEffect(() => {
    loadSoundEffects();
    loadPhraseAudio(); // Load phrase audio files

    // Cleanup
    return () => {
      Object.values(soundRefs.current).forEach((sound) => {
        if (sound) {
          sound.pause();
          sound.src = "";
        }
      });
      // Cleanup phrase audio
      Object.values(phraseAudioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, []);

  // Toggle sound effects on/off
  const toggleSounds = () => {
    const newState = !soundsEnabled;
    setSoundsEnabled(newState);
    console.log(`[SOUNDS] Sound effects ${newState ? "enabled" : "disabled"}`);

    // Also stop background audio when sounds are disabled
    if (!newState && audioRef.current) {
      audioRef.current.pause();
    } else if (
      newState &&
      audioRef.current &&
      gameMode === "focus" &&
      screen === "game" &&
      !isPaused
    ) {
      audioRef.current
        .play()
        .catch((err) => console.log("[AUDIO] Play prevented:", err));
    }
  };

  // ===== END SOUND EFFECTS SYSTEM =====

  // Handle pause/resume audio
  useEffect(() => {
    if (audioRef.current && gameMode === "focus" && screen === "game") {
      if (isPaused) {
        audioRef.current.pause();
      } else if (!isAudioMuted) {
        audioRef.current
          .play()
          .catch((err) => console.log("[AUDIO] Play prevented:", err));
      }
    }
  }, [isPaused, gameMode, screen]);

  // Start game
  const startGame = (mode = gameMode) => {
    console.log(
      `[START GAME] Mode parameter: ${mode}, gameMode state: ${gameMode}`,
    );

    // Update daily streak (calendar-based)
    updateDailyStreak();

    // CRITICAL: Set mode ref IMMEDIATELY to prevent spawning wrong items
    gameModeRef.current = mode;
    console.log(`[START GAME] Set gameModeRef to: ${mode}`);

    // CRITICAL: Stop and clear everything from previous game first
    stopGameLoop();
    setPhrases([]); // Clear old phrases immediately
    setIsPaused(false);

    // Small delay to ensure cleanup completes
    setTimeout(() => {
      // Determine which items to check based on game mode
      let allItems = [];
      if (mode === "focus") {
        allItems = ZIKR_PHRASES;
      } else if (mode === "asma") {
        allItems = NAMES_OF_ALLAH;
      } else if (mode === "tasbih") {
        allItems = tasbihSelectedPhrase ? [tasbihSelectedPhrase] : [];
      }

      // Set previously unlocked based on current total points
      const currentUnlocked = allItems
        .filter((p) => p.unlockAt <= totalPoints)
        .map((p) => p.id);
      previouslyUnlockedRef.current = new Set(currentUnlocked);

      setScreen("game");

      setSessionScore(0);
      sessionScoreRef.current = 0;
      setAsmaSessionScore(0); // Reset Asma session score
      setTasbihSessionScore(0); // Reset Tasbih session score
      setLives(5);
      setConsecutiveMisses(0);

      // ✅ BUG FIX: Only reset Bismillah counter for BRAND NEW users
      // For returning users, keep ref at 3+ so Bismillah never force-spawns again
      if (totalPoints === 0 && bismillahCountRef.current === 0) {
        // Brand new user, first game ever
        setBismillahCount(0);
        bismillahCountRef.current = 0;
        console.log(
          "[BISMILLAH FIX] New user - allowing initial Bismillah spawns",
        );
      } else {
        // Returning user or already played - keep ref at 3+ to prevent Bismillah spam
        if (bismillahCountRef.current < 3) {
          bismillahCountRef.current = 3;
          setBismillahCount(3);
        }
        console.log(
          "[BISMILLAH FIX] Returning user - Bismillah spawns disabled",
        );
      }

      setBismillahHelpCount(0); // Reset help counter (but we'll remove help logic anyway)
      setPhrases([]); // Clear again to be sure
      setNewlyUnlockedPhrases({});
      setNewlyUnlockedAsmaNames({}); // Reset newly unlocked Asma names
      setTotalPhrasesAppeared(0);

      // Reset background/audio for Focus Mode
      if (mode === "focus") {
        setCurrentBackgroundIndex(1);
        isFadingRef.current = false;
      }

      // Reset game start time using ref for consistent speed
      const startTime = Date.now();
      gameStartTimeRef.current = startTime;
      setGameStartTime(startTime);

      setSessionStats({
        totalTaps: 0,
        missedPhrases: 0,
        accuracy: 0,
        duration: 0,
      });
      nextPhraseIdRef.current = 0;

      // Track session start stats for accurate reporting
      if (mode === "asma") {
        setSessionStartAsmaCount(getUnlockedAsmaIds(asmaTotalTaps).length);
        console.log(
          `[SESSION START] Asma names at start: ${getUnlockedAsmaIds(asmaTotalTaps).length}`,
        );
      }
      if (mode === "tasbih") {
        setTasbihCompleted(false); // Reset completion status
        console.log("[SESSION START] Tasbih completion status: false");
      }

      // Small delay to ensure state is set before spawning initial phrases
      setTimeout(() => {
        // Spawn 3 initial items based on mode
        let firstItem;
        if (mode === "focus") {
          firstItem = ZIKR_PHRASES[0]; // Bismillah
          console.log("[START GAME] Focus Mode - First item: Bismillah");
        } else if (mode === "asma") {
          firstItem = NAMES_OF_ALLAH[0]; // Ya Allah
          console.log("[START GAME] Asma ul Husna Mode - First item: Ya Allah");
        } else if (mode === "tasbih") {
          firstItem = tasbihSelectedPhrase; // Selected phrase
          console.log(
            `[START GAME] Tasbih Mode - Selected phrase: ${tasbihSelectedPhrase?.transliteration || "ERROR: NONE"}`,
          );
          console.log(
            `[START GAME] Tasbih Mode - firstItem.arabic: ${firstItem?.arabic}, firstItem.id: ${firstItem?.id}`,
          );
          if (!tasbihSelectedPhrase) {
            console.error(
              "[START GAME ERROR] Tasbih mode started without selected phrase!",
            );
            alert("Error: No phrase selected for Tasbih mode!");
            setScreen("tasbih-setup");
            return;
          }
        }

        console.log(
          `[START GAME] Creating 3 initial phrases with: ${firstItem.transliteration} (ID: ${firstItem.id})`,
        );

        const initialPhrases = [
          {
            id: nextPhraseIdRef.current++,
            data: firstItem,
            position: -20,
            verticalPosition: 30,
            isNewlyUnlocked: false,
            newUnlockCount: 0,
            phraseDataId: firstItem.id,
          },
          {
            id: nextPhraseIdRef.current++,
            data: firstItem,
            position: -50,
            verticalPosition: 50,
            isNewlyUnlocked: false,
            newUnlockCount: 0,
            phraseDataId: firstItem.id,
          },
          {
            id: nextPhraseIdRef.current++,
            data: firstItem,
            position: -80,
            verticalPosition: 70,
            isNewlyUnlocked: false,
            newUnlockCount: 0,
            phraseDataId: firstItem.id,
          },
        ];
        setPhrases(initialPhrases);
        setTotalPhrasesAppeared(3);

        // ONLY set Bismillah count for Focus Mode
        if (mode === "focus") {
          setBismillahCount(3); // Set to 3 since we spawned 3 Bismillahs initially
          bismillahCountRef.current = 3; // Set ref immediately for synchronous access
          console.log(
            "[FOCUS MODE] Set bismillahCountRef to 3 after initial spawns",
          );
        }

        startGameLoop();
      }, 50);
    }, 100); // Outer setTimeout for cleanup
  };

  // Spawn a new phrase
  const spawnPhrase = () => {
    const currentTotal = totalPoints + sessionScoreRef.current;
    const currentMode = gameModeRef.current; // Use ref for immediate value

    let availableItems = [];

    // Determine which items to use based on game mode
    if (currentMode === "focus") {
      // Focus Mode: Only zikr phrases (point-based)
      availableItems = ZIKR_PHRASES.filter((p) => p.unlockAt <= currentTotal);
      console.log(
        `[FOCUS MODE] Spawning from ${availableItems.length} unlocked ZIKR_PHRASES`,
      );
    } else if (currentMode === "asma") {
      // ✅ BUG FIX: Use ref for immediate access (state updates are async!)
      const currentTaps = asmaTotalTapsRef.current;
      const unlockedIds = getUnlockedAsmaIds(currentTaps);
      availableItems = NAMES_OF_ALLAH.filter((n) => unlockedIds.includes(n.id));
      console.log(
        `[ASMA MODE] Spawning from ${availableItems.length} unlocked names (${currentTaps} total taps - from ref)`,
      );
      console.log(
        `[ASMA MODE] Available name IDs: ${availableItems.map((n) => n.id).join(", ")}`,
      );
      console.log(
        `[ASMA MODE] Available names: ${availableItems.map((n) => n.transliteration).join(", ")}`,
      );
    } else if (currentMode === "tasbih") {
      // Tasbih Mode: Only the selected phrase
      availableItems = tasbihSelectedPhrase ? [tasbihSelectedPhrase] : [];
      console.log(
        `[TASBIH MODE] Spawning selected phrase: ${tasbihSelectedPhrase?.transliteration || "none"}`,
      );
    }

    if (availableItems.length === 0) return;

    let randomItem;

    // Tasbih mode: Always use the selected phrase (skip probability distribution)
    if (currentMode === "tasbih") {
      if (!tasbihSelectedPhrase) {
        console.error("[TASBIH MODE ERROR] No phrase selected!");
        return;
      }
      randomItem = tasbihSelectedPhrase;
      console.log(
        `[TASBIH MODE] ✓ Spawning: ${randomItem.transliteration} (${randomItem.arabic})`,
      );
    } else {
      // SPECIAL BISMILLAH LOGIC: Force Bismillah for first 3 spawns OR 2 times after 3 consecutive misses
      if (currentMode === "focus") {
        if (bismillahCountRef.current < 3) {
          // Force Bismillah for first 3 times only
          randomItem = ZIKR_PHRASES[0]; // Bismillah
          bismillahCountRef.current += 1; // INCREMENT IMMEDIATELY
          setBismillahCount((prev) => prev + 1); // Update state too
          console.log(
            `[BISMILLAH] Initial spawn ${bismillahCountRef.current}/3 - ref now: ${bismillahCountRef.current}`,
          );
        } else {
          // ✅ BUG FIX: Removed "help spawn" logic that caused Bismillah spam
          // Normal spawning - FILTER OUT BISMILLAH from available items
          const itemsWithoutBismillah = availableItems.filter(
            (p) => p.id !== 1,
          );

          console.log(
            `[DEBUG] bismillahCountRef.current: ${bismillahCountRef.current}`,
          );
          console.log(`[DEBUG] bismillahCount state: ${bismillahCount}`);
          console.log(
            `[DEBUG] availableItems.length: ${availableItems.length}`,
          );
          console.log(
            `[DEBUG] itemsWithoutBismillah.length: ${itemsWithoutBismillah.length}`,
          );
          console.log(
            `[DEBUG] itemsWithoutBismillah IDs: ${itemsWithoutBismillah.map((p) => p.id).join(", ")}`,
          );

          if (itemsWithoutBismillah.length === 0) {
            // Edge case: Only Bismillah is unlocked (shouldn't happen, but handle it)
            console.warn(
              "[WARNING] Only Bismillah available! Spawning it anyway to keep game going...",
            );
            randomItem = ZIKR_PHRASES[0]; // Spawn Bismillah to prevent game stall
          } else {
            // Categorize by word count for probability distribution
            const twoWordItems = itemsWithoutBismillah.filter(
              (p) => p.wordCount === 2,
            );
            const threeWordItems = itemsWithoutBismillah.filter(
              (p) => p.wordCount === 3,
            );
            const fourWordItems = itemsWithoutBismillah.filter(
              (p) => p.wordCount === 4,
            );
            const longerItems = itemsWithoutBismillah.filter(
              (p) => p.wordCount > 4,
            );

            console.log(
              `[DEBUG] 2-word: ${twoWordItems.length}, 3-word: ${threeWordItems.length}, 4-word: ${fourWordItems.length}, longer: ${longerItems.length}`,
            );

            // Probability distribution: 2-word (90%), 3-word (5%), 4-word (2%), 5+ word (3%)
            const rand = Math.random();

            if (rand < 0.9 && twoWordItems.length > 0) {
              randomItem =
                twoWordItems[Math.floor(Math.random() * twoWordItems.length)];
            } else if (rand < 0.95 && threeWordItems.length > 0) {
              randomItem =
                threeWordItems[
                  Math.floor(Math.random() * threeWordItems.length)
                ];
            } else if (rand < 0.97 && fourWordItems.length > 0) {
              randomItem =
                fourWordItems[Math.floor(Math.random() * fourWordItems.length)];
            } else if (longerItems.length > 0) {
              randomItem =
                longerItems[Math.floor(Math.random() * longerItems.length)];
            } else {
              randomItem =
                itemsWithoutBismillah[
                  Math.floor(Math.random() * itemsWithoutBismillah.length)
                ];
            }

            console.log(
              `[NORMAL SPAWN] Selected: ${randomItem.transliteration} (ID: ${randomItem.id})`,
            );
          }
        }
      } else {
        // Asma mode - normal probability
        const twoWordItems = availableItems.filter((p) => p.wordCount === 2);
        const threeWordItems = availableItems.filter((p) => p.wordCount === 3);
        const fourWordItems = availableItems.filter((p) => p.wordCount === 4);
        const longerItems = availableItems.filter((p) => p.wordCount > 4);

        console.log(
          `[ASMA MODE] Word count distribution: 2-word: ${twoWordItems.length}, 3-word: ${threeWordItems.length}, 4-word: ${fourWordItems.length}, longer: ${longerItems.length}`,
        );

        const rand = Math.random();

        if (rand < 0.9 && twoWordItems.length > 0) {
          randomItem =
            twoWordItems[Math.floor(Math.random() * twoWordItems.length)];
        } else if (rand < 0.95 && threeWordItems.length > 0) {
          randomItem =
            threeWordItems[Math.floor(Math.random() * threeWordItems.length)];
        } else if (rand < 0.97 && fourWordItems.length > 0) {
          randomItem =
            fourWordItems[Math.floor(Math.random() * fourWordItems.length)];
        } else if (longerItems.length > 0) {
          randomItem =
            longerItems[Math.floor(Math.random() * longerItems.length)];
        } else {
          randomItem =
            availableItems[Math.floor(Math.random() * availableItems.length)];
        }

        console.log(
          `[ASMA MODE] Selected: ${randomItem.transliteration} (ID: ${randomItem.id}, wordCount: ${randomItem.wordCount})`,
        );
      }
    }

    // Check if this item is newly unlocked (Focus or Asma mode)
    let isNewlyUnlocked = false;

    if (currentMode === "focus") {
      // Check newlyUnlockedPhrases for Focus Mode
      const currentCount = newlyUnlockedPhrases[randomItem.id];
      isNewlyUnlocked = currentCount !== undefined && currentCount < 3;
    } else if (currentMode === "asma") {
      // Check newlyUnlockedAsmaNames for Asma Mode
      const currentCount = newlyUnlockedAsmaNames[randomItem.id];
      isNewlyUnlocked = currentCount !== undefined && currentCount < 3;
    }

    // Find a vertical position that doesn't overlap with existing phrases
    let verticalPosition;
    let attempts = 0;
    const maxAttempts = 20;

    // Get current phrases positions
    setPhrases((currentPhrases) => {
      do {
        verticalPosition = Math.random() * 60 + 20; // Random position between 20% and 80%

        // Check if this position overlaps with any existing phrase
        const hasOverlap = currentPhrases.some((p) => {
          // Only check phrases that are still on screen (position < 100)
          if (p.position > 100 || p.position < -25) return false;

          // Check vertical distance - phrases need at least 15% spacing (reduced from 20%)
          const verticalDistance = Math.abs(
            p.verticalPosition - verticalPosition,
          );
          return verticalDistance < 15;
        });

        if (!hasOverlap) break;
        attempts++;
      } while (attempts < maxAttempts);

      // If we couldn't find a good spot after many attempts, use a safe position
      if (attempts >= maxAttempts) {
        // Use one of 3 predefined lanes
        const lanes = [25, 50, 75];
        verticalPosition = lanes[Math.floor(Math.random() * lanes.length)];
      }

      const newPhrase = {
        id: nextPhraseIdRef.current++,
        data: randomItem,
        position: -20,
        verticalPosition: verticalPosition,
        isNewlyUnlocked: isNewlyUnlocked,
        phraseDataId: randomItem.id,
      };

      return [...currentPhrases, newPhrase];
    });

    setTotalPhrasesAppeared((prevTotal) => prevTotal + 1);

    // Increment appearance count for newly unlocked items
    if (isNewlyUnlocked) {
      if (currentMode === "focus") {
        setNewlyUnlockedPhrases((prev) => ({
          ...prev,
          [randomItem.id]: (prev[randomItem.id] || 0) + 1,
        }));
      } else if (currentMode === "asma") {
        setNewlyUnlockedAsmaNames((prev) => {
          const newCount = (prev[randomItem.id] || 0) + 1;
          console.log(
            `[ASMA NEWLY UNLOCKED] ${randomItem.transliteration} appeared ${newCount}/3 times`,
          );
          return {
            ...prev,
            [randomItem.id]: newCount,
          };
        });
      }
    } else if (currentMode === "asma") {
      // Log normal (not newly unlocked) Asma spawns
      console.log(
        `[ASMA NORMAL SPAWN] ${randomItem.transliteration} (ID: ${randomItem.id}) - this name can repeat multiple times`,
      );
    }
  };

  // Game loop
  const startGameLoop = () => {
    if (gameLoopRef.current) return;

    gameLoopRef.current = setInterval(() => {
      // Check for newly unlocked items using refs for real-time access
      const currentTotal = totalPoints + sessionScoreRef.current;
      const currentMode = gameModeRef.current; // Use ref for immediate value

      // Determine which items to check based on game mode
      let itemsToCheck = [];
      if (currentMode === "focus") {
        itemsToCheck = ZIKR_PHRASES;
      } else if (currentMode === "asma") {
        itemsToCheck = NAMES_OF_ALLAH;
      } else if (currentMode === "tasbih") {
        // Tasbih mode doesn't unlock new items during gameplay
        itemsToCheck = [];
      }

      itemsToCheck.forEach((item) => {
        // If item is unlocked now but wasn't previously unlocked
        if (
          item.unlockAt <= currentTotal &&
          !previouslyUnlockedRef.current.has(item.id)
        ) {
          console.log(
            `🎉 Unlocking ${currentMode === "asma" ? "name" : "phrase"} ${item.id}: ${item.transliteration} at ${currentTotal} points!`,
          );
          previouslyUnlockedRef.current.add(item.id);

          // Trigger particle burst effect!
          createParticleBurst(
            window.innerWidth / 2,
            window.innerHeight / 2,
            "#f59e0b",
          );

          // Play unlock sound
          playSound("phraseUnlock");

          // Mark as newly unlocked based on mode
          if (currentMode === "focus") {
            // Focus Mode - mark in newlyUnlockedPhrases
            setNewlyUnlockedPhrases((prev) => {
              const updated = { ...prev, [item.id]: 0 };

              // Then immediately spawn the newly unlocked item in golden!
              setTimeout(() => {
                const newPhrase = {
                  id: nextPhraseIdRef.current++,
                  data: item,
                  position: -20,
                  verticalPosition: Math.random() * 60 + 20,
                  isNewlyUnlocked: true,
                  phraseDataId: item.id,
                };
                setPhrases((prevPhrases) => [...prevPhrases, newPhrase]);
                setTotalPhrasesAppeared((prevTotal) => prevTotal + 1);

                // Increment the counter for this newly unlocked item
                setNewlyUnlockedPhrases((prev2) => ({
                  ...prev2,
                  [item.id]: (prev2[item.id] || 0) + 1,
                }));
              }, 100);

              return updated;
            });
          } else if (currentMode === "asma") {
            // Asma Mode - mark in newlyUnlockedAsmaNames
            setNewlyUnlockedAsmaNames((prev) => {
              const updated = { ...prev, [item.id]: 0 };

              // Then immediately spawn the newly unlocked name in golden!
              setTimeout(() => {
                const newPhrase = {
                  id: nextPhraseIdRef.current++,
                  data: item,
                  position: -20,
                  verticalPosition: Math.random() * 60 + 20,
                  isNewlyUnlocked: true,
                  phraseDataId: item.id,
                };
                setPhrases((prevPhrases) => [...prevPhrases, newPhrase]);
                setTotalPhrasesAppeared((prevTotal) => prevTotal + 1);

                // Increment the counter for this newly unlocked name
                setNewlyUnlockedAsmaNames((prev2) => ({
                  ...prev2,
                  [item.id]: (prev2[item.id] || 0) + 1,
                }));
              }, 100);

              return updated;
            });
          }
        }
      });

      setPhrases((prev) => {
        const speed = getSpeed();
        const updated = prev.map((p) => ({
          ...p,
          position: p.position + speed,
        }));

        // Check for missed phrases
        const missed = updated.filter((p) => p.position > 110);
        if (missed.length > 0) {
          // Handle misses: smart sound + game ending logic
          setConsecutiveMisses((prevMisses) => {
            const newMisses = prevMisses + missed.length;

            console.log(
              `[MISS CHECK] Mode: ${gameModeRef.current}, Consecutive misses: ${prevMisses} → ${newMisses}`,
            );

            // Smart miss sound: Mode-specific
            const currentMode = gameModeRef.current;
            let shouldPlaySound = false;

            if (currentMode === "tasbih") {
              // Tasbih: Sound on 4th and 7th miss only
              if (
                (prevMisses < 4 && newMisses >= 4) ||
                (prevMisses < 7 && newMisses >= 7)
              ) {
                shouldPlaySound = true;
              }
            } else {
              // Focus & Asma: Sound on 3rd miss only
              if (prevMisses < 3 && newMisses >= 3) {
                shouldPlaySound = true;
              }
            }

            if (shouldPlaySound) {
              missed.forEach(() => playSound("phraseMiss"));
              console.log(
                `[SOUND] Playing miss sound (${currentMode} mode, miss #${newMisses})`,
              );
            }

            // Game ending logic based on mode
            // Tasbih Mode: 10 consecutive misses
            if (gameModeRef.current === "tasbih" && newMisses >= 10) {
              console.log(
                `[GAME END] Tasbih: 10 consecutive misses reached! Ending game...`,
              );
              setTimeout(() => endGame(), 100);
            }
            // Focus & Asma Modes: 5 consecutive misses
            else if (gameModeRef.current !== "tasbih" && newMisses >= 5) {
              console.log(
                `[GAME END] ${gameModeRef.current}: 5 consecutive misses reached! Ending game...`,
              );
              setTimeout(() => endGame(), 100);
            }

            return newMisses;
          });

          // Update lives (only for non-Tasbih modes)
          if (gameModeRef.current !== "tasbih") {
            setLives((prevLives) => Math.max(0, prevLives - missed.length));
          }

          setSessionStats((prevStats) => ({
            ...prevStats,
            missedPhrases: prevStats.missedPhrases + missed.length,
          }));
        }

        // Remove off-screen phrases
        const remaining = updated.filter((p) => p.position <= 110);

        // Consistent spawn frequency throughout the game - MORE INTENSE!
        const targetPhrases = 4; // Keep 4 phrases on screen consistently
        const spawnProbability = 0.95; // 95% chance to spawn when below target

        // Maintain target number of phrases on screen
        if (remaining.length < targetPhrases) {
          spawnPhrase();
          // Spawn one more if significantly below target
          if (remaining.length < targetPhrases - 1) {
            setTimeout(() => spawnPhrase(), 200);
          }
        } else if (
          remaining.length < targetPhrases + 1 &&
          Math.random() < spawnProbability
        ) {
          spawnPhrase();
        }

        return remaining;
      });
    }, 50);
  };

  // Stop game loop
  const stopGameLoop = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
      gameLoopRef.current = null;
    }
  };

  // Handle phrase tap
  const handlePhraseTap = (
    event,
    phraseId,
    points,
    phraseDataId,
    isNewlyUnlocked = false,
  ) => {
    console.log(
      `[TAP] gameMode: ${gameMode}, phraseId: ${phraseId}, points: ${points}, isNewlyUnlocked: ${isNewlyUnlocked}`,
    );

    // Get tap position for animation
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Create tap effect animation based on points and unlock status
    createTapEffect(x, y, points, isNewlyUnlocked);

    // Play tap success sound
    playSound("tapSuccess");

    // Play phrase audio for both Zikr (1-27) and Asma (101-200) 🎵
    if (phraseDataId) {
      if (
        (phraseDataId >= 1 && phraseDataId <= 27) ||
        (phraseDataId >= 101 && phraseDataId <= 200)
      ) {
        playPhraseAudio(phraseDataId);
      }
    }

    setPhrases((prev) => prev.filter((p) => p.id !== phraseId));

    // Track phrase taps for virtue unlocks (Focus mode only)
    if (gameMode === "focus" && phraseDataId) {
      setPhraseTapCounts((prev) => ({
        ...prev,
        [phraseDataId]: (prev[phraseDataId] || 0) + 1,
      }));
    }

    // Update session score ONLY for Focus Mode (point-based)
    if (gameMode === "focus") {
      setSessionScore((prev) => {
        const newSessionScore = prev + points;
        sessionScoreRef.current = newSessionScore; // Update ref for real-time access
        return newSessionScore;
      });
    }

    // Asma Mode: Increment tap counter for 33-tap unlock system + Award points
    if (gameMode === "asma") {
      // Award 10 points per tap
      setAsmaSessionScore((prev) => prev + 10);

      setAsmaTotalTaps((prev) => {
        const newTaps = prev + 1;
        asmaTotalTapsRef.current = newTaps; // ✅ BUG FIX: Update ref immediately for spawnPhrase

        const oldUnlockedCount = getUnlockedAsmaIds(prev).length;
        const newUnlockedCount = getUnlockedAsmaIds(newTaps).length;

        // Check if we unlocked a new name
        if (newUnlockedCount > oldUnlockedCount) {
          const newlyUnlockedIds =
            getUnlockedAsmaIds(newTaps).slice(oldUnlockedCount);
          console.log(
            `[ASMA UNLOCK] New name(s) unlocked! IDs:`,
            newlyUnlockedIds,
          );

          // Trigger particle burst effect!
          createParticleBurst(
            window.innerWidth / 2,
            window.innerHeight / 2,
            "#a855f7",
          );

          // Play unlock sound
          playSound("phraseUnlock");

          // Add to newly unlocked tracking
          setNewlyUnlockedAsmaNames((prevUnlocked) => {
            const updated = { ...prevUnlocked };
            newlyUnlockedIds.forEach((id) => {
              updated[id] = 0; // Start appearance count at 0
            });
            return updated;
          });

          // IMMEDIATELY SPAWN the newly unlocked name(s)
          newlyUnlockedIds.forEach((id) => {
            setTimeout(() => {
              const newlyUnlockedName = NAMES_OF_ALLAH.find(
                (name) => name.id === id,
              );
              if (newlyUnlockedName) {
                const newPhrase = {
                  id: nextPhraseIdRef.current++,
                  data: newlyUnlockedName,
                  position: -20,
                  verticalPosition: Math.random() * 60 + 20,
                  isNewlyUnlocked: true,
                  phraseDataId: newlyUnlockedName.id,
                };
                setPhrases((prevPhrases) => [...prevPhrases, newPhrase]);
                setTotalPhrasesAppeared((prevTotal) => prevTotal + 1);

                // Increment appearance counter
                setNewlyUnlockedAsmaNames((prev2) => ({
                  ...prev2,
                  [id]: (prev2[id] || 0) + 1,
                }));

                console.log(
                  `[ASMA SPAWN] Spawned newly unlocked name: ${newlyUnlockedName.transliteration}`,
                );
              }
            }, 100);
          });
        }

        console.log(
          `[ASMA TAP] Total taps: ${prev} → ${newTaps} (Next unlock at: ${Math.ceil(newTaps / 33) * 33})`,
        );
        console.log(
          `[ASMA TAP] Names unlocked: ${oldUnlockedCount} → ${newUnlockedCount}`,
        );

        // ✅ CRITICAL FIX: Save asmaTotalTaps IMMEDIATELY to prevent data loss if user quits
        if (currentUser && currentUser.userId) {
          const userRef = doc(db, "users", currentUser.userId);
          updateDoc(userRef, {
            asmaTotalTaps: newTaps,
          }).catch((error) => {
            console.error(
              "[ASMA SAVE ERROR] Failed to save asmaTotalTaps:",
              error,
            );
          });
          console.log(
            `[ASMA SAVE] ✅ Saved asmaTotalTaps: ${newTaps} to Firestore`,
          );
        }

        return newTaps;
      });
    }

    // Track phrase count for achievements (Focus, Asma, AND Tasbih modes)
    if (
      (gameMode === "focus" || gameMode === "asma" || gameMode === "tasbih") &&
      currentUser &&
      currentUser.userId &&
      phraseDataId
    ) {
      const oldCount = (currentUser.phraseCounts || {})[phraseDataId] || 0;
      const newCount = oldCount + 1;

      const updatedUser = {
        ...currentUser,
        phraseCounts: {
          ...(currentUser.phraseCounts || {}),
          [phraseDataId]: newCount, // Increment phrase count for achievements
        },
        dailyPoints:
          gameMode === "focus"
            ? (currentUser.dailyPoints || 0) + points
            : currentUser.dailyPoints || 0,
      };

      console.log(
        `[PHRASE COUNT] Mode: ${gameMode}, Phrase ID: ${phraseDataId}, Count: ${oldCount} → ${newCount}`,
      );

      // Save to Firebase (non-blocking)
      incrementPhraseCount(currentUser.userId, phraseDataId, oldCount);

      setCurrentUser(updatedUser);
    }

    // Tasbih Mode: Separate counting system for achievements
    if (gameMode === "tasbih") {
      // Increment Tasbih current count (for target goal)
      tasbihCurrentCountRef.current = tasbihCurrentCountRef.current + 1;
      const newCount = tasbihCurrentCountRef.current;
      console.log(
        `[TASBIH TAP] Count: ${newCount - 1} → ${newCount} / ${tasbihTargetCount}`,
      );
      setTasbihCurrentCount(newCount);

      // Also increment Tasbih total counts (separate from Focus/Asma achievements)
      if (phraseDataId) {
        setTasbihTotalCounts((prev) => {
          const oldTasbihCount = prev[phraseDataId] || 0;
          const newTasbihCount = oldTasbihCount + 1;
          console.log(
            `[TASBIH TOTAL] Phrase ${phraseDataId}: ${oldTasbihCount} → ${newTasbihCount} all-time`,
          );
          return {
            ...prev,
            [phraseDataId]: newTasbihCount,
          };
        });
      }

      if (newCount >= tasbihTargetCount) {
        // Goal achieved! End game
        console.log(
          `[TASBIH COMPLETE] Target reached! ${newCount}/${tasbihTargetCount}`,
        );

        // Mark as completed
        setTasbihCompleted(true);

        // Calculate points: phrase.points × count
        if (tasbihSelectedPhrase) {
          const tasbihPoints = tasbihSelectedPhrase.points * tasbihTargetCount;
          setTasbihSessionScore(tasbihPoints);
          console.log(
            `[TASBIH POINTS] ${tasbihSelectedPhrase.points} × ${tasbihTargetCount} = ${tasbihPoints} points`,
          );
        }

        // Trigger fireworks celebration!
        createFireworks();

        setTimeout(() => endGame(), 500);
      }
    }

    setConsecutiveMisses(0);
    setBismillahHelpCount(0); // Reset help counter when user successfully taps
    setSessionStats((prev) => ({
      ...prev,
      totalTaps: prev.totalTaps + 1,
    }));

    // Show tap animation
    const element = document.getElementById(`phrase-${phraseId}`);
    if (element) {
      element.style.transform = "scale(1.3)";
      element.style.transition = "transform 0.2s";
      setTimeout(() => {
        element.style.transform = "scale(1)";
      }, 200);
    }
  };

  // Pause/Resume
  const togglePause = () => {
    if (isPaused) {
      startGameLoop();
    } else {
      stopGameLoop();
    }
    setIsPaused(!isPaused);
  };

  // End game
  const endGame = () => {
    // Play completion sound
    playSound("completion");

    stopGameLoop();
    const duration = gameStartTimeRef.current
      ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
      : 0;

    // Calculate session score from ALL modes
    let finalSessionScore = 0;
    if (gameMode === "focus") {
      finalSessionScore = sessionScoreRef.current; // Use ref for Focus mode
    } else if (gameMode === "asma") {
      finalSessionScore = asmaSessionScore; // Asma mode points
    } else if (gameMode === "tasbih") {
      finalSessionScore = tasbihSessionScore; // Tasbih mode points
    }

    const newTotalPoints = totalPoints + finalSessionScore;
    setTotalPoints(newTotalPoints);

    const accuracy = calculatePercentage(
      sessionStats.totalTaps,
      sessionStats.totalTaps + sessionStats.missedPhrases,
    );

    console.log("[END GAME] Saving progress with:");
    console.log("  - Game Mode:", gameMode);
    console.log("  - Total Points:", newTotalPoints);
    console.log("  - Session Score:", finalSessionScore);
    console.log("    - Focus Score:", sessionScoreRef.current);
    console.log("    - Asma Score:", asmaSessionScore);
    console.log("    - Tasbih Score:", tasbihSessionScore);
    console.log("  - Duration:", duration);
    console.log("  - Accuracy:", accuracy);
    console.log("  - Current User:", currentUser?.username);

    // Save with duration, accuracy, and session score for achievements
    const newAchievementEarned = saveProgress(
      newTotalPoints,
      duration,
      accuracy,
      finalSessionScore,
    );

    console.log("[END GAME] New achievement earned:", newAchievementEarned);

    setSessionStats((prev) => ({
      ...prev,
      accuracy,
      duration,
      newAchievementEarned, // Track if new achievement was earned
    }));

    setScreen("stats");

    // ✨ Set a random Zikr Fact for the results screen
    const randomFact =
      ZIKR_FACTS[Math.floor(Math.random() * ZIKR_FACTS.length)];
    setCurrentZikrFact(randomFact);

    // Check if any virtues should be shown after session
    setTimeout(() => {
      checkAndShowVirtue(phraseTapCounts);
    }, 2000); // Show virtue after 2 seconds
  };

  // ============================================
  // VIRTUE SYSTEM FUNCTIONS
  // ============================================

  // Check and show virtue after session
  const checkAndShowVirtue = (sessionPhraseCounts) => {
    if (!sessionPhraseCounts || Object.keys(sessionPhraseCounts).length === 0)
      return;

    // Find phrases that unlocked new virtues during this session
    for (const [phraseId, count] of Object.entries(sessionPhraseCounts)) {
      const totalCount = phraseTapCounts[phraseId] || 0;
      const virtue = getRandomVirtue(parseInt(phraseId));

      if (virtue && shouldUnlockVirtue(parseInt(phraseId), totalCount)) {
        // Show the virtue popup
        setCurrentVirtue({
          phraseId: parseInt(phraseId),
          phrase: ZIKR_PHRASES.find((p) => p.id === parseInt(phraseId)),
          virtue: virtue.text,
          category: virtue.category,
        });
        setShowVirtuePopup(true);
        break; // Show one virtue at a time
      }
    }
  };

  // ============================================
  // SHARING SYSTEM FUNCTIONS
  // ============================================

  // Trigger share modal
  const triggerShare = async (type, data) => {
    const shareInfo = getShareData(type, data);
    if (!shareInfo) return;

    setShareData({ type, ...data, text: shareInfo.text });
    setIsGeneratingCard(true);
    setShowShareModal(true);

    // Generate sharing card
    try {
      const cardUrl = await generateSharingCard(
        type,
        shareInfo.cardData,
        "/logo-192.png",
      );
      setSharingCardUrl(cardUrl);
    } catch (error) {
      console.error("Error generating sharing card:", error);
    } finally {
      setIsGeneratingCard(false);
    }
  };

  // Handle social media share
  const handleSocialShare = (platform) => {
    if (!shareData || !sharingCardUrl) return;
    shareToSocial(platform, shareData.text, sharingCardUrl);
  };

  // Handle download image
  const handleDownloadCard = () => {
    if (!sharingCardUrl) return;
    downloadImage(sharingCardUrl, `zikri-${shareData.type}.png`);
  };

  // ============================================
  // PWA INSTALL FUNCTION
  // ============================================

  // Handle PWA install
  const handlePWAInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("✅ User accepted PWA install");
    } else {
      console.log("❌ User dismissed PWA install");
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopGameLoop();
  }, []);

  // Debounced version (waits 500ms after user stops typing)
  const debouncedUsernameCheck = debounce(checkUsernameAvailability, 500);

  // Auth screen
  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 text-white rounded-full p-4 mb-4">
              <Trophy size={40} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mb-2">
              Zikr Game
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Remember Allah, Earn Rewards
            </p>
          </div>

          <div className="space-y-4">
            {/* Username Input with Availability Check */}
            <div>
              <input
                type="text"
                placeholder="Username (e.g., Ahmed, Amir123)"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  // Check availability in real-time for signup
                  if (isSignUp && e.target.value.length >= 3) {
                    debouncedUsernameCheck(e.target.value);
                  } else {
                    setUsernameAvailable(null);
                  }
                }}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors"
              />
              {/* Username availability indicator */}
              {isSignUp && username.length >= 3 && (
                <p
                  className={`text-xs mt-1 px-2 ${
                    checkingUsername
                      ? "text-gray-500"
                      : usernameAvailable === true
                        ? "text-green-600 dark:text-green-400"
                        : usernameAvailable === false
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-500"
                  }`}
                >
                  {checkingUsername
                    ? "⏳ Checking availability..."
                    : usernameAvailable === true
                      ? "✅ Username available!"
                      : usernameAvailable === false
                        ? `❌ Username "${username}" is already taken`
                        : "👤 Enter a unique username (case-sensitive)"}
                </p>
              )}
              {!isSignUp && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                  👤 Usernames are case-sensitive
                </p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:border-emerald-500 dark:focus:border-emerald-400 focus:outline-none transition-colors"
              />
              {isSignUp && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 px-2">
                  🔒 Password must be at least 6 characters
                </p>
              )}
            </div>

            {/* Login/Signup Button */}
            <button
              onClick={handleAuth}
              disabled={isSignUp && usernameAvailable === false}
              className={`w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all ${
                isSignUp && usernameAvailable === false
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {isSignUp ? "Sign Up" : "Login"}
            </button>

            {/* Toggle between Login/Signup */}
            {!isSignUp ? (
              /* Login screen - Show prominent "First time user?" link */
              <div className="text-center space-y-2">
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setUsername("");
                    setPassword("");
                    setUsernameAvailable(null);
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  🆕 First time user? Sign Up Here!
                </button>
              </div>
            ) : (
              /* Signup screen - Show "Already have account?" */
              <button
                onClick={() => {
                  setIsSignUp(false);
                  setUsername("");
                  setPassword("");
                  setUsernameAvailable(null);
                }}
                className="w-full text-emerald-600 dark:text-emerald-400 py-2 text-sm hover:underline"
              >
                Already have an account? Login
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tasbih Setup screen
  if (screen === "tasbih-setup") {
    const unlockedPhrases = ZIKR_PHRASES.filter(
      (p) => p.unlockAt <= totalPoints,
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Tasbih Mode Setup
            </h1>
            <p className="text-gray-600 text-lg">
              Choose a phrase and set your repetition goal
            </p>
          </div>

          {/* Phrase Selection */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Select Phrase
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {unlockedPhrases.map((phrase) => (
                <div
                  key={phrase.id}
                  onClick={() => setTasbihSelectedPhrase(phrase)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    tasbihSelectedPhrase?.id === phrase.id
                      ? "border-blue-500 bg-blue-50 shadow-lg scale-105"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  <div className="text-2xl font-bold text-gray-800 text-right mb-2">
                    {phrase.arabic}
                  </div>
                  <div className="text-sm text-gray-600 font-semibold">
                    {phrase.transliteration}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {phrase.translation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Count Selection */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Set Target Count
            </h2>

            {/* Quick select buttons */}
            <div className="grid grid-cols-5 gap-3">
              {[10, 33, 100, 500, 1000].map((count) => (
                <button
                  key={count}
                  onClick={() => setTasbihTargetCount(count)}
                  className={`py-2.5 px-3 rounded-xl font-semibold transition-all text-base ${
                    tasbihTargetCount === count
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-105"
                      : "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 hover:from-blue-100 hover:to-indigo-100 hover:shadow-md"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <div className="flex gap-4">
            <button
              onClick={() => setScreen("mode-select")}
              className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (tasbihSelectedPhrase) {
                  console.log(
                    `[TASBIH START] Setting gameMode to 'tasbih', resetting count to 0`,
                  );
                  console.log(
                    `[TASBIH START] Selected phrase: ${tasbihSelectedPhrase.transliteration}`,
                  );
                  console.log(
                    `[TASBIH START] Target count: ${tasbihTargetCount}`,
                  );
                  setGameMode("tasbih");
                  setTasbihCurrentCount(0);
                  tasbihCurrentCountRef.current = 0; // Reset ref too
                  startGame("tasbih");
                } else {
                  alert("Please select a phrase first!");
                }
              }}
              disabled={!tasbihSelectedPhrase}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all ${
                tasbihSelectedPhrase
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:scale-105"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Start Tasbih Mode →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mode Selection screen
  if (screen === "mode-select") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Choose Your Mode
            </h1>
            <p className="text-gray-600 text-lg">
              Select how you want to remember Allah
            </p>
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Focus Mode */}
            <div
              onClick={() => {
                setGameMode("focus");
                startGame("focus");
              }}
              className="bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all border-4 border-emerald-300"
            >
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full p-6 mb-4">
                  <Target size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Focus Mode
                </h2>
                <p className="text-gray-600 mb-4">
                  Zikr phrases only - Pure dhikr practice
                </p>
                <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700">
                  <p>✨ 27 Authentic Zikr Phrases</p>
                  <p>📈 Progressive Unlocking</p>
                  <p>🎯 Focused Daily Practice</p>
                </div>
              </div>
            </div>

            {/* Asma ul Husna Mode */}
            <div
              onClick={() => {
                setGameMode("asma");
                startGame("asma");
              }}
              className="bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all border-4 border-purple-300"
            >
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full p-6 mb-4">
                  <Star size={48} className="fill-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Asma ul Husna
                </h2>
                <p className="text-gray-600 mb-4">Allah's Beautiful Names</p>
                <div className="bg-purple-50 rounded-xl p-3 text-sm text-purple-700">
                  <p>✨ 99 Divine Names</p>
                  <p>🎯 Tap 33 times to unlock next name</p>
                  <p>🌟 Start with Ya Allah & Ya Rabb</p>
                </div>
              </div>
            </div>

            {/* Tasbih Mode - Locked until all 27 phrases unlocked */}
            <div
              onClick={() => {
                if (getUnlockedPhraseIds(totalPoints).length >= 27) {
                  setScreen("tasbih-setup");
                } else {
                  alert(
                    `Tasbih Mode unlocks when ALL 27 phrases are unlocked!\nCurrent progress: ${getUnlockedPhraseIds(totalPoints).length}/27\n\nComplete Focus Mode to unlock!`,
                  );
                }
              }}
              className={`bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all border-4 ${
                getUnlockedPhraseIds(totalPoints).length >= 27
                  ? "border-blue-300"
                  : "border-gray-300 opacity-60"
              }`}
            >
              <div className="text-center">
                <div
                  className={`inline-block bg-gradient-to-r text-white rounded-full p-6 mb-4 ${
                    getUnlockedPhraseIds(totalPoints).length >= 27
                      ? "from-blue-500 to-indigo-600"
                      : "from-gray-400 to-gray-500"
                  }`}
                >
                  <Circle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Tasbih Mode
                </h2>
                <p className="text-gray-600 mb-4">
                  Focused repetition - Master one phrase
                </p>
                <div
                  className={`rounded-xl p-3 text-sm ${
                    getUnlockedPhraseIds(totalPoints).length >= 27
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  <p>🎯 Choose Any Phrase</p>
                  <p>🔢 Set Your Count</p>
                  <p>📿 Complete the Goal</p>
                </div>
                <div
                  className={`mt-3 border rounded-lg p-2 ${
                    getUnlockedPhraseIds(totalPoints).length >= 27
                      ? "bg-yellow-100 border-yellow-400"
                      : "bg-gray-100 border-gray-400"
                  }`}
                >
                  {getUnlockedPhraseIds(totalPoints).length >= 27 ? (
                    <p className="text-xs text-yellow-800 font-semibold">
                      🔓 UNLOCKED!
                    </p>
                  ) : (
                    <p className="text-xs text-gray-700 font-semibold">
                      🔒 {getUnlockedPhraseIds(totalPoints).length}/27 phrases
                      unlocked
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => setScreen("menu")}
              className="text-gray-600 hover:text-gray-800 font-semibold hover:underline"
            >
              ← Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Menu screen
  if (screen === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#ffffff] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1] dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Profile Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 rounded-full flex items-center justify-center text-3xl border-2 border-purple-300 dark:border-purple-600 flex-shrink-0">
                  {profileAvatar === "dove" && "🕊️"}
                  {profileAvatar === "bee" && "🐝"}
                  {profileAvatar === "deer" && "🦌"}
                  {profileAvatar === "fish" && "🐟"}
                  {profileAvatar === "eagle" && "🦅"}
                  {profileAvatar === "camel" && "🐪"}
                  {profileAvatar === "lion" && "🦁"}
                  {profileAvatar === "horse" && "🐎"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0f172a] dark:text-white">
                    As-salamu alaykum,{" "}
                    {currentUser?.username || currentUser?.displayName}!
                  </h2>
                  <div className="flex items-center gap-4 mt-1">
                    <p className="text-[#64748b] dark:text-gray-300">
                      Total Points:{" "}
                      <span className="font-bold text-[#4f46e5] dark:text-emerald-400">
                        {totalPoints}
                      </span>
                    </p>
                    <span className="text-[#cbd5e1] dark:text-gray-600">|</span>
                    <p className="text-[#64748b] dark:text-gray-300">
                      Zikr Time:{" "}
                      <span className="font-bold text-[#a855f7] dark:text-purple-400">
                        {Math.floor((currentUser?.totalZikrTime || 0) / 60)}m
                      </span>
                    </p>
                  </div>
                  {currentUser?.currentStreak > 0 && (
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Flame
                          className="text-[#10b981] dark:text-emerald-400"
                          size={20}
                        />
                        <span className="text-sm font-semibold text-[#10b981] dark:text-emerald-400">
                          {currentUser.currentStreak} Day Streak!
                        </span>
                      </div>
                      <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-700">
                        <Shield
                          className="text-blue-600 dark:text-blue-400"
                          size={16}
                        />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          {calculateFreezeTokens(currentUser.totalPoints || 0) -
                            (currentUser.activeFreezes || []).length}
                          /10
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-3 hover:bg-[#f8fafc] dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <LogOut
                  className="text-[#64748b] dark:text-gray-400"
                  size={24}
                />
              </button>
            </div>
          </div>

          {/* Main Menu */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 mb-6 border border-[#cbd5e1] dark:border-gray-700">
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-r from-[#1e3a8a] to-[#4f46e5] dark:from-emerald-600 dark:to-teal-600 text-white rounded-full p-6 mb-4">
                <Trophy size={48} />
              </div>
              <h1 className="text-4xl font-bold text-[#1e3a8a] dark:text-white mb-2">
                Zikri
              </h1>
              <p className="text-[#64748b] dark:text-gray-300">
                Remember Allah, Earn Rewards
              </p>
            </div>

            <div className="space-y-4">
              {/* Start Game Button - Full Width */}
              <button
                onClick={() => setScreen("mode-select")}
                className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#4f46e5] text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Start Game
              </button>

              {/* Row 1: Leaderboard & Achievements */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setScreen("leaderboard")}
                  className="bg-gradient-to-br from-[#fb923c] to-[#f59e0b] text-white py-4 px-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Crown size={28} />
                  <span className="text-sm leading-tight">Leaderboard</span>
                </button>
                <button
                  onClick={() => setScreen("achievements")}
                  className="bg-gradient-to-br from-[#a855f7] to-[#7c3aed] text-white py-4 px-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Medal size={28} />
                  <span className="text-sm leading-tight">Achievements</span>
                </button>
              </div>

              {/* Row 2: Calendar & My Profile */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setScreen("calendar")}
                  className="bg-gradient-to-br from-[#10b981] to-[#059669] text-white py-4 px-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Calendar size={28} />
                  <span className="text-sm leading-tight">Calendar</span>
                </button>
                <button
                  onClick={() => setScreen("my-profile")}
                  className="bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] text-white py-4 px-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <User size={28} />
                  <span className="text-sm leading-tight">My Profile</span>
                </button>
              </div>

              {/* PWA Install Button */}
              {showInstallPrompt && (
                <button
                  onClick={handlePWAInstall}
                  className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 dark:from-purple-600 dark:to-indigo-700 text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex items-center justify-center gap-2 mt-4"
                >
                  <Download size={24} />
                  Install Zikri App
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calendar Activity Tracker screen
  if (screen === "calendar") {
    const dailyStats = currentUser?.dailyStats || {};

    // Helper function to get stats for a specific date
    const getStatsForDate = (date) => {
      const dateStr = date.toISOString().split("T")[0];
      return dailyStats[dateStr] || { taps: 0, points: 0, time: 0 };
    };

    // Get data based on current view
    const getViewData = () => {
      const data = [];
      const today = new Date(selectedDate);

      if (calendarView === "week") {
        // Get last 7 days
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const stats = getStatsForDate(date);
          data.push({
            date,
            label: date.toLocaleDateString("en-US", { weekday: "short" }),
            value: stats[calendarMetric],
          });
        }
      } else if (calendarView === "month") {
        // Get last 30 days
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const stats = getStatsForDate(date);
          data.push({
            date,
            label: date.getDate().toString(),
            value: stats[calendarMetric],
          });
        }
      } else if (calendarView === "year") {
        // Get last 12 months
        for (let i = 11; i >= 0; i--) {
          const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
          // Sum all days in that month
          const daysInMonth = new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
          ).getDate();
          let monthTotal = 0;
          for (let day = 1; day <= daysInMonth; day++) {
            const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
            const stats = getStatsForDate(dayDate);
            monthTotal += stats[calendarMetric];
          }
          data.push({
            date,
            label: date.toLocaleDateString("en-US", { month: "short" }),
            value: monthTotal,
          });
        }
      } else {
        // Day view - just today
        const stats = getStatsForDate(today);
        data.push({
          date: today,
          label: "Today",
          value: stats[calendarMetric],
        });
      }

      return data;
    };

    const viewData = getViewData();
    const maxValue = Math.max(...viewData.map((d) => d.value), 1);
    const todayStats = getStatsForDate(new Date());

    // Calculate totals based on view
    const calculateTotals = () => {
      let totalTaps = 0,
        totalPoints = 0,
        totalTime = 0;
      viewData.forEach((d) => {
        const stats = getStatsForDate(d.date);
        totalTaps += stats.taps;
        totalPoints += stats.points;
        totalTime += stats.time;
      });
      return { totalTaps, totalPoints, totalTime };
    };

    const totals = calculateTotals();

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#ffffff] p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
                <Calendar className="text-emerald-600" size={28} />
                Zikr Calendar
              </h2>
              <button
                onClick={() => setScreen("menu")}
                className="text-[#4f46e5] font-semibold hover:underline"
              >
                Back
              </button>
            </div>

            {/* Metric Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCalendarMetric("taps")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  calendarMetric === "taps"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Taps
              </button>
              <button
                onClick={() => setCalendarMetric("points")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  calendarMetric === "points"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Points
              </button>
              <button
                onClick={() => setCalendarMetric("time")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  calendarMetric === "time"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Time
              </button>
            </div>

            {/* View Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setCalendarView("week")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  calendarView === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setCalendarView("month")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  calendarView === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setCalendarView("year")}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                  calendarView === "year"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Year
              </button>
            </div>
          </div>

          {/* Today's Summary */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <h3 className="text-lg font-bold text-[#0f172a] mb-4">
              Today's Activity
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <p className="text-sm text-gray-600 mb-1">Taps</p>
                <p className="text-xl font-bold text-emerald-700 break-words">
                  {todayStats.taps}
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Points</p>
                <p className="text-xl font-bold text-purple-700 break-words">
                  {todayStats.points}
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Time</p>
                <p className="text-xl font-bold text-blue-700">
                  {Math.floor(todayStats.time / 60)}m
                </p>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <h3 className="text-lg font-bold text-[#0f172a] mb-4">
              {calendarView === "week"
                ? "Last 7 Days"
                : calendarView === "month"
                  ? "Last 30 Days"
                  : "Last 12 Months"}
            </h3>

            <div className="space-y-3">
              {viewData.map((item, index) => {
                const percentage = calculatePercentage(item.value, maxValue);
                const isToday =
                  item.date.toDateString() === new Date().toDateString();

                return (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className={`w-16 text-sm font-semibold ${isToday ? "text-emerald-600" : "text-gray-600"}`}
                    >
                      {item.label}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isToday
                            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                            : "bg-gradient-to-r from-emerald-400 to-teal-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-3">
                        <span className="text-sm font-bold text-gray-700">
                          {calendarMetric === "time"
                            ? `${Math.floor(item.value / 60)}m`
                            : item.value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Period Summary */}
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-[#cbd5e1]">
            <h3 className="text-lg font-bold text-[#0f172a] mb-4">
              Period Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Taps</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {totals.totalTaps}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Points</p>
                <p className="text-2xl font-bold text-purple-600">
                  {totals.totalPoints}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Time</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.floor(totals.totalTime / 60)}m
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // My Profile screen
  if (screen === "my-profile") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Avatar Display */}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-3xl border-2 border-purple-300">
                  {profileAvatar === "dove" && "🕊️"}
                  {profileAvatar === "bee" && "🐝"}
                  {profileAvatar === "deer" && "🦌"}
                  {profileAvatar === "fish" && "🐟"}
                  {profileAvatar === "eagle" && "🦅"}
                  {profileAvatar === "camel" && "🐪"}
                  {profileAvatar === "lion" && "🦁"}
                  {profileAvatar === "horse" && "🐎"}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#0f172a]">
                    {currentUser?.username ||
                      currentUser?.displayName ||
                      "My Profile"}
                  </h2>
                  <p className="text-sm text-[#64748b]">
                    Customize your experience
                  </p>
                </div>
              </div>
              <button
                onClick={() => setScreen("menu")}
                className="text-[#4f46e5] font-semibold hover:underline"
              >
                Back
              </button>
            </div>
          </div>

          {/* User Info */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <h3 className="text-xl font-bold text-[#0f172a] mb-4">
              User Information
            </h3>
            <div className="space-y-4">
              {/* Username Display (Read-only) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium">
                  {currentUser?.username || currentUser?.displayName || "User"}
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setUserGender("male")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      userGender === "male"
                        ? "bg-blue-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-blue-100"
                    }`}
                  >
                    Male
                  </button>
                  <button
                    onClick={() => setUserGender("female")}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                      userGender === "female"
                        ? "bg-pink-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-pink-100"
                    }`}
                  >
                    Female
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                  <p className="text-sm text-emerald-600 mb-1">Total Points</p>
                  <p className="text-xl font-bold text-emerald-700 break-words">
                    {formatNumber(totalPoints)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <p className="text-sm text-purple-600 mb-1">Current Streak</p>
                  <p className="text-xl font-bold text-purple-700">
                    {currentUser?.currentStreak || 0} days
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1] dark:border-gray-700">
            <h3 className="text-xl font-bold text-[#0f172a] dark:text-white mb-4 flex items-center gap-2">
              <Zap className="text-blue-500 dark:text-blue-400" size={24} />
              Preferences
            </h3>

            <div className="space-y-6">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    Sound Effects
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable tap sounds and audio feedback
                  </p>
                </div>
                <button
                  onClick={toggleSounds}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    soundsEnabled ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      soundsEnabled ? "transform translate-x-8" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Phrase Audio Toggle (NEW!) */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    Phrase Audio 🎵
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hear each zikr phrase when tapped
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newState = !phraseAudioEnabled;
                    setPhraseAudioEnabled(newState);
                    console.log(
                      `[PHRASE AUDIO] ${newState ? "Enabled" : "Disabled"}`,
                    );
                  }}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    phraseAudioEnabled ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      phraseAudioEnabled ? "transform translate-x-8" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Phrase Audio Volume (NEW!) */}
              {phraseAudioEnabled && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-100">
                        Phrase Volume
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Adjust phrase audio loudness
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(phraseAudioVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={phraseAudioVolume * 100}
                    onChange={(e) => {
                      const newVolume = parseInt(e.target.value) / 100;
                      setPhraseAudioVolume(newVolume);
                      // Update all loaded phrase audio volumes
                      Object.values(phraseAudioRefs.current).forEach(
                        (audio) => {
                          if (audio) audio.volume = newVolume;
                        },
                      );
                      console.log(
                        `[PHRASE AUDIO] Volume set to ${Math.round(newVolume * 100)}%`,
                      );
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              )}

              {/* Speed Control */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      Zikr Speed
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Adjust phrase movement speed
                    </p>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {phraseSpeed === 1
                      ? "Slow"
                      : phraseSpeed === 2
                        ? "Medium"
                        : "Fast"}
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPhraseSpeed(speed)}
                      className={`flex-1 py-2 rounded-lg font-semibold transition-all ${
                        phraseSpeed === speed
                          ? "bg-blue-500 dark:bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-gray-600"
                      }`}
                    >
                      {speed === 1 ? "Slow" : speed === 2 ? "Medium" : "Fast"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leaderboard Visibility Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    Leaderboard Visibility
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Show your score on the leaderboard
                  </p>
                </div>
                <button
                  onClick={() => setLeaderboardVisible(!leaderboardVisible)}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    leaderboardVisible ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      leaderboardVisible ? "transform translate-x-8" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    Dark Mode
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Switch to dark theme
                  </p>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    darkMode ? "bg-indigo-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform flex items-center justify-center text-xs ${
                      darkMode ? "transform translate-x-8" : ""
                    }`}
                  >
                    {darkMode ? "🌙" : "☀️"}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1] dark:border-gray-700">
            <h3 className="text-xl font-bold text-[#0f172a] dark:text-white mb-4 flex items-center gap-2">
              <Bell
                className="text-emerald-500 dark:text-emerald-400"
                size={24}
              />
              Notification Settings
            </h3>

            <div className="space-y-6">
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-700">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    Enable Notifications
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Get reminders to do your daily Azkar
                  </p>
                  {notificationPermission === "denied" && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      ⚠️ Permission denied. Enable in browser settings.
                    </p>
                  )}
                  {notificationPermission === "default" && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      Click to request permission
                    </p>
                  )}
                </div>
                <button
                  onClick={async () => {
                    if (notificationPermission === "default") {
                      const granted = await requestNotificationPermission();
                      setNotificationPermission(granted ? "granted" : "denied");
                      if (granted) {
                        setNotificationSettings((prev) => ({
                          ...prev,
                          enabled: true,
                        }));
                      }
                    } else if (notificationPermission === "granted") {
                      setNotificationSettings((prev) => ({
                        ...prev,
                        enabled: !prev.enabled,
                      }));
                    }
                  }}
                  disabled={notificationPermission === "denied"}
                  className={`relative w-16 h-8 rounded-full transition-colors ${
                    notificationSettings.enabled &&
                    notificationPermission === "granted"
                      ? "bg-emerald-500 dark:bg-emerald-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  } ${notificationPermission === "denied" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                      notificationSettings.enabled &&
                      notificationPermission === "granted"
                        ? "transform translate-x-8"
                        : ""
                    }`}
                  />
                </button>
              </div>

              {/* Test Notification Button */}
              {notificationPermission === "granted" &&
                notificationSettings.enabled && (
                  <button
                    onClick={() => sendTestNotification()}
                    className="w-full py-3 bg-blue-500 dark:bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Bell size={20} />
                    Send Test Notification
                  </button>
                )}

              {/* Individual Notification Types */}
              {notificationSettings.enabled &&
                notificationPermission === "granted" && (
                  <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Customize Notifications:
                    </p>

                    {/* Morning */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          ☀️ Morning Reminder
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          7:00 AM daily
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            morning: {
                              ...prev.morning,
                              enabled: !prev.morning.enabled,
                            },
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notificationSettings.morning.enabled
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            notificationSettings.morning.enabled
                              ? "transform translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Evening */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          🌆 Evening Reminder
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          6:00 PM daily
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            evening: {
                              ...prev.evening,
                              enabled: !prev.evening.enabled,
                            },
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notificationSettings.evening.enabled
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            notificationSettings.evening.enabled
                              ? "transform translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Night */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          🌙 Night Reminder
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          9:00 PM daily
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            night: {
                              ...prev.night,
                              enabled: !prev.night.enabled,
                            },
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notificationSettings.night.enabled
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            notificationSettings.night.enabled
                              ? "transform translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Friday */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          🕌 Friday Salawat
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Friday 12:00 PM
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            friday: {
                              ...prev.friday,
                              enabled: !prev.friday.enabled,
                            },
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notificationSettings.friday.enabled
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            notificationSettings.friday.enabled
                              ? "transform translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Streak Risk */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          ⚠️ Streak Protection
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Alert if you haven't played
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            streakRisk: {
                              ...prev.streakRisk,
                              enabled: !prev.streakRisk.enabled,
                            },
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notificationSettings.streakRisk.enabled
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            notificationSettings.streakRisk.enabled
                              ? "transform translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Fun Random Messages */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          🎉 Fun Reminders
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Random creative messages
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            randomMessages: {
                              ...prev.randomMessages,
                              enabled: !prev.randomMessages.enabled,
                            },
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notificationSettings.randomMessages.enabled
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            notificationSettings.randomMessages.enabled
                              ? "transform translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Achievement Notifications */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-100">
                          🎉 Achievements
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          When you unlock badges
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setNotificationSettings((prev) => ({
                            ...prev,
                            achievements: {
                              ...prev.achievements,
                              enabled: !prev.achievements.enabled,
                            },
                          }))
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          notificationSettings.achievements.enabled
                            ? "bg-emerald-500"
                            : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                            notificationSettings.achievements.enabled
                              ? "transform translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>

          {/* Profile Avatar Selection */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1] dark:border-gray-700">
            <h3 className="text-xl font-bold text-[#0f172a] dark:text-white mb-4 flex items-center gap-2">
              <User
                className="text-purple-500 dark:text-purple-400"
                size={24}
              />
              Profile Avatar
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Choose your profile picture
            </p>

            <div className="grid grid-cols-4 gap-3">
              {[
                { id: "dove", emoji: "🕊️", name: "Dove" },
                { id: "bee", emoji: "🐝", name: "Bee" },
                { id: "deer", emoji: "🦌", name: "Deer" },
                { id: "fish", emoji: "🐟", name: "Fish" },
                { id: "eagle", emoji: "🦅", name: "Eagle" },
                { id: "camel", emoji: "🐪", name: "Camel" },
                { id: "lion", emoji: "🦁", name: "Lion" },
                { id: "horse", emoji: "🐎", name: "Horse" },
              ].map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setProfileAvatar(avatar.id)}
                  className={`p-4 rounded-xl transition-all flex flex-col items-center gap-2 ${
                    profileAvatar === avatar.id
                      ? "bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-purple-100 hover:shadow-md"
                  }`}
                >
                  <span className="text-3xl">{avatar.emoji}</span>
                  <span
                    className={`text-xs font-semibold ${
                      profileAvatar === avatar.id
                        ? "text-white"
                        : "text-gray-600"
                    }`}
                  >
                    {avatar.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Share & Actions */}
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-[#cbd5e1]">
            <h3 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
              <Sparkles className="text-purple-500" size={24} />
              Share & More
            </h3>

            <div className="space-y-3">
              {/* Share Score */}
              <button
                onClick={() => {
                  const avatarEmojis = {
                    dove: "🕊️",
                    bee: "🐝",
                    deer: "🦌",
                    fish: "🐟",
                    eagle: "🦅",
                    camel: "🐪",
                    lion: "🦁",
                    horse: "🐎",
                  };
                  const displayName =
                    currentUser?.username ||
                    currentUser?.displayName ||
                    "A Zakir";
                  const avatarEmoji = avatarEmojis[profileAvatar] || "🕊️";
                  const shareText = `${avatarEmoji} ${displayName} here!\\n\\n🕌 I've earned ${formatNumber(totalPoints)} points on Zikri!\\n📿 Current streak: ${currentUser?.currentStreak || 0} days\\n\\nJoin me in remembering Allah! 🌟`;
                  if (navigator.share) {
                    navigator
                      .share({
                        title: "My Zikri Progress",
                        text: shareText,
                      })
                      .catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert("Score copied to clipboard! 📋");
                  }
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                Share My Progress
              </button>

              {/* Sign Out */}
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to sign out?")) {
                    await logoutUser();
                    setCurrentUser(null);
                    setScreen("auth");
                  }
                }}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  if (screen === "game") {
    // Get mode display info
    const modeInfo = {
      focus: { name: "Focus Mode", color: "emerald", icon: Target },
      asma: { name: "Asma ul Husna", color: "purple", icon: Star },
      tasbih: { name: "Tasbih Mode", color: "blue", icon: Circle },
    };
    const currentMode = modeInfo[gameMode] || modeInfo.focus;
    const ModeIcon = currentMode.icon;

    // Get background styling
    const backgroundClass =
      gameMode === "focus" || gameMode === "asma" || gameMode === "tasbih"
        ? "" // Focus, Asma, and Tasbih modes use image backgrounds
        : "bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100";

    return (
      <div
        className={`min-h-screen ${backgroundClass} relative overflow-hidden`}
      >
        {/* Dynamic Background Image for Focus Mode */}
        {gameMode === "focus" && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-2000"
              style={{
                backgroundImage: `url(/assets/backgrounds/${currentBackgroundIndex}.jpg)`,
                opacity: 1,
              }}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/10" />
          </>
        )}

        {/* Static Background Image for Tasbih Mode */}
        {gameMode === "tasbih" && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(/assets/backgrounds/101.jpg)`,
              }}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/10" />
          </>
        )}

        {/* Static Background Image for Asma ul Husna Mode */}
        {gameMode === "asma" && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(/assets/backgrounds/201.jpg)`,
              }}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/10" />
          </>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm shadow-lg p-4 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Mode-specific display */}
              {gameMode === "focus" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-emerald-600">
                      {sessionScore}
                    </div>
                    <div className="text-gray-600 text-sm">session pts</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  {/* Audio Control for Focus Mode */}
                  <button
                    onClick={toggleAudioMute}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
                  >
                    {isAudioMuted ? (
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-emerald-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="h-8 w-px bg-gray-300"></div>
                  {/* Pause Button for Focus Mode */}
                  <button
                    onClick={togglePause}
                    className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Play size={24} /> : <Pause size={24} />}
                  </button>
                </>
              )}

              {gameMode === "asma" && (
                <>
                  {/* Compact Next Unlock Info */}
                  {(() => {
                    const currentUnlocked =
                      getUnlockedAsmaIds(asmaTotalTaps).length;
                    const nextUnlockAt = (currentUnlocked + 1) * 33;
                    const tapsRemaining = nextUnlockAt - asmaTotalTaps;
                    const nextName =
                      currentUnlocked < 99
                        ? NAMES_OF_ALLAH[currentUnlocked]
                        : null;

                    return nextName && tapsRemaining > 0 ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-purple-600 font-semibold">
                          Next: {nextName.transliteration}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-purple-600 font-semibold">
                        All names unlocked! 🎉
                      </div>
                    );
                  })()}
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-bold text-purple-600">
                      {asmaTotalTaps}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <Star
                      className="text-purple-500 fill-purple-500"
                      size={18}
                    />
                    <div className="text-lg font-bold text-purple-600">
                      {getUnlockedAsmaIds(asmaTotalTaps).length}/99
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  {/* Pause Button for Asma Mode */}
                  <button
                    onClick={togglePause}
                    className="p-2 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-all shadow-lg"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Play size={24} /> : <Pause size={24} />}
                  </button>
                </>
              )}

              {gameMode === "tasbih" && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl font-bold text-blue-600">
                      {tasbihCurrentCount}
                    </div>
                    <span className="text-gray-400 font-bold text-xl">/</span>
                    <div className="text-2xl font-bold text-gray-600">
                      {tasbihTargetCount}
                    </div>
                    <div className="ml-2 text-sm text-blue-600 font-semibold">
                      (
                      {Math.round(
                        (tasbihCurrentCount / tasbihTargetCount) * 100,
                      )}
                      %)
                    </div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  {/* Pause Button for Tasbih Mode */}
                  <button
                    onClick={togglePause}
                    className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all shadow-lg"
                    title={isPaused ? "Resume" : "Pause"}
                  >
                    {isPaused ? <Play size={24} /> : <Pause size={24} />}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Background change notification */}
        {showBackgroundChange && (
          <div className="absolute top-32 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
            <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl px-8 py-4 border-2 border-emerald-400">
              <p className="text-lg font-bold text-emerald-700 text-center">
                {backgroundMessage}
              </p>
            </div>
          </div>
        )}

        {/* Game area */}
        <div className="absolute inset-0 pt-20">
          {phrases.map((phrase) => {
            const colors = getPhraseColor(phrase.data.id);
            const isNewlyUnlocked = phrase.isNewlyUnlocked;

            return (
              <div
                key={phrase.id}
                id={`phrase-${phrase.id}`}
                onClick={(e) =>
                  handlePhraseTap(
                    e,
                    phrase.id,
                    phrase.data.points,
                    phrase.data.id,
                    phrase.isNewlyUnlocked,
                  )
                }
                style={{
                  position: "absolute",
                  left: `${phrase.position}%`,
                  top: `${phrase.verticalPosition}%`,
                  transform: "translateY(-50%) translateZ(0)", // Hardware acceleration
                  willChange: "left",
                  backfaceVisibility: "hidden", // Prevent flicker
                }}
                className="cursor-pointer select-none"
              >
                <div
                  className={`rounded-2xl shadow-xl px-6 py-4 transition-shadow duration-200 border-2 ${
                    isNewlyUnlocked
                      ? "bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 border-yellow-500 animate-pulse"
                      : `bg-gradient-to-r ${colors.bg} ${colors.border}`
                  }`}
                  style={
                    isNewlyUnlocked
                      ? {
                          boxShadow:
                            "0 0 30px gold, 0 0 60px gold, 0 0 90px gold",
                          animation:
                            "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                        }
                      : {}
                  }
                >
                  <p
                    className={`text-3xl font-bold text-center ${isNewlyUnlocked ? "text-yellow-900" : colors.text}`}
                    style={{ fontFamily: "Arial" }}
                  >
                    {phrase.data.arabic}
                  </p>
                  {isNewlyUnlocked && (
                    <div className="mt-1">
                      <p className="text-xs text-center text-yellow-800 font-bold animate-pulse">
                        ✨ NEW! ✨
                      </p>
                      <p className="text-xs text-center text-yellow-700 font-semibold mt-1">
                        {phrase.data.transliteration}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pause overlay */}
        {isPaused && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20">
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Paused</h2>
              <p className="text-gray-600 mb-6">Take a moment to breathe</p>
              <button
                onClick={togglePause}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  stopGameLoop();

                  // Play completion sound for end of session
                  playSound("completion");

                  // Save progress before quitting
                  const duration = gameStartTimeRef.current
                    ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000)
                    : 0;

                  // Calculate session score from ALL modes (same as endGame)
                  let finalSessionScore = 0;
                  if (gameMode === "focus") {
                    finalSessionScore = sessionScoreRef.current;
                  } else if (gameMode === "asma") {
                    finalSessionScore = asmaSessionScore;
                  } else if (gameMode === "tasbih") {
                    finalSessionScore = tasbihSessionScore;
                  }

                  const newTotalPoints = totalPoints + finalSessionScore;
                  const accuracy = calculatePercentage(
                    sessionStats.totalTaps,
                    sessionStats.totalTaps + sessionStats.missedPhrases,
                  );

                  console.log("[QUIT] Saving progress:");
                  console.log("  - Game Mode:", gameMode);
                  console.log("  - Session Score:", finalSessionScore);
                  console.log("  - New Total Points:", newTotalPoints);

                  setTotalPoints(newTotalPoints);

                  // Update session stats for display
                  setSessionStats((prev) => ({
                    ...prev,
                    accuracy,
                    duration,
                  }));

                  saveProgress(
                    newTotalPoints,
                    duration,
                    accuracy,
                    finalSessionScore,
                  );
                  // ✨ Set a random Zikr Fact for the results screen
                  const randomFact =
                    ZIKR_FACTS[Math.floor(Math.random() * ZIKR_FACTS.length)];
                  setCurrentZikrFact(randomFact);
                  setScreen("stats"); // Show stats screen instead of menu
                }}
                className="block w-full mt-4 text-red-600 hover:underline"
              >
                Quit
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stats screen
  if (screen === "stats") {
    // Total points already includes session score from endGame()
    const finalTotalPoints = totalPoints;

    // Determine congratulatory message based on performance
    let congratsMessage = "Well done!";
    let encouragementMessage = "May Allah accept your dhikr";

    // Mode-specific messages
    if (gameMode === "focus") {
      if (sessionScore >= 500) {
        congratsMessage = "Masha Allah! Outstanding! 🌟";
        encouragementMessage = "Your dedication is truly inspiring!";
      } else if (sessionScore >= 300) {
        congratsMessage = "Excellent work! 🎉";
        encouragementMessage = "Keep up the amazing effort!";
      } else if (sessionScore >= 150) {
        congratsMessage = "Great job! ✨";
        encouragementMessage = "You're making wonderful progress!";
      } else if (sessionScore >= 50) {
        congratsMessage = "Good effort! 💫";
        encouragementMessage = "Every step counts!";
      }
    } else if (gameMode === "asma") {
      const sessionTaps = sessionStats.totalTaps;
      // Calculate names unlocked THIS SESSION (end count - start count)
      const namesAtSessionEnd = getUnlockedAsmaIds(asmaTotalTaps).length;
      const namesUnlockedThisSession =
        namesAtSessionEnd - sessionStartAsmaCount;

      if (sessionTaps >= 100) {
        congratsMessage = "Masha Allah! Beautiful! 🌟";
      } else if (sessionTaps >= 50) {
        congratsMessage = "Excellent recitation! 🎉";
      } else {
        congratsMessage = "Well done! ✨";
      }
      encouragementMessage = `${namesUnlockedThisSession} name${namesUnlockedThisSession !== 1 ? "s" : ""} unlocked this session!`;
    } else if (gameMode === "tasbih") {
      if (tasbihCompleted) {
        // Completed successfully
        congratsMessage = "Goal Completed! 🎯";
        encouragementMessage = `${tasbihTargetCount} repetitions of ${tasbihSelectedPhrase?.transliteration || "dhikr"}`;
      } else {
        // Ended early (missed too many)
        congratsMessage = "Better luck next time! 💪";
        encouragementMessage = `Keep practicing! You'll complete it next time, insha'Allah`;
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 flex items-center justify-center relative overflow-hidden">
        {/* Celebration decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">
            🎉
          </div>
          <div
            className="absolute top-20 right-20 text-5xl animate-bounce"
            style={{ animationDelay: "0.2s" }}
          >
            ✨
          </div>
          <div
            className="absolute bottom-20 left-20 text-5xl animate-bounce"
            style={{ animationDelay: "0.4s" }}
          >
            ⭐
          </div>
          <div
            className="absolute bottom-10 right-10 text-6xl animate-bounce"
            style={{ animationDelay: "0.6s" }}
          >
            🌟
          </div>
          <div className="absolute top-1/2 left-5 text-4xl animate-pulse">
            💫
          </div>
          <div
            className="absolute top-1/3 right-10 text-4xl animate-pulse"
            style={{ animationDelay: "0.3s" }}
          >
            🎊
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative z-10">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full p-6 mb-4 animate-bounce">
              <Trophy size={48} />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              {congratsMessage}
            </h2>
            <p className="text-gray-600 text-lg">{encouragementMessage}</p>
            <div className="mt-4 flex justify-center gap-2">
              <Sparkles className="text-yellow-500 animate-pulse" size={24} />
              <Star
                className="text-yellow-400 animate-pulse fill-yellow-400"
                size={24}
                style={{ animationDelay: "0.2s" }}
              />
              <Sparkles
                className="text-yellow-500 animate-pulse"
                size={24}
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          </div>

          <div className="space-y-4 mb-8">
            {/* Mode-specific primary stat */}
            {gameMode === "focus" && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border-2 border-emerald-200">
                <p className="text-gray-600 text-sm mb-1">Points Earned</p>
                <p className="text-2xl font-bold text-emerald-600 break-words">
                  +{formatNumber(sessionScore)}
                </p>
              </div>
            )}

            {gameMode === "asma" && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                <p className="text-gray-600 text-sm mb-1">Session Taps</p>
                <p className="text-2xl font-bold text-purple-600 break-words">
                  {sessionStats.totalTaps}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Total: {asmaTotalTaps} taps |{" "}
                  {getUnlockedAsmaIds(asmaTotalTaps).length}/99 names
                </p>
              </div>
            )}

            {gameMode === "tasbih" && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
                <p className="text-gray-600 text-sm mb-1">Completed</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tasbihTargetCount}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {tasbihSelectedPhrase?.arabic}
                </p>
                {tasbihSelectedPhrase &&
                  tasbihTotalCounts[tasbihSelectedPhrase.id] && (
                    <p className="text-xs text-gray-500 mt-1">
                      All-time Tasbih count:{" "}
                      {tasbihTotalCounts[tasbihSelectedPhrase.id]}
                    </p>
                  )}
              </div>
            )}

            {/* Common stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <p className="text-gray-600 text-sm mb-1">Taps</p>
                <p className="text-2xl font-bold text-blue-600">
                  {sessionStats.totalTaps}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <p className="text-gray-600 text-sm mb-1">Duration</p>
                <p className="text-2xl font-bold text-green-600">
                  {sessionStats.duration}s
                </p>
              </div>
            </div>

            {/* ✨ ZIKR FACT SECTION - Educational & Spiritual */}
            {currentZikrFact && gameMode !== "tasbih" && (
              <div
                className={`bg-gradient-to-br ${currentZikrFact.gradient} rounded-2xl p-5 border-2 border-white/50 shadow-lg`}
              >
                {/* Icon and Title */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{currentZikrFact.icon}</span>
                  <h3 className="text-white font-bold text-lg drop-shadow-md">
                    {currentZikrFact.title}
                  </h3>
                </div>

                {/* Fact Text */}
                <p className="text-white text-base leading-relaxed mb-3 drop-shadow">
                  {currentZikrFact.fact}
                </p>

                {/* Source */}
                <p className="text-white/90 text-xs italic drop-shadow">
                  — {currentZikrFact.source}
                </p>
              </div>
            )}

            {gameMode === "focus" && (
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-indigo-300">
                <p className="text-gray-600 text-sm mb-1">Total Points</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {finalTotalPoints}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                console.log(`[PLAY AGAIN] Restarting with mode: ${gameMode}`);
                if (gameMode === "tasbih") {
                  // Reset Tasbih count for replay
                  setTasbihCurrentCount(0);
                  tasbihCurrentCountRef.current = 0;
                }
                startGame(gameMode);
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Play Again
            </button>
            <button
              onClick={() => setScreen("mode-select")}
              className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Back to Menu
            </button>
          </div>
        </div>

        {/* Achievement Unlocked Celebration Modal */}
        {showAchievementUnlocked && unlockedAchievementIds.length > 0 && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]"
            onClick={() => setShowAchievementUnlocked(false)}
          >
            <div
              className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] rounded-3xl p-8 max-w-md mx-4 shadow-2xl border-4 border-yellow-400"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {/* Celebration Icon */}
                <div className="text-6xl mb-4 animate-bounce">🎉</div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-yellow-300 mb-6">
                  Achievement{unlockedAchievementIds.length > 1 ? "s" : ""}{" "}
                  Unlocked!
                </h2>

                {/* Achievement Details */}
                <div className="space-y-4 mb-6">
                  {unlockedAchievementIds.map((achievementId) => {
                    const achievement = ACHIEVEMENTS.find(
                      (a) => a.id === achievementId,
                    );
                    if (!achievement) return null;

                    return (
                      <div
                        key={achievementId}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/50"
                      >
                        <div className="text-5xl mb-2">{achievement.icon}</div>
                        <h3 className="text-xl font-bold text-yellow-200 mb-1">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-purple-200 mb-2">
                          {achievement.nameEn}
                        </p>
                        <p className="text-sm text-gray-300">
                          {achievement.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Share Button */}
                <button
                  onClick={() => {
                    const achievementName = ACHIEVEMENTS.find((a) =>
                      unlockedAchievementIds.includes(a.id),
                    )?.name;
                    if (achievementName) {
                      triggerShare("achievement", { name: achievementName });
                      setShowAchievementUnlocked(false);
                    }
                  }}
                  className="w-full mb-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={20} />
                  Share Achievement
                </button>

                {/* Continue Button */}
                <button
                  onClick={() => setShowAchievementUnlocked(false)}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 px-8 py-3 rounded-xl font-bold text-lg hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg"
                >
                  Amazing! 🌟
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Profile screen
  if (screen === "profile") {
    const unlockedIds = getUnlockedPhraseIds(totalPoints);
    const unlockedPhrases = ZIKR_PHRASES.filter((p) =>
      unlockedIds.includes(p.id),
    );
    const lockedPhrases = ZIKR_PHRASES.filter(
      (p) => !unlockedIds.includes(p.id),
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#ffffff] dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1] dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#0f172a] dark:text-white">
                Zikr Phrases
              </h2>
              <button
                onClick={() => setScreen("menu")}
                className="text-[#4f46e5] dark:text-emerald-400 font-semibold hover:underline"
              >
                Back
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f8fafc] dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 border border-[#cbd5e1] dark:border-gray-600">
                <p className="text-[#64748b] dark:text-gray-300 text-sm mb-1">
                  Total Points
                </p>
                <p className="text-2xl font-bold text-[#4f46e5] dark:text-emerald-400 break-words">
                  {formatNumber(totalPoints)}
                </p>
              </div>
              <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f8fafc] dark:from-gray-700 dark:to-gray-600 rounded-2xl p-4 border border-[#cbd5e1] dark:border-gray-600">
                <p className="text-[#64748b] dark:text-gray-300 text-sm mb-1">
                  Total Zikr Time
                </p>
                <p className="text-2xl font-bold text-[#a855f7] dark:text-purple-400">
                  {Math.floor((currentUser?.totalZikrTime || 0) / 60)}m
                </p>
              </div>
            </div>
          </div>

          {/* Streak Freeze Management */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <h3 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
              <Shield className="text-blue-600" size={24} />
              Streak Freeze Tokens
            </h3>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-4 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Available Tokens</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {calculateFreezeTokens(currentUser?.totalPoints || 0) -
                      (currentUser?.activeFreezes || []).length}
                    <span className="text-xl text-gray-500">/10</span>
                  </p>
                </div>
                <Shield className="text-blue-600" size={64} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Points</span>
                  <span className="font-bold text-gray-800">
                    {currentUser?.totalPoints || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tokens Earned</span>
                  <span className="font-bold text-blue-600">
                    {calculateFreezeTokens(currentUser?.totalPoints || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tokens Used</span>
                  <span className="font-bold text-gray-800">
                    {(currentUser?.activeFreezes || []).length}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>How it works:</strong>
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Earn 1 token every 30,000 total points</li>
                  <li>Max 10 tokens (perfect for Ramadan etikaf!)</li>
                  <li>Auto-protect: Tokens used if you miss a day</li>
                  <li>Manual: Plan ahead for travel or special events</li>
                </ul>
              </div>

              <button
                onClick={() => setShowFreezeCalendar(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Shield size={20} />
                Schedule Freeze Dates
              </button>
            </div>

            {/* Active Freezes */}
            {(currentUser?.activeFreezes || []).length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="font-semibold text-gray-800 mb-3">
                  Active Freezes:
                </p>
                <div className="space-y-2">
                  {(currentUser?.activeFreezes || [])
                    .sort()
                    .map((dateString) => {
                      const date = new Date(dateString + "T00:00:00");
                      return (
                        <div
                          key={dateString}
                          className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200"
                        >
                          <span className="text-sm font-medium text-gray-700">
                            {date.toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                          <span className="text-green-600 font-semibold flex items-center gap-1 text-sm">
                            <Shield size={14} />
                            Protected
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Unlocked Phrases */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <h3 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
              <Unlock className="text-[#10b981]" size={24} />
              Unlocked Phrases ({unlockedPhrases.length})
            </h3>
            <div className="space-y-3">
              {unlockedPhrases.map((phrase) => {
                const phraseCount =
                  (currentUser?.phraseCounts || {})[phrase.id] || 0;
                return (
                  <div
                    key={phrase.id}
                    className="bg-gradient-to-r from-[#e0e7ff] to-[#f8fafc] rounded-xl p-4 border-2 border-[#4f46e5]"
                  >
                    <p
                      className="text-2xl font-bold text-[#0f172a] mb-2"
                      style={{ fontFamily: "Arial" }}
                    >
                      {phrase.arabic}
                    </p>
                    <p className="text-sm font-semibold text-[#4f46e5] mb-1">
                      {phrase.transliteration}
                    </p>
                    <p className="text-sm text-[#64748b] mb-2">
                      {phrase.translation}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="bg-[#4f46e5] text-white text-xs px-2 py-1 rounded-full font-semibold">
                        +{phrase.points} pts
                      </span>
                      <span className="text-sm font-bold text-[#10b981] bg-[#d1fae5] px-3 py-1 rounded-full">
                        {formatNumber(phraseCount)} times
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locked Phrases */}
          {lockedPhrases.length > 0 && (
            <div className="bg-white rounded-3xl shadow-lg p-6 border border-[#cbd5e1]">
              <h3 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                <Lock className="text-[#94a3b8]" size={24} />
                Locked Phrases ({lockedPhrases.length})
              </h3>
              <div className="space-y-3">
                {lockedPhrases.map((phrase) => (
                  <div
                    key={phrase.id}
                    className="bg-gradient-to-r from-[#f8fafc] to-[#ffffff] rounded-xl p-4 border-2 border-[#cbd5e1]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="text-[#94a3b8]" size={24} />
                        <div>
                          <p className="text-lg font-bold text-[#94a3b8]">
                            Hidden Phrase #{phrase.id}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#4f46e5] bg-[#e0e7ff] px-3 py-1 rounded-full">
                        {phrase.unlockAt} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Leaderboard screen
  if (screen === "leaderboard") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="text-yellow-500" size={32} />
                <h2 className="text-2xl font-bold text-gray-800">
                  Global Leaderboard
                </h2>
              </div>
              <button
                onClick={() => setScreen("menu")}
                className="text-emerald-600 font-semibold hover:underline"
              >
                Back
              </button>
            </div>
          </div>

          {/* Leaderboard List */}
          <div className="bg-white rounded-3xl shadow-lg p-6">
            {/* Top 10 Section */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-700 mb-4">
                🏆 Top 10
              </h3>
              {leaderboardData
                .filter((user) => {
                  // Hide current user if they disabled visibility
                  if (user.isCurrentUser && !leaderboardVisible) {
                    return false;
                  }
                  return true;
                })
                .map((user) => (
                  <div
                    key={user.userId}
                    className={`rounded-xl p-4 border-2 ${
                      user.isCurrentUser
                        ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 shadow-md"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            user.rank === 1
                              ? "bg-yellow-400 text-yellow-900"
                              : user.rank === 2
                                ? "bg-gray-300 text-gray-700"
                                : user.rank === 3
                                  ? "bg-orange-400 text-orange-900"
                                  : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {user.rank}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {user.username}
                            {user.isCurrentUser && (
                              <span className="ml-2 text-emerald-600 text-sm">
                                (You)
                              </span>
                            )}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Trophy size={14} />
                              {user.totalPoints}
                            </span>
                            <span className="flex items-center gap-1">
                              <Medal size={14} />
                              {user.achievements}
                            </span>
                            {user.currentStreak > 0 && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Flame size={14} />
                                {user.currentStreak}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {user.rank === 1 && (
                        <Crown className="text-yellow-500" size={24} />
                      )}
                    </div>
                  </div>
                ))}
              {leaderboardData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users size={48} className="mx-auto mb-2 opacity-50" />
                  <p>No players yet. Be the first!</p>
                </div>
              )}
            </div>

            {/* User Context Section (if user is not in top 10 AND visibility is enabled) */}
            {leaderboardVisible && leaderboardUserContext.length > 0 && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-gray-500 text-sm">•••</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-700 mb-4">
                    📍 Your Position
                  </h3>
                  {leaderboardUserContext.map((user) => (
                    <div
                      key={user.userId}
                      className={`rounded-xl p-4 border-2 ${
                        user.isCurrentUser
                          ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 shadow-md"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-gray-200 text-gray-600">
                            {user.rank}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              {user.username}
                              {user.isCurrentUser && (
                                <span className="ml-2 text-emerald-600 text-sm">
                                  (You)
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Trophy size={14} />
                                {user.totalPoints}
                              </span>
                              <span className="flex items-center gap-1">
                                <Medal size={14} />
                                {user.achievements}
                              </span>
                              {user.currentStreak > 0 && (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <Flame size={14} />
                                  {user.currentStreak}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Visibility Disabled Message */}
            {!leaderboardVisible && (
              <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Shield className="text-blue-600" size={24} />
                  <div>
                    <p className="font-semibold text-blue-900">
                      Your score is private
                    </p>
                    <p className="text-sm text-blue-700">
                      You're hidden from the leaderboard. Change in My Profile →
                      Preferences.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Achievements screen
  if (screen === "achievements") {
    // Safety check - if no user, redirect to menu
    if (!currentUser || !currentUser.userId) {
      console.error("[ACHIEVEMENTS] No current user, redirecting to menu");
      setScreen("menu");
      return null;
    }

    // Wrap ENTIRE screen in try-catch
    try {
      const userAchievements = currentUser?.achievements || [];
      const unlockedIds = getUnlockedPhraseIds(totalPoints);
      const unlockedPhrases = ZIKR_PHRASES.filter((p) =>
        unlockedIds.includes(p.id),
      );
      const lockedPhrases = ZIKR_PHRASES.filter(
        (p) => !unlockedIds.includes(p.id),
      );

      console.log("[ACHIEVEMENTS] Screen loading successfully");
      console.log("[ACHIEVEMENTS] User achievements:", userAchievements.length);
      console.log("[ACHIEVEMENTS] Unlocked phrases:", unlockedPhrases.length);

      return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#ffffff] p-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Medal className="text-[#a855f7]" size={32} />
                  <div>
                    <h2 className="text-2xl font-bold text-[#0f172a]">
                      Achievements & Phrases
                    </h2>
                    <p className="text-sm text-[#64748b]">
                      {userAchievements.length}/{ACHIEVEMENTS.length}{" "}
                      Achievements • {unlockedPhrases.length}/
                      {ZIKR_PHRASES.length} Phrases
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setScreen("menu")}
                  className="text-[#4f46e5] font-semibold hover:underline"
                >
                  Back
                </button>
              </div>
            </div>

            {/* Achievements Grid - REDESIGNED! */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 mb-6 border border-[#cbd5e1] dark:border-gray-700">
              <h3 className="text-2xl font-bold text-[#0f172a] dark:text-white mb-6 flex items-center gap-2">
                <Medal className="text-[#a855f7]" size={28} />
                Your Achievements
              </h3>

              {/* Beautiful Badge Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {ACHIEVEMENTS.map((achievement) => {
                  try {
                    const isUnlocked = userAchievements.includes(
                      achievement.id,
                    );
                    let progress = 0;

                    // Calculate progress
                    switch (achievement.requirement.type) {
                      case "sessions":
                        progress = Math.min(
                          100,
                          ((currentUser?.sessionsCompleted || 0) /
                            achievement.requirement.count) *
                            100,
                        );
                        break;
                      case "points":
                        progress = Math.min(
                          100,
                          (totalPoints / achievement.requirement.count) * 100,
                        );
                        break;
                      case "streak":
                        progress = Math.min(
                          100,
                          ((currentUser?.currentStreak || 0) /
                            achievement.requirement.count) *
                            100,
                        );
                        break;
                      case "time":
                        progress = Math.min(
                          100,
                          ((currentUser?.totalZikrTime || 0) /
                            achievement.requirement.count) *
                            100,
                        );
                        break;
                      case "unlocked":
                        progress = Math.min(
                          100,
                          (getUnlockedPhraseIds(totalPoints).length /
                            achievement.requirement.count) *
                            100,
                        );
                        break;
                      case "phrase_count":
                        const phraseCount =
                          (currentUser?.phraseCounts || {})[
                            achievement.requirement.phraseId
                          ] || 0;
                        progress = Math.min(
                          100,
                          (phraseCount / achievement.requirement.count) * 100,
                        );
                        break;
                      default:
                        progress = 0;
                    }

                    // Category-specific styling
                    const getCategoryStyle = (category) => {
                      switch (category) {
                        case "consistency":
                          return {
                            gradient: isUnlocked
                              ? "from-emerald-400 via-teal-400 to-cyan-500"
                              : "from-gray-300 to-gray-400",
                            glow: "shadow-emerald-500/50",
                            ring: "ring-emerald-400",
                            progress: "from-emerald-500 to-teal-500",
                          };
                        case "milestone":
                          return {
                            gradient: isUnlocked
                              ? "from-amber-400 via-yellow-400 to-orange-500"
                              : "from-gray-300 to-gray-400",
                            glow: "shadow-amber-500/50",
                            ring: "ring-amber-400",
                            progress: "from-amber-500 to-orange-500",
                          };
                        case "mastery":
                          return {
                            gradient: isUnlocked
                              ? "from-purple-400 via-violet-400 to-indigo-500"
                              : "from-gray-300 to-gray-400",
                            glow: "shadow-purple-500/50",
                            ring: "ring-purple-400",
                            progress: "from-purple-500 to-indigo-500",
                          };
                        case "speed":
                          return {
                            gradient: isUnlocked
                              ? "from-blue-400 via-cyan-400 to-sky-500"
                              : "from-gray-300 to-gray-400",
                            glow: "shadow-blue-500/50",
                            ring: "ring-blue-400",
                            progress: "from-blue-500 to-cyan-500",
                          };
                        default:
                          return {
                            gradient: isUnlocked
                              ? "from-pink-400 via-rose-400 to-red-500"
                              : "from-gray-300 to-gray-400",
                            glow: "shadow-pink-500/50",
                            ring: "ring-pink-400",
                            progress: "from-pink-500 to-rose-500",
                          };
                      }
                    };

                    const style = getCategoryStyle(achievement.category);

                    return (
                      <div
                        key={achievement.id}
                        className={`group relative bg-gradient-to-br ${style.gradient} rounded-2xl p-1 transition-all duration-300 hover:scale-105 ${
                          isUnlocked
                            ? `shadow-xl ${style.glow}`
                            : "shadow-md opacity-50 grayscale"
                        }`}
                      >
                        {/* Inner card */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 h-full flex flex-col items-center text-center relative overflow-hidden">
                          {/* Shimmer effect for unlocked badges */}
                          {isUnlocked && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                          )}

                          {/* Badge Icon */}
                          <div
                            className={`relative w-24 h-24 mb-3 flex items-center justify-center ${
                              isUnlocked ? "animate-float" : ""
                            }`}
                          >
                            {/* Circular dots for mastery badges */}
                            {achievement.category === "mastery" &&
                              achievement.tier && (
                                <div className="absolute inset-0">
                                  {[...Array(achievement.tier)].map(
                                    (_, index) => {
                                      const angle =
                                        (index / achievement.tier) * 360;
                                      const radius = 45; // Distance from center - INCREASED for better spacing
                                      const x =
                                        50 +
                                        radius *
                                          Math.cos(
                                            ((angle - 90) * Math.PI) / 180,
                                          );
                                      const y =
                                        50 +
                                        radius *
                                          Math.sin(
                                            ((angle - 90) * Math.PI) / 180,
                                          );

                                      return (
                                        <div
                                          key={index}
                                          className={`absolute w-2.5 h-2.5 rounded-full ${
                                            isUnlocked
                                              ? `bg-gradient-to-br ${style.gradient}`
                                              : "bg-gray-300 dark:bg-gray-600"
                                          }`}
                                          style={{
                                            left: `${x}%`,
                                            top: `${y}%`,
                                            transform: "translate(-50%, -50%)",
                                          }}
                                        />
                                      );
                                    },
                                  )}
                                </div>
                              )}

                            {/* Glow ring for unlocked */}
                            {isUnlocked && (
                              <div
                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${style.gradient} blur-md opacity-60 animate-pulse`}
                              />
                            )}

                            {/* Icon */}
                            <div
                              className={`relative text-5xl ${isUnlocked ? "scale-110" : "opacity-50"} transition-all duration-300`}
                            >
                              {achievement.icon}
                            </div>

                            {/* Lock icon for locked badges */}
                            {!isUnlocked && (
                              <div className="absolute -bottom-1 -right-1 bg-gray-600 rounded-full p-1">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>

                          {/* Badge Name */}
                          <h4
                            className={`font-bold text-sm mb-1 ${
                              isUnlocked
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {achievement.name}
                          </h4>

                          {/* Badge Description */}
                          <p
                            className={`text-xs mb-2 line-clamp-2 ${
                              isUnlocked
                                ? "text-gray-600 dark:text-gray-300"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {achievement.description}
                          </p>

                          {/* Progress or Status */}
                          {!isUnlocked && progress > 0 ? (
                            <div className="w-full mt-auto">
                              {/* Progress ring */}
                              <div className="relative w-12 h-12 mx-auto mb-2">
                                <svg className="transform -rotate-90 w-12 h-12">
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    className="text-gray-200 dark:text-gray-700"
                                  />
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r="20"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 20}`}
                                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
                                    className={`bg-gradient-to-r ${style.progress} transition-all duration-500`}
                                    strokeLinecap="round"
                                  />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    {Math.round(progress)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : isUnlocked ? (
                            <div
                              className={`mt-auto flex items-center gap-1 text-xs font-bold bg-gradient-to-r ${style.gradient} bg-clip-text text-transparent`}
                            >
                              <Star
                                className={`w-3 h-3 fill-current`}
                                style={{
                                  color:
                                    achievement.category === "consistency"
                                      ? "#10b981"
                                      : achievement.category === "milestone"
                                        ? "#f59e0b"
                                        : achievement.category === "mastery"
                                          ? "#a855f7"
                                          : achievement.category === "speed"
                                            ? "#3b82f6"
                                            : "#ec4899",
                                }}
                              />
                              <span>Unlocked!</span>
                            </div>
                          ) : (
                            <div className="mt-auto text-xs text-gray-400">
                              Locked
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error(
                      "[ACHIEVEMENTS] Error rendering achievement:",
                      achievement?.id,
                      error,
                    );
                    return null;
                  }
                })}
              </div>
            </div>

            {/* Unlocked Phrases */}
            <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
              <h3 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                <Unlock className="text-[#10b981]" size={24} />
                Unlocked Phrases ({unlockedPhrases.length})
              </h3>
              <div className="space-y-3">
                {unlockedPhrases.map((phrase) => {
                  try {
                    const phraseCount =
                      (currentUser?.phraseCounts || {})[phrase.id] || 0;
                    return (
                      <div
                        key={phrase.id}
                        className="bg-gradient-to-r from-[#e0e7ff] to-[#f8fafc] rounded-xl p-4 border-2 border-[#4f46e5]"
                      >
                        <p
                          className="text-2xl font-bold text-[#0f172a] mb-2"
                          style={{ fontFamily: "Arial" }}
                        >
                          {phrase.arabic}
                        </p>
                        <p className="text-sm font-semibold text-[#4f46e5] mb-1">
                          {phrase.transliteration}
                        </p>
                        <p className="text-sm text-[#64748b] mb-2">
                          {phrase.translation}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="bg-[#4f46e5] text-white text-xs px-2 py-1 rounded-full font-semibold">
                            +{phrase.points} pts
                          </span>
                          <span className="text-sm font-bold text-[#10b981] bg-[#d1fae5] px-3 py-1 rounded-full">
                            {formatNumber(phraseCount)} times
                          </span>
                        </div>
                      </div>
                    );
                  } catch (error) {
                    console.error(
                      "[ACHIEVEMENTS] Error rendering phrase:",
                      phrase?.id,
                      error,
                    );
                    return null;
                  }
                })}
              </div>
            </div>

            {/* Locked Phrases */}
            {lockedPhrases.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg p-6 border border-[#cbd5e1]">
                <h3 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
                  <Lock className="text-[#94a3b8]" size={24} />
                  Locked Phrases ({lockedPhrases.length})
                </h3>
                <div className="space-y-3">
                  {lockedPhrases.map((phrase) => (
                    <div
                      key={phrase.id}
                      className="bg-gradient-to-r from-[#f8fafc] to-[#ffffff] rounded-xl p-4 border-2 border-[#cbd5e1]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="text-[#94a3b8]" size={24} />
                          <div>
                            <p className="text-lg font-bold text-[#94a3b8]">
                              Hidden Phrase #{phrase.id}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#4f46e5] bg-[#e0e7ff] px-3 py-1 rounded-full">
                          {phrase.unlockAt} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Token Earned Celebration Modal */}
          {showTokenEarned && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
              onClick={() => setShowTokenEarned(false)}
            >
              <div
                className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl transform animate-bounce"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-blue-600 mb-2">
                    Streak Freeze Earned!
                  </h2>
                  <div className="text-6xl my-4">🛡️</div>
                  <p className="text-lg text-gray-700 mb-2">
                    You now have{" "}
                    <span className="font-bold text-blue-600">
                      {calculateFreezeTokens(currentUser?.totalPoints || 0) -
                        (currentUser?.activeFreezes || []).length}
                    </span>{" "}
                    freeze token
                    {calculateFreezeTokens(currentUser?.totalPoints || 0) -
                      (currentUser?.activeFreezes || []).length !==
                    1
                      ? "s"
                      : ""}
                    !
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    Protect your streak during unavoidable absences
                  </p>
                  <button
                    onClick={() => setShowTokenEarned(false)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Awesome!
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Token Used Notification Modal */}
          {showTokenUsed && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
              onClick={() => setShowTokenUsed(false)}
            >
              <div
                className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {(currentUser?.currentStreak || 0) > 1 ? "🛡️" : "💔"}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {(currentUser?.currentStreak || 0) > 1
                      ? "Streak Protected!"
                      : "Streak Broken"}
                  </h2>
                  <p className="text-gray-700 whitespace-pre-line mb-6">
                    {tokenUsedMessage}
                  </p>
                  <button
                    onClick={() => setShowTokenUsed(false)}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Achievement Unlocked Celebration Modal */}
          {showAchievementUnlocked && unlockedAchievementIds.length > 0 && (
            <div
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-[10000]"
              onClick={() => setShowAchievementUnlocked(false)}
            >
              <div
                className="bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4c1d95] rounded-3xl p-8 max-w-md mx-4 shadow-2xl border-4 border-yellow-400"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center">
                  {/* Celebration Icon */}
                  <div className="text-6xl mb-4 animate-bounce">🎉</div>

                  {/* Title */}
                  <h2 className="text-3xl font-bold text-yellow-300 mb-6">
                    Achievement{unlockedAchievementIds.length > 1 ? "s" : ""}{" "}
                    Unlocked!
                  </h2>

                  {/* Achievement Details */}
                  <div className="space-y-4 mb-6">
                    {unlockedAchievementIds.map((achievementId) => {
                      const achievement = ACHIEVEMENTS.find(
                        (a) => a.id === achievementId,
                      );
                      if (!achievement) return null;

                      return (
                        <div
                          key={achievementId}
                          className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-yellow-400/50"
                        >
                          <div className="text-5xl mb-2">
                            {achievement.icon}
                          </div>
                          <h3 className="text-xl font-bold text-yellow-200 mb-1">
                            {achievement.name}
                          </h3>
                          <p className="text-sm text-purple-200 mb-2">
                            {achievement.nameEn}
                          </p>
                          <p className="text-sm text-gray-300">
                            {achievement.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Continue Button */}
                  <button
                    onClick={() => setShowAchievementUnlocked(false)}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-purple-900 px-8 py-3 rounded-xl font-bold text-lg hover:from-yellow-300 hover:to-yellow-400 transition-all transform hover:scale-105 shadow-lg"
                  >
                    Amazing! 🌟
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Freeze Calendar Modal */}
          {showFreezeCalendar && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]"
              onClick={() => setShowFreezeCalendar(false)}
            >
              <div
                className="bg-white rounded-3xl p-8 max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Activate Streak Freeze
                  </h2>
                  <p className="text-gray-600">
                    Select dates to freeze your streak
                  </p>
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Available Tokens
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {calculateFreezeTokens(
                            currentUser?.totalPoints || 0,
                          ) - (currentUser?.activeFreezes || []).length}
                          /10
                        </p>
                      </div>
                      <Shield className="text-blue-600" size={48} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {Array.from({ length: 14 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i + 1);
                    const dateString = date.toISOString().split("T")[0];
                    const isAlreadyFrozen = (
                      currentUser?.activeFreezes || []
                    ).includes(dateString);
                    const isSelected = selectedFreezeDates.includes(dateString);

                    return (
                      <div
                        key={dateString}
                        onClick={() => {
                          if (isAlreadyFrozen) return;

                          if (isSelected) {
                            setSelectedFreezeDates((prev) =>
                              prev.filter((d) => d !== dateString),
                            );
                          } else {
                            setSelectedFreezeDates((prev) => [
                              ...prev,
                              dateString,
                            ]);
                          }
                        }}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isAlreadyFrozen
                            ? "bg-green-50 border-green-300 cursor-not-allowed"
                            : isSelected
                              ? "bg-blue-100 border-blue-500"
                              : "bg-gray-50 border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-800">
                              {date.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {dateString}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {isAlreadyFrozen && (
                              <span className="text-green-600 font-semibold flex items-center gap-1">
                                <Shield size={16} />
                                Active
                              </span>
                            )}
                            {isSelected && !isAlreadyFrozen && (
                              <span className="text-blue-600 font-semibold">
                                ✓ Selected
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowFreezeCalendar(false);
                      setSelectedFreezeDates([]);
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => activateManualFreeze(selectedFreezeDates)}
                    disabled={selectedFreezeDates.length === 0}
                    className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Activate ({selectedFreezeDates.length}{" "}
                    {selectedFreezeDates.length === 1 ? "day" : "days"})
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("[ACHIEVEMENTS] Error rendering screen:", error);
      // Return error screen instead of crashing
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#ffffff] p-4 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-lg p-8 max-w-md text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Error Loading Achievements
            </h2>
            <p className="text-gray-600 mb-6">
              Sorry, there was an error loading this page. Please try again.
            </p>
            <button
              onClick={() => setScreen("menu")}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              Back to Menu
            </button>
          </div>
        </div>
      );
    }
  }

  // ============================================
  // GLOBAL MODALS (Rendered on all screens)
  // ============================================

  return (
    <>
      {/* Virtue One-Liner Popup */}
      {showVirtuePopup && currentVirtue && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-700 dark:to-teal-800 rounded-3xl shadow-2xl max-w-lg w-full p-8 relative border-4 border-[#D4AF37]">
            {/* Close button */}
            <button
              onClick={() => setShowVirtuePopup(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl font-bold"
            >
              ×
            </button>

            {/* Icon */}
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">📿</div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Virtue Unlocked!
              </h3>
              <div className="text-lg text-emerald-100 font-semibold">
                {currentVirtue.phrase?.transliteration || "Zikr"}
              </div>
            </div>

            {/* Virtue text */}
            <div className="bg-white/10 backdrop-blur rounded-2xl p-6 mb-6">
              <p className="text-white text-xl leading-relaxed text-center font-medium">
                {currentVirtue.virtue}
              </p>
            </div>

            {/* Category badge */}
            <div className="text-center mb-6">
              <span className="inline-block bg-[#D4AF37] text-teal-900 px-4 py-2 rounded-full text-sm font-bold">
                {currentVirtue.category}
              </span>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowVirtuePopup(false)}
              className="w-full py-4 bg-white text-emerald-600 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Continue 🤲
            </button>
          </div>
        </div>
      )}

      {/* Social Sharing Modal */}
      {showShareModal && shareData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-teal-600 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Share2 size={28} />
                  Share Your Achievement
                </h3>
                <button
                  onClick={() => {
                    setShowShareModal(false);
                    setSharingCardUrl(null);
                  }}
                  className="text-white/80 hover:text-white text-3xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Preview Card */}
              {isGeneratingCard ? (
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center mb-6">
                  <div className="text-center">
                    <div className="animate-spin text-4xl mb-2">⏳</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      Generating beautiful card...
                    </p>
                  </div>
                </div>
              ) : sharingCardUrl ? (
                <div className="mb-6">
                  <img
                    src={sharingCardUrl}
                    alt="Share card"
                    className="w-full rounded-2xl shadow-lg"
                  />
                </div>
              ) : null}

              {/* Share Text */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {shareData.text}
                </p>
              </div>

              {/* Share Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleSocialShare("whatsapp")}
                  className="w-full py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-xl">💬</span>
                  Share on WhatsApp
                </button>

                <button
                  onClick={() => handleSocialShare("twitter")}
                  className="w-full py-3 bg-blue-400 text-white rounded-xl font-semibold hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🐦</span>
                  Share on Twitter
                </button>

                <button
                  onClick={() => handleSocialShare("facebook")}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="text-xl">📘</span>
                  Share on Facebook
                </button>

                <button
                  onClick={() => handleSocialShare("instagram")}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span className="text-xl">📸</span>
                  Download for Instagram
                </button>

                <button
                  onClick={handleDownloadCard}
                  className="w-full py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  Download Image
                </button>

                <button
                  onClick={() => handleSocialShare("copy")}
                  className="w-full py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink size={20} />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Streak Shield Used Notification */}
      {showStreakShieldUsed && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8">
            {/* Icon */}
            <div className="text-center mb-6">
              <div className="text-7xl mb-4">🛡️</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Streak Shield Used!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your streak is protected
              </p>
            </div>

            {/* Shield Count Display */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl p-6 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Shields Remaining
                </p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    {shieldUsageInfo.oldCount}
                  </span>
                  <span className="text-2xl text-gray-400">→</span>
                  <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                    {shieldUsageInfo.newCount}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Earn more shields by collecting points!
                </p>
              </div>
            </div>

            {/* Message */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-6">
              <p className="text-sm text-amber-800 dark:text-amber-200 text-center">
                {tokenUsedMessage}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => {
                setShowStreakShieldUsed(false);
                setShowTokenUsed(false);
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              Continue Playing 🔥
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ZikrGame;
