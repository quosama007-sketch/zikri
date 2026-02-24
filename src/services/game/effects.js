/**
 * Game Visual Effects Service
 *
 * Handles all visual effects and animations including:
 * - Tap effects (stars, sparkles, transforms)
 * - Fireworks celebrations
 * - Particle bursts
 * - Screen flashes
 *
 * NOTE: These use DOM manipulation and are web-specific.
 * For mobile (Flutter/React Native), these will need platform-specific implementations.
 */

/**
 * Create particle burst effect at coordinates
 * @param {number} x - X coordinate (default: center)
 * @param {number} y - Y coordinate (default: center)
 * @param {string} color - Particle color (default: amber)
 */
export const createParticleBurst = (
  x = window.innerWidth / 2,
  y = window.innerHeight / 2,
  color = "#f59e0b",
) => {
  const particleCount = 20;
  const container = document.body;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.backgroundColor = color;

    // Random direction
    const angle = (Math.PI * 2 * i) / particleCount;
    const distance = 100 + Math.random() * 100;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.style.setProperty("--tx", `${tx}px`);
    particle.style.setProperty("--ty", `${ty}px`);

    container.appendChild(particle);

    // Remove after animation
    setTimeout(() => particle.remove(), 1000);
  }
};

/**
 * Create fireworks celebration effect
 * Shows multiple colorful fireworks across the screen
 */
export const createFireworks = () => {
  const colors = ["#f59e0b", "#10b981", "#4f46e5", "#a855f7", "#fb923c"];
  const fireworkCount = 5;

  for (let i = 0; i < fireworkCount; i++) {
    setTimeout(() => {
      const x =
        Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2; // 20-80% of width
      const y =
        Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.2; // 20-60% of height
      const color = colors[Math.floor(Math.random() * colors.length)];

      // Create burst center
      const burst = document.createElement("div");
      burst.className = "firework firework-burst";
      burst.style.left = `${x}px`;
      burst.style.top = `${y}px`;
      burst.style.backgroundColor = color;
      document.body.appendChild(burst);
      setTimeout(() => burst.remove(), 800);

      // Create particles
      const particleCount = 12;
      for (let j = 0; j < particleCount; j++) {
        const particle = document.createElement("div");
        particle.className = "firework firework-particle";
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        particle.style.backgroundColor = color;

        const angle = (Math.PI * 2 * j) / particleCount;
        const distance = 80 + Math.random() * 80;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;

        particle.style.setProperty("--tx", `${tx}px`);
        particle.style.setProperty("--ty", `${ty}px`);

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1200);
      }
    }, i * 300); // Stagger fireworks
  }

  // Add screen flash
  const flash = document.createElement("div");
  flash.className = "screen-flash";
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 600);

  // Add celebration text
  const celebrationText = document.createElement("div");
  celebrationText.className = "celebration-text";
  celebrationText.textContent = "🎉 Alhamdulillah! 🎉";
  document.body.appendChild(celebrationText);
  setTimeout(() => celebrationText.remove(), 2000);
};

/**
 * Create floating star effect (for 10 point phrases)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} points - Points earned
 */
export const createStarFloat = (x, y, points) => {
  const starElement = document.createElement("div");
  starElement.className = "tap-star-float";
  starElement.textContent = `⭐ +${points}`;
  starElement.style.left = `${x}px`;
  starElement.style.top = `${y}px`;

  document.body.appendChild(starElement);
  setTimeout(() => starElement.remove(), 800);
};

/**
 * Create sparkle burst effect (for 15-20 point phrases)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} points - Points earned
 */
export const createSparkleBurst = (x, y, points) => {
  const sparkleCount = 8;

  // Create sparkles bursting outward
  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement("div");
    sparkle.className = "tap-sparkle";
    sparkle.textContent = "✨";
    sparkle.style.left = `${x}px`;
    sparkle.style.top = `${y}px`;

    // Random direction for burst
    const angle = (Math.PI * 2 * i) / sparkleCount;
    const distance = 40 + Math.random() * 40;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    sparkle.style.setProperty("--tx", `${tx}px`);
    sparkle.style.setProperty("--ty", `${ty}px`);

    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 800);
  }

  // Create floating points text
  const pointsText = document.createElement("div");
  pointsText.className = "tap-sparkle-text";
  pointsText.textContent = `+${points} ✨`;
  pointsText.style.left = `${x}px`;
  pointsText.style.top = `${y}px`;

  document.body.appendChild(pointsText);
  setTimeout(() => pointsText.remove(), 1000);
};

/**
 * Create transform to star effect (for 25-30 point phrases)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} points - Points earned
 * @param {boolean} isGolden - Whether to show golden glow (for newly unlocked)
 */
export const createTransformStar = (x, y, points, isGolden = false) => {
  const starElement = document.createElement("div");
  starElement.className = isGolden
    ? "tap-transform-star-glow"
    : "tap-transform-star";
  starElement.textContent = isGolden ? "⭐✨" : "⭐";
  starElement.style.left = `${x}px`;
  starElement.style.top = `${y}px`;

  document.body.appendChild(starElement);
  setTimeout(() => starElement.remove(), isGolden ? 1500 : 1200);

  // Add points text that appears after star emerges
  setTimeout(() => {
    const pointsText = document.createElement("div");
    pointsText.className = "tap-star-float";
    pointsText.textContent = `+${points}`;
    pointsText.style.left = `${x}px`;
    pointsText.style.top = `${y - 30}px`;
    pointsText.style.color = isGolden ? "#fbbf24" : "#f59e0b";

    document.body.appendChild(pointsText);
    setTimeout(() => pointsText.remove(), 800);
  }, 300);
};

/**
 * Main function to create tap effect based on phrase characteristics
 * Automatically chooses the right effect based on points and unlock status
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} points - Points earned
 * @param {boolean} isNewlyUnlocked - Whether this phrase was just unlocked
 */
export const createTapEffect = (x, y, points, isNewlyUnlocked) => {
  if (isNewlyUnlocked) {
    // Newly unlocked: Transform with extra glow (most dramatic)
    createTransformStar(x, y, points, true);
  } else if (points >= 25) {
    // 25-30 pts: Transform to star
    createTransformStar(x, y, points, false);
  } else if (points >= 15) {
    // 15-20 pts: Sparkle burst
    createSparkleBurst(x, y, points);
  } else {
    // 10 pts: Simple star float
    createStarFloat(x, y, points);
  }
};
