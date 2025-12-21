// 🔔 NOTIFICATION MESSAGES & CONFIGURATION

// Notification Messages
export const NOTIFICATION_MESSAGES = {
  // Standard Daily Notifications
  MORNING: {
    title: "☀️ Good Morning!",
    body: "Sun says Assalamualaikum ☀️ Reply with Azkar! 🤲",
    icon: "☀️",
    defaultTime: "07:00"
  },
  
  EVENING: {
    title: "🌆 Evening Time",
    body: "End your day with Azkar as the Sun says goodbye 🌅✨",
    icon: "🌆",
    defaultTime: "18:00"
  },
  
  NIGHT: {
    title: "🌙 Night Azkar",
    body: "Twinkle like the stars for Angels through Azkar ⭐😇",
    icon: "🌙",
    defaultTime: "21:00"
  },
  
  FRIDAY: {
    title: "🕌 Jummah Mubarak!",
    body: "Remember to send Salawat on our Habib ﷺ this Friday! 💚🕌",
    icon: "🕌",
    defaultTime: "12:00"
  },
  
  STREAK_RISK: {
    title: "⚠️ Streak Alert!",
    body: "It would be a bummer to miss your {streak}-day streak 🔥 Start Zikr now!",
    icon: "⚠️",
    defaultTime: "23:00"
  },
  
  WEEKLY_CHALLENGE: {
    title: "🎯 Weekly Challenge!",
    body: "Prove yourself this week with 2000 Azkar! 💪✨",
    icon: "🎯",
    defaultTime: "09:00" // Monday morning
  },
  
  DAILY_CHALLENGE: {
    title: "✨ Daily Bonus!",
    body: "Gain 250 points extra by completing today's challenge! 🎁",
    icon: "✨",
    defaultTime: "10:00"
  },
  
  ACHIEVEMENT: {
    title: "🎉 Achievement Unlocked!",
    body: "Congratulations! You earned: {achievement}! 🏆✨",
    icon: "🎉"
  }
};

// Special Day Notifications
export const SPECIAL_DAY_NOTIFICATIONS = [
  {
    day: 1, // Monday
    time: "15:30",
    title: "📅 Istighfar Time!",
    body: "End your day with Istighfar 🤲 Start Zikri! ✨",
    icon: "📅"
  },
  {
    day: 4, // Thursday
    time: "15:30",
    title: "🌟 End of Week!",
    body: "End your week seeking forgiveness 💚 Zikri is waiting! 🕌",
    icon: "🌟"
  },
  {
    day: 5, // Friday
    time: "15:30",
    title: "💚 Salawat Time!",
    body: "Time to gift Salawat to our Habib ﷺ Begin Zikri! 🌹",
    icon: "💚"
  },
  {
    day: 0, // Sunday
    time: "16:00",
    title: "☀️ Free Time!",
    body: "Free time is Zikr time 🎉 Relax with Zikri! 😌",
    icon: "☀️"
  }
];

// Fun Rotating Messages (Random throughout the day)
export const RANDOM_NOTIFICATIONS = [
  {
    title: "☕ Coffee Break?",
    body: "Coffee with Zikri ☕✨ Refresh your soul and mind!",
    icon: "☕"
  },
  {
    title: "🎉 Fun Time!",
    body: "Fun time with Zikri! 🎊 Joy with Reward! 🏆",
    icon: "🎉"
  },
  {
    title: "💙 Need Peace?",
    body: "Feeling down? 💙 Embrace Zikri and feel peace 😌🌟",
    icon: "💙"
  },
  {
    title: "🌤️ Quick Break!",
    body: "Sneak in Zikri as the Sun is high ☀️ Quick break = Big reward! 🎁",
    icon: "🌤️"
  },
  {
    title: "😊 Gratitude Time!",
    body: "Feeling happy? 😊 Show gratitude through Zikri! 🤲💚",
    icon: "😊"
  },
  {
    title: "⏰ Zikr O'Clock!",
    body: "Anytime can be Zikr time ⏰ Let's start! 🚀",
    icon: "⏰"
  },
  {
    title: "🌸 Soul Calling!",
    body: "Your soul called 📞 It wants some Zikri! 🌺",
    icon: "🌸"
  },
  {
    title: "💎 Treasure Time!",
    body: "5 minutes of Zikri = Treasure in Paradise 💰✨",
    icon: "💎"
  },
  {
    title: "🌈 Brighten Your Day!",
    body: "Brighten your day with Azkar 🌈 Zikri awaits! 🎯",
    icon: "🌈"
  },
  {
    title: "🍃 Peace Nearby!",
    body: "Peace is one tap away 🍃 Open Zikri now! 🤲",
    icon: "🍃"
  },
  {
    title: "🌟 Chill & Earn!",
    body: "Earn Hasanah while you chill 😎 Zikri time! 🎮",
    icon: "🌟"
  },
  {
    title: "🎯 Mini Break!",
    body: "Mini break? Perfect for mini Zikr! ⏱️💚",
    icon: "🎯"
  },
  {
    title: "🌙 Night Vibes!",
    body: "Late night vibes? Add some Azkar! 🌙✨",
    icon: "🌙"
  },
  {
    title: "🚀 Quick Win!",
    body: "Quick Zikr session = Big rewards! 🚀💰",
    icon: "🚀"
  },
  {
    title: "🌺 Self-Care!",
    body: "Best self-care? Zikr for the soul! 🌺💚",
    icon: "🌺"
  }
];

// Default Settings
export const DEFAULT_NOTIFICATION_SETTINGS = {
  enabled: false, // Overall notifications enabled
  morning: { enabled: true, time: "07:00" },
  evening: { enabled: true, time: "18:00" },
  night: { enabled: true, time: "21:00" },
  friday: { enabled: true, time: "12:00" },
  streakRisk: { enabled: true, time: "23:00" },
  weeklyChallenge: { enabled: true },
  dailyChallenge: { enabled: true },
  specialDays: { enabled: true },
  randomMessages: { enabled: true, frequency: 2 }, // 2 per day
  achievements: { enabled: true }
};

// Helper Functions
export const getRandomNotification = () => {
  return RANDOM_NOTIFICATIONS[Math.floor(Math.random() * RANDOM_NOTIFICATIONS.length)];
};

export const formatStreakMessage = (streak) => {
  return NOTIFICATION_MESSAGES.STREAK_RISK.body.replace('{streak}', streak);
};

export const formatAchievementMessage = (achievementName) => {
  return NOTIFICATION_MESSAGES.ACHIEVEMENT.body.replace('{achievement}', achievementName);
};

// Check if user has played today (for streak risk)
export const shouldShowStreakRisk = (lastPlayedDate) => {
  if (!lastPlayedDate) return true;
  const today = new Date().toDateString();
  const lastPlayed = new Date(lastPlayedDate).toDateString();
  return today !== lastPlayed;
};

// Get special notification for today
export const getTodaySpecialNotification = () => {
  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  return SPECIAL_DAY_NOTIFICATIONS.find(n => n.day === today);
};

