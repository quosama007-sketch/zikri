/**
 * Background Music Service
 *
 * Handles background music playback, transitions, and fading.
 *
 * NOTE: These functions use Web Audio API and are web-specific.
 * For mobile (Flutter/React Native), these will need platform-specific implementations.
 */

/**
 * Fade out audio smoothly
 * @param {HTMLAudioElement} audio - Audio element to fade out
 * @param {number} duration - Fade duration in milliseconds (default: 1000ms)
 * @returns {Promise<void>} Resolves when fade is complete
 */
export const fadeOutAudio = (audio, duration = 1000) => {
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

/**
 * Fade in audio smoothly
 * @param {HTMLAudioElement} audio - Audio element to fade in
 * @param {number} targetVolume - Target volume (0-1, default: 0.5)
 * @param {number} duration - Fade duration in milliseconds (default: 1000ms)
 * @returns {Promise<void>} Resolves when fade is complete
 */
export const fadeInAudio = (audio, targetVolume = 0.5, duration = 1000) => {
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

/**
 * Create and load audio element
 * @param {string} audioPath - Path to audio file
 * @param {boolean} loop - Whether to loop the audio (default: true)
 * @returns {HTMLAudioElement} Audio element
 */
export const loadAudio = (audioPath, loop = true) => {
  const audio = new Audio(audioPath);
  audio.loop = loop;
  audio.volume = 0;
  return audio;
};

/**
 * Preload next audio for smoother transitions
 * @param {string} audioPath - Path to audio file to preload
 * @returns {HTMLAudioElement} Preloaded audio element
 */
export const preloadAudio = (audioPath) => {
  const audio = new Audio(audioPath);
  audio.preload = "auto";
  return audio;
};

/**
 * Transition between two audio tracks with cross-fade
 * @param {HTMLAudioElement} currentAudio - Current playing audio
 * @param {string} newAudioPath - Path to new audio file
 * @param {number} fadeDuration - Duration of fade transition (default: 1500ms)
 * @returns {Promise<HTMLAudioElement>} New audio element
 */
export const transitionAudio = async (
  currentAudio,
  newAudioPath,
  fadeDuration = 1500,
) => {
  // Fade out current audio
  if (currentAudio && !currentAudio.paused) {
    await fadeOutAudio(currentAudio, fadeDuration);
  }

  // Load and fade in new audio
  const newAudio = loadAudio(newAudioPath, true);
  await fadeInAudio(newAudio, 0.5, fadeDuration);

  return newAudio;
};

/**
 * Initialize background music
 * @param {string} initialAudioPath - Path to initial audio file
 * @param {string} nextAudioPath - Path to next audio file to preload (optional)
 * @returns {Promise<{audio: HTMLAudioElement, nextAudio: HTMLAudioElement|null}>}
 */
export const initializeBackgroundMusic = async (
  initialAudioPath,
  nextAudioPath = null,
) => {
  // Start with initial audio
  const audio = loadAudio(initialAudioPath, true);

  // Preload next audio if provided
  const nextAudio = nextAudioPath ? preloadAudio(nextAudioPath) : null;

  // Fade in initial audio
  await fadeInAudio(audio, 0.5, 1500);

  return { audio, nextAudio };
};

/**
 * Cleanup audio resources
 * @param {HTMLAudioElement} audio - Audio element to cleanup
 */
export const cleanupAudio = (audio) => {
  if (audio) {
    audio.pause();
    audio.src = "";
  }
};

/**
 * Toggle audio mute with fade
 * @param {HTMLAudioElement} audio - Audio element
 * @param {boolean} isMuted - Current mute state
 * @param {number} fadeDuration - Fade duration (default: 1000ms)
 * @returns {Promise<boolean>} New mute state
 */
export const toggleMute = async (audio, isMuted, fadeDuration = 1000) => {
  if (isMuted) {
    // Unmute: fade in
    if (audio) {
      await fadeInAudio(audio, 0.5, fadeDuration);
    }
    return false;
  } else {
    // Mute: fade out
    if (audio) {
      await fadeOutAudio(audio, fadeDuration);
    }
    return true;
  }
};
