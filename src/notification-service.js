// 🔔 NOTIFICATION SERVICE

import { 
  NOTIFICATION_MESSAGES, 
  SPECIAL_DAY_NOTIFICATIONS,
  RANDOM_NOTIFICATIONS,
  getRandomNotification,
  formatStreakMessage,
  formatAchievementMessage,
  shouldShowStreakRisk,
  getTodaySpecialNotification
} from './notifications-config';

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('❌ This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return true;
    }
  }

  console.log('❌ Notification permission denied');
  return false;
};

// Send a notification
export const sendNotification = (title, body, icon = '🕌', data = {}) => {
  if (Notification.permission !== 'granted') {
    console.log('⚠️ Cannot send notification - permission not granted');
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico', // Use your app icon
      badge: '/badge-icon.png', // Small icon
      tag: data.tag || 'zikri-notification', // Prevent duplicates
      requireInteraction: false, // Auto-dismiss after a few seconds
      data: {
        ...data,
        url: window.location.origin // Click opens app
      }
    });

    // Handle notification click
    notification.onclick = (event) => {
      event.preventDefault();
      window.focus(); // Focus the app window
      notification.close();
      
      // If there's a specific action, handle it
      if (data.action) {
        handleNotificationAction(data.action);
      }
    };

    console.log('🔔 Notification sent:', title);
    return notification;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
};

// Handle notification actions
const handleNotificationAction = (action) => {
  switch (action) {
    case 'open-game':
      // Navigate to game screen
      // This would be handled by App.jsx state
      window.dispatchEvent(new CustomEvent('notification-action', { 
        detail: { action: 'start-game' } 
      }));
      break;
    case 'view-achievements':
      window.dispatchEvent(new CustomEvent('notification-action', { 
        detail: { action: 'view-achievements' } 
      }));
      break;
    default:
      break;
  }
};

// Schedule a notification
export const scheduleNotification = (type, settings, userData = {}) => {
  const now = new Date();
  let scheduledTime;

  switch (type) {
    case 'morning':
      scheduledTime = getNextScheduledTime(settings.morning.time);
      break;
    case 'evening':
      scheduledTime = getNextScheduledTime(settings.evening.time);
      break;
    case 'night':
      scheduledTime = getNextScheduledTime(settings.night.time);
      break;
    case 'friday':
      if (now.getDay() === 5) { // Only on Friday
        scheduledTime = getNextScheduledTime(settings.friday.time);
      }
      break;
    case 'streakRisk':
      if (shouldShowStreakRisk(userData.lastPlayedDate)) {
        scheduledTime = getNextScheduledTime(settings.streakRisk.time);
      }
      break;
    default:
      return null;
  }

  if (scheduledTime) {
    const delay = scheduledTime.getTime() - now.getTime();
    if (delay > 0) {
      setTimeout(() => {
        sendScheduledNotification(type, userData);
      }, delay);
      console.log(`⏰ Scheduled ${type} notification for ${scheduledTime.toLocaleString()}`);
    }
  }
};

// Get next scheduled time
const getNextScheduledTime = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  const now = new Date();
  const scheduled = new Date();
  scheduled.setHours(hours, minutes, 0, 0);

  // If time has passed today, schedule for tomorrow
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }

  return scheduled;
};

// Send scheduled notification
const sendScheduledNotification = (type, userData) => {
  let notification;

  switch (type) {
    case 'morning':
      notification = NOTIFICATION_MESSAGES.MORNING;
      break;
    case 'evening':
      notification = NOTIFICATION_MESSAGES.EVENING;
      break;
    case 'night':
      notification = NOTIFICATION_MESSAGES.NIGHT;
      break;
    case 'friday':
      notification = NOTIFICATION_MESSAGES.FRIDAY;
      break;
    case 'streakRisk':
      notification = {
        ...NOTIFICATION_MESSAGES.STREAK_RISK,
        body: formatStreakMessage(userData.currentStreak || 0)
      };
      break;
    default:
      return;
  }

  sendNotification(
    notification.title,
    notification.body,
    notification.icon,
    { action: 'open-game', tag: type }
  );
};

// Send achievement notification
export const sendAchievementNotification = (achievementName) => {
  const notification = NOTIFICATION_MESSAGES.ACHIEVEMENT;
  sendNotification(
    notification.title,
    formatAchievementMessage(achievementName),
    notification.icon,
    { action: 'view-achievements', tag: 'achievement' }
  );
};

// Send random notification
export const sendRandomNotification = () => {
  const notification = getRandomNotification();
  sendNotification(
    notification.title,
    notification.body,
    notification.icon,
    { action: 'open-game', tag: 'random' }
  );
};

// Send special day notification
export const sendSpecialDayNotification = () => {
  const notification = getTodaySpecialNotification();
  if (notification) {
    sendNotification(
      notification.title,
      notification.body,
      notification.icon,
      { action: 'open-game', tag: 'special-day' }
    );
  }
};

// Initialize notification system
export const initializeNotifications = async (settings, userData) => {
  // Request permission
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    return false;
  }

  // Schedule daily notifications
  if (settings.morning.enabled) {
    scheduleNotification('morning', settings, userData);
  }
  if (settings.evening.enabled) {
    scheduleNotification('evening', settings, userData);
  }
  if (settings.night.enabled) {
    scheduleNotification('night', settings, userData);
  }
  if (settings.friday.enabled) {
    scheduleNotification('friday', settings, userData);
  }
  if (settings.streakRisk.enabled) {
    scheduleNotification('streakRisk', settings, userData);
  }

  // Schedule special day notifications
  if (settings.specialDays.enabled) {
    scheduleSpecialDayNotifications();
  }

  // Schedule random notifications
  if (settings.randomMessages.enabled) {
    scheduleRandomNotifications(settings.randomMessages.frequency);
  }

  console.log('✅ Notification system initialized');
  return true;
};

// Schedule special day notifications
const scheduleSpecialDayNotifications = () => {
  const now = new Date();
  const today = now.getDay();
  
  SPECIAL_DAY_NOTIFICATIONS.forEach(notification => {
    if (notification.day === today) {
      const scheduledTime = getNextScheduledTime(notification.time);
      const delay = scheduledTime.getTime() - now.getTime();
      
      if (delay > 0) {
        setTimeout(() => {
          sendNotification(
            notification.title,
            notification.body,
            notification.icon,
            { action: 'open-game', tag: 'special-day' }
          );
        }, delay);
        console.log(`⏰ Scheduled special day notification for ${scheduledTime.toLocaleString()}`);
      }
    }
  });
};

// Schedule random notifications throughout the day
const scheduleRandomNotifications = (frequency = 2) => {
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const remainingTime = endOfDay.getTime() - now.getTime();
  const interval = remainingTime / frequency;

  for (let i = 0; i < frequency; i++) {
    const delay = interval * (i + 1) + (Math.random() * 3600000 - 1800000); // Random ±30 min
    
    setTimeout(() => {
      sendRandomNotification();
      console.log('🔔 Sent random notification');
    }, delay);
  }

  console.log(`⏰ Scheduled ${frequency} random notifications for today`);
};

// Test notification (for settings page)
export const sendTestNotification = () => {
  sendNotification(
    '🔔 Test Notification',
    'Great! Notifications are working! 🎉',
    '✅',
    { tag: 'test' }
  );
};

// Check notification support
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Get notification permission status
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission; // 'granted', 'denied', or 'default'
};

