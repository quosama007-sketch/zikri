/**
 * Achievements Service
 *
 * Handles achievement checking and badge unlocking logic.
 * All functions are pure (no side effects) for easy testing and mobile reuse.
 *
 * Achievement Types:
 * - sessions: Complete X sessions
 * - points: Earn X total points
 * - streak: Maintain X day streak
 * - time: Accumulate X seconds of zikr
 * - unlocked: Unlock X phrases
 * - accuracy: Achieve X% accuracy in a session
 * - session_score: Earn X points in one session
 * - phrase_count: Recite specific phrase X times
 * - session_duration: Play for X seconds in one session
 * - daily_points: Earn X points in one day
 * - unlock_phrase: Unlock specific phrase
 * - all_badges: Unlock all other achievements
 */

import { ACHIEVEMENTS } from "../../constants";
import { getUnlockedPhraseIds } from "./calculations";

/**
 * Check if a single achievement has been earned
 * @param {Object} achievement - Achievement object from ACHIEVEMENTS
 * @param {Object} gameData - Current game session data
 * @param {Object} userData - User's persistent data
 * @param {number[]} currentAchievements - Already earned achievement IDs
 * @returns {boolean} True if achievement is earned
 */
export const checkAchievementEarned = (
  achievement,
  gameData,
  userData,
  currentAchievements,
) => {
  // Skip if already earned
  if (currentAchievements.includes(achievement.id)) {
    return false;
  }

  const {
    points,
    sessionAccuracy,
    sessionPoints,
    additionalTime,
    newSessionsCompleted,
    newTotalTime,
    newStreak,
  } = gameData;

  const { phraseCounts, dailyPoints } = userData;

  let earned = false;

  switch (achievement.requirement.type) {
    case "sessions":
      earned = newSessionsCompleted >= achievement.requirement.count;
      break;

    case "points":
      earned = points >= achievement.requirement.count;
      break;

    case "streak":
      earned = newStreak >= achievement.requirement.count;
      break;

    case "time":
      earned = newTotalTime >= achievement.requirement.count;
      break;

    case "unlocked":
      earned =
        getUnlockedPhraseIds(points).length >= achievement.requirement.count;
      break;

    case "accuracy":
      earned = sessionAccuracy >= achievement.requirement.count;
      break;

    case "session_score":
      earned = sessionPoints >= achievement.requirement.count;
      break;

    case "phrase_count":
      const phraseCount =
        (phraseCounts || {})[achievement.requirement.phraseId] || 0;
      earned = phraseCount >= achievement.requirement.count;
      console.log(
        `[ACHIEVEMENT CHECK] ${achievement.name}: phraseId ${achievement.requirement.phraseId} count ${phraseCount} >= ${achievement.requirement.count}? ${earned}`,
      );
      break;

    case "session_duration":
      earned = additionalTime >= achievement.requirement.count;
      break;

    case "daily_points":
      earned = (dailyPoints || 0) >= achievement.requirement.count;
      break;

    case "unlock_phrase":
      earned = getUnlockedPhraseIds(points).includes(
        achievement.requirement.phraseId,
      );
      break;

    case "all_badges":
      const otherBadges = ACHIEVEMENTS.filter((a) => a.id !== achievement.id);
      earned = otherBadges.every((a) => currentAchievements.includes(a.id));
      break;

    case "first_phrase":
    case "night_session":
    case "silent_session":
    case "category_weekly":
    case "mastery_level":
      earned = false; // Not implemented yet
      break;

    default:
      earned = false;
  }

  return earned;
};

/**
 * Check all achievements and return newly earned ones
 * @param {Object} gameData - Current game session data
 * @param {Object} userData - User's persistent data
 * @param {string[]} currentAchievements - Array of already earned achievement IDs
 * @returns {Object} { newAchievements: string[], newlyUnlockedIds: string[] }
 */
export const checkAllAchievements = (
  gameData,
  userData,
  currentAchievements = [],
) => {
  const newAchievements = [...currentAchievements];

  ACHIEVEMENTS.forEach((achievement) => {
    if (!currentAchievements.includes(achievement.id)) {
      const earned = checkAchievementEarned(
        achievement,
        gameData,
        userData,
        currentAchievements,
      );

      if (earned) {
        newAchievements.push(achievement.id);
        console.log(`🎉 Achievement unlocked: ${achievement.name}`);
      }
    }
  });

  // Get only the newly unlocked ones
  const newlyUnlockedIds = newAchievements.filter(
    (id) => !currentAchievements.includes(id),
  );

  if (newlyUnlockedIds.length > 0) {
    console.log(
      `[ACHIEVEMENTS] ${newlyUnlockedIds.length} new achievement(s) unlocked!`,
    );
  }

  return {
    newAchievements,
    newlyUnlockedIds,
  };
};

/**
 * Check if user earned new freeze tokens
 * @param {number} previousTotalPoints - Points before this session
 * @param {number} newTotalPoints - Points after this session
 * @param {Function} calculateFreezeTokens - Function to calculate tokens
 * @returns {Object} { earned: boolean, tokensEarned: number, previousTokens: number, newTokens: number }
 */
export const checkTokenEarning = (
  previousTotalPoints,
  newTotalPoints,
  calculateFreezeTokens,
) => {
  const previousTokens = calculateFreezeTokens(previousTotalPoints);
  const newTokens = calculateFreezeTokens(newTotalPoints);

  if (newTokens > previousTokens) {
    const tokensEarned = newTokens - previousTokens;
    console.log(`[TOKEN] Earned ${tokensEarned} new freeze token(s)!`);
    console.log(
      `[TOKEN] Previous total: ${previousTotalPoints}, New total: ${newTotalPoints}`,
    );

    return {
      earned: true,
      tokensEarned,
      previousTokens,
      newTokens,
    };
  }

  return {
    earned: false,
    tokensEarned: 0,
    previousTokens,
    newTokens,
  };
};

/**
 * Prepare daily stats update
 * @param {Object} currentDailyStats - Current daily stats object
 * @param {number} sessionTaps - Taps in this session
 * @param {number} sessionPoints - Points in this session
 * @param {number} additionalTime - Time in this session
 * @returns {Object} Updated dailyStats object
 */
export const updateDailyStats = (
  currentDailyStats = {},
  sessionTaps,
  sessionPoints,
  additionalTime,
) => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const dailyStats = { ...currentDailyStats };
  const todayStats = dailyStats[today] || { taps: 0, points: 0, time: 0 };

  dailyStats[today] = {
    taps: todayStats.taps + sessionTaps,
    points: todayStats.points + sessionPoints,
    time: todayStats.time + additionalTime,
  };

  return dailyStats;
};

/**
 * Get achievement by ID
 * @param {string} achievementId - Achievement ID
 * @returns {Object|undefined} Achievement object or undefined
 */
export const getAchievementById = (achievementId) => {
  return ACHIEVEMENTS.find((a) => a.id === achievementId);
};

/**
 * Get achievements by category
 * @param {string} category - Achievement category ('consistency', 'mastery', etc.)
 * @returns {Object[]} Array of achievements in that category
 */
export const getAchievementsByCategory = (category) => {
  return ACHIEVEMENTS.filter((a) => a.category === category);
};

/**
 * Calculate achievement progress for a specific achievement
 * @param {Object} achievement - Achievement object
 * @param {Object} userData - User's persistent data
 * @param {Object} gameData - Current game session data
 * @returns {number} Progress percentage (0-100)
 */
export const getAchievementProgress = (
  achievement,
  userData,
  gameData = {},
) => {
  const requirement = achievement.requirement;
  let current = 0;
  let target = requirement.count || 1;

  switch (requirement.type) {
    case "sessions":
      current = userData.sessionsCompleted || 0;
      break;

    case "points":
      current = userData.totalPoints || 0;
      break;

    case "streak":
      current = userData.currentStreak || 0;
      break;

    case "time":
      current = userData.totalZikrTime || 0;
      break;

    case "unlocked":
      current = (userData.unlockedPhrases || []).length;
      break;

    case "phrase_count":
      current = (userData.phraseCounts || {})[requirement.phraseId] || 0;
      break;

    case "daily_points":
      current = userData.dailyPoints || 0;
      break;

    default:
      return 0;
  }

  const progress = Math.min((current / target) * 100, 100);
  return Math.round(progress);
};
