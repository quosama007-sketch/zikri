/**
 * HELPERS - Utility functions for constants
 * Color schemes and other helper functions
 */

/**
 * Get color scheme for a specific phrase by ID
 * Used to style falling phrases in the game
 */
export const getPhraseColor = (phraseId) => {
  const colors = {
    1: { bg: 'from-blue-400 to-blue-500', border: 'border-blue-500', text: 'text-blue-900' },
    2: { bg: 'from-emerald-400 to-emerald-500', border: 'border-emerald-500', text: 'text-emerald-900' },
    3: { bg: 'from-purple-400 to-purple-500', border: 'border-purple-500', text: 'text-purple-900' },
    4: { bg: 'from-pink-400 to-pink-500', border: 'border-pink-500', text: 'text-pink-900' },
    5: { bg: 'from-orange-400 to-orange-500', border: 'border-orange-500', text: 'text-orange-900' },
    6: { bg: 'from-teal-400 to-teal-500', border: 'border-teal-500', text: 'text-teal-900' },
    7: { bg: 'from-cyan-400 to-cyan-500', border: 'border-cyan-500', text: 'text-cyan-900' },
    8: { bg: 'from-indigo-400 to-indigo-500', border: 'border-indigo-500', text: 'text-indigo-900' },
    9: { bg: 'from-violet-400 to-violet-500', border: 'border-violet-500', text: 'text-violet-900' },
    10: { bg: 'from-fuchsia-400 to-fuchsia-500', border: 'border-fuchsia-500', text: 'text-fuchsia-900' },
    11: { bg: 'from-rose-400 to-rose-500', border: 'border-rose-500', text: 'text-rose-900' },
    12: { bg: 'from-amber-400 to-amber-500', border: 'border-amber-500', text: 'text-amber-900' },
    13: { bg: 'from-lime-400 to-lime-500', border: 'border-lime-500', text: 'text-lime-900' },
    14: { bg: 'from-sky-400 to-sky-500', border: 'border-sky-500', text: 'text-sky-900' },
    15: { bg: 'from-green-400 to-green-500', border: 'border-green-500', text: 'text-green-900' },
    16: { bg: 'from-red-400 to-red-500', border: 'border-red-500', text: 'text-red-900' },
    17: { bg: 'from-yellow-400 to-yellow-500', border: 'border-yellow-500', text: 'text-yellow-900' },
    18: { bg: 'from-blue-500 to-indigo-500', border: 'border-blue-600', text: 'text-blue-900' },
    19: { bg: 'from-purple-500 to-pink-500', border: 'border-purple-600', text: 'text-purple-900' },
    20: { bg: 'from-emerald-500 to-teal-500', border: 'border-emerald-600', text: 'text-emerald-900' },
  };
  return colors[phraseId] || { bg: 'from-gray-400 to-gray-500', border: 'border-gray-500', text: 'text-gray-900' };
};
