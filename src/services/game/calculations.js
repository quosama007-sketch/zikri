/**
 * Game Calculations Service
 *
 * Handles all game calculation logic including:
 * - Phrase and Asma unlocking
 * - Background determination
 * - Speed calculations
 * - Freeze token calculations
 */

import { ZIKR_PHRASES, NAMES_OF_ALLAH } from "../../constants";
import {
  ASMA_INITIAL_UNLOCKED,
  ASMA_TAPS_PER_UNLOCK,
  POINTS_PER_BACKGROUND,
  MAX_BACKGROUND_INDEX,
  POINTS_PER_FREEZE_TOKEN,
  MAX_FREEZE_TOKENS,
  PHRASE_SPEED_FOCUS,
  PHRASE_SPEED_ASMA,
} from "../../constants/gameConfig";

/**
 * Get unlocked phrase IDs based on total points
 * @param {number} points - Total points earned
 * @returns {number[]} Array of unlocked phrase IDs
 */
export const getUnlockedPhraseIds = (points) => {
  return ZIKR_PHRASES.filter((p) => p.unlockAt <= points).map((p) => p.id);
};

/**
 * Get unlocked Asma ul Husna names based on tap count
 * Every 33 taps unlocks the next name
 * @param {number} tapCount - Total Asma taps
 * @returns {number[]} Array of unlocked Asma IDs
 */
export const getUnlockedAsmaIds = (tapCount) => {
  const additionalUnlocked = Math.floor(tapCount / ASMA_TAPS_PER_UNLOCK);
  const totalUnlocked = Math.min(
    ASMA_INITIAL_UNLOCKED + additionalUnlocked,
    NAMES_OF_ALLAH.length,
  );

  return NAMES_OF_ALLAH.slice(0, totalUnlocked).map((n) => n.id);
};

/**
 * Get available phrases for gameplay
 * @param {number} totalPoints - Current total points
 * @returns {Object[]} Array of unlocked phrase objects
 */
export const getAvailablePhrases = (totalPoints) => {
  const unlockedIds = getUnlockedPhraseIds(totalPoints);
  return ZIKR_PHRASES.filter((p) => unlockedIds.includes(p.id));
};

/**
 * Calculate background index based on session score (1-11)
 * Used for dynamic background music transitions
 * @param {number} score - Current session score
 * @returns {number} Background index (1-11)
 */
export const getBackgroundIndex = (score) => {
  return Math.min(Math.floor(score / POINTS_PER_BACKGROUND) + 1, MAX_BACKGROUND_INDEX);
};

/**
 * Calculate freeze tokens based on total points
 * 1 token per 30,000 points, max 10 tokens
 * @param {number} totalPoints - Total points earned
 * @returns {number} Number of freeze tokens (0-10)
 */
export const calculateFreezeTokens = (totalPoints) => {
  return Math.min(
    Math.floor(totalPoints / POINTS_PER_FREEZE_TOKEN),
    MAX_FREEZE_TOKENS,
  );
};

/**
 * Check if a specific date has active freeze
 * @param {string} dateString - Date string to check
 * @param {string[]} activeFreezes - Array of frozen date strings
 * @returns {boolean} True if date is frozen
 */
export const isDateFrozen = (dateString, activeFreezes = []) => {
  return activeFreezes.includes(dateString);
};

/**
 * Get game background gradient based on points
 * @param {number} totalPoints - Current total points
 * @param {number} sessionScore - Current session score
 * @returns {Object} { background: string, message: string }
 */
export const getGameBackground = (totalPoints, sessionScore) => {
  const points = totalPoints + sessionScore;

  let background = "";
  let message = "";

  if (points < 250) {
    background = "bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900";
    message = "🌙 Night Sky - Peaceful contemplation";
  } else if (points < 500) {
    background =
      "bg-gradient-to-br from-amber-100 via-yellow-50 to-emerald-100";
    message = "🕌 Inside the Mosque - Sacred atmosphere";
  } else if (points < 750) {
    background = "bg-gradient-to-br from-cyan-200 via-blue-100 to-amber-100";
    message = "🏖️ Beach - Calm and serene";
  } else if (points < 1000) {
    background = "bg-gradient-to-br from-green-300 via-emerald-200 to-lime-100";
    message = "🌳 Jungle Morning - Fresh and alive";
  } else if (points < 1250) {
    background = "bg-gradient-to-br from-slate-400 via-gray-300 to-blue-200";
    message = "🌧️ Rainy Road - Reflective moment";
  } else if (points < 1500) {
    background = "bg-gradient-to-br from-orange-200 via-red-100 to-yellow-100";
    message = "🏪 Marketplace - Vibrant energy";
  } else {
    background = "bg-gradient-to-br from-sky-300 via-slate-200 to-blue-100";
    message = "🏙️ High-rise View - You've reached the top!";
  }

  return { background, message };
};

/**
 * Calculate phrase falling speed based on game mode
 * @param {string} gameMode - Current game mode ('focus', 'asma', 'tasbih')
 * @param {Object} gameStartTimeRef - Ref to game start time (optional)
 * @returns {number} Speed multiplier (0.3 for Asma, 0.5 for Focus/Tasbih)
 */
export const getSpeed = (gameMode, gameStartTimeRef = null) => {
  if (gameStartTimeRef && !gameStartTimeRef.current) return PHRASE_SPEED_ASMA;
  if (gameMode === "asma") return PHRASE_SPEED_ASMA;
  return PHRASE_SPEED_FOCUS;
};
