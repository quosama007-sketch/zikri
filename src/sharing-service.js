// 📱 SOCIAL SHARING SERVICE
// Generate beautiful sharing cards and handle social media sharing

// Share text templates
const SHARE_TEMPLATES = {
  achievement: (achievementName) => 
    `🎉 Just unlocked "${achievementName}" on Zikri! Join me in remembering Allah daily! 🤲 #Zikri #IslamicApp`,
  
  streak: (days) => 
    `🔥 ${days}-day streak on Zikri! Consistent Azkar every single day! Alhamdulillah! 💚 #Zikri #DailyZikr`,
  
  leaderboard: (rank, points) => 
    `👑 Ranked #${rank} on Zikri with ${points.toLocaleString()} points! Competing in daily Azkar! 🏆 #Zikri`,
  
  session: (points, duration) => 
    `✨ Just completed a Zikr session! Earned ${points} points in ${duration} minutes! 🤲 #Zikri #Alhamdulillah`,
  
  milestone: (phrase, count) => 
    `🌟 Just reached ${count} repetitions of ${phrase}! Every Zikr brings me closer to Allah! 💚 #Zikri`
};

// Generate sharing card using Canvas
export const generateSharingCard = async (type, data, logoUrl) => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Card dimensions (Instagram square format)
      canvas.width = 1080;
      canvas.height = 1080;
      
      // Islamic color scheme
      const colors = {
        primary: '#0f766e', // Deep teal
        secondary: '#14b8a6', // Emerald
        gold: '#D4AF37', // Gold accent
        darkBg: '#134e4a', // Dark teal
        lightText: '#f0fdfa', // Light cream
        white: '#ffffff'
      };
      
      // Draw background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, colors.primary);
      gradient.addColorStop(1, colors.darkBg);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw Islamic geometric pattern overlay (subtle)
      drawGeometricPattern(ctx, canvas.width, canvas.height, colors.secondary, 0.1);
      
      // Draw gold border
      ctx.strokeStyle = colors.gold;
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      
      // Load and draw logo
      if (logoUrl) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          // Draw logo at top center
          const logoSize = 200;
          ctx.drawImage(logo, (canvas.width - logoSize) / 2, 100, logoSize, logoSize);
          
          // Continue drawing based on type
          drawCardContent(ctx, type, data, colors, canvas);
          
          // Convert to blob and resolve
          canvas.toBlob((blob) => {
            resolve(URL.createObjectURL(blob));
          }, 'image/png', 1.0);
        };
        logo.onerror = () => {
          // If logo fails, continue without it
          drawCardContent(ctx, type, data, colors, canvas);
          canvas.toBlob((blob) => {
            resolve(URL.createObjectURL(blob));
          }, 'image/png', 1.0);
        };
        logo.src = logoUrl;
      } else {
        // No logo provided, draw content directly
        drawCardContent(ctx, type, data, colors, canvas);
        canvas.toBlob((blob) => {
          resolve(URL.createObjectURL(blob));
        }, 'image/png', 1.0);
      }
    } catch (error) {
      console.error('Error generating sharing card:', error);
      reject(error);
    }
  });
};

// Draw geometric pattern (Islamic star pattern)
const drawGeometricPattern = (ctx, width, height, color, opacity) => {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  const spacing = 80;
  for (let x = 0; x < width; x += spacing) {
    for (let y = 0; y < height; y += spacing) {
      drawStar(ctx, x, y, 30, 8);
    }
  }
  
  ctx.restore();
};

// Draw an 8-pointed Islamic star
const drawStar = (ctx, cx, cy, radius, points) => {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points;
    const r = i % 2 === 0 ? radius : radius / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
};

// Draw card content based on type
const drawCardContent = (ctx, type, data, colors, canvas) => {
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.lightText;
  
  const centerY = canvas.height / 2;
  
  switch (type) {
    case 'achievement':
      // Achievement icon
      ctx.font = 'bold 120px Arial';
      ctx.fillText('🏆', canvas.width / 2, centerY - 80);
      
      // "Achievement Unlocked" text
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = colors.gold;
      ctx.fillText('ACHIEVEMENT UNLOCKED', canvas.width / 2, centerY + 40);
      
      // Achievement name
      ctx.font = 'bold 56px Arial';
      ctx.fillStyle = colors.white;
      wrapText(ctx, data.name, canvas.width / 2, centerY + 120, 900, 70);
      
      // Tagline
      ctx.font = '36px Arial';
      ctx.fillStyle = colors.lightText;
      ctx.fillText('Keep up the amazing work! 🤲', canvas.width / 2, centerY + 240);
      break;
      
    case 'streak':
      // Flame icon
      ctx.font = 'bold 120px Arial';
      ctx.fillText('🔥', canvas.width / 2, centerY - 80);
      
      // Streak number
      ctx.font = 'bold 140px Arial';
      ctx.fillStyle = colors.gold;
      ctx.fillText(data.days, canvas.width / 2, centerY + 80);
      
      // "Day Streak" text
      ctx.font = 'bold 52px Arial';
      ctx.fillStyle = colors.white;
      ctx.fillText('DAY STREAK', canvas.width / 2, centerY + 160);
      
      // Tagline
      ctx.font = '36px Arial';
      ctx.fillStyle = colors.lightText;
      ctx.fillText('Consistent daily Azkar! Alhamdulillah 💚', canvas.width / 2, centerY + 240);
      break;
      
    case 'leaderboard':
      // Crown icon
      ctx.font = 'bold 120px Arial';
      ctx.fillText('👑', canvas.width / 2, centerY - 80);
      
      // Rank
      ctx.font = 'bold 64px Arial';
      ctx.fillStyle = colors.gold;
      ctx.fillText(`RANK #${data.rank}`, canvas.width / 2, centerY + 40);
      
      // Points
      ctx.font = 'bold 72px Arial';
      ctx.fillStyle = colors.white;
      ctx.fillText(data.points.toLocaleString(), canvas.width / 2, centerY + 140);
      
      // "Points" text
      ctx.font = '42px Arial';
      ctx.fillStyle = colors.lightText;
      ctx.fillText('POINTS', canvas.width / 2, centerY + 200);
      break;
      
    case 'session':
      // Sparkles icon
      ctx.font = 'bold 120px Arial';
      ctx.fillText('✨', canvas.width / 2, centerY - 80);
      
      // "Session Complete" text
      ctx.font = 'bold 52px Arial';
      ctx.fillStyle = colors.gold;
      ctx.fillText('SESSION COMPLETE', canvas.width / 2, centerY + 40);
      
      // Points earned
      ctx.font = 'bold 88px Arial';
      ctx.fillStyle = colors.white;
      ctx.fillText(`+${data.points}`, canvas.width / 2, centerY + 150);
      
      // Duration
      ctx.font = '40px Arial';
      ctx.fillStyle = colors.lightText;
      ctx.fillText(`${data.duration} minutes of Zikr 🤲`, canvas.width / 2, centerY + 220);
      break;
  }
  
  // App name at bottom
  ctx.font = 'bold 48px Arial';
  ctx.fillStyle = colors.gold;
  ctx.fillText('Zikri', canvas.width / 2, canvas.height - 120);
  
  // Website/tagline
  ctx.font = '32px Arial';
  ctx.fillStyle = colors.lightText;
  ctx.fillText('Remember Allah, Earn Rewards', canvas.width / 2, canvas.height - 60);
};

// Wrap text to fit width
const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
};

// Download image
export const downloadImage = (imageUrl, filename) => {
  const link = document.createElement('a');
  link.href = imageUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Share to social media
export const shareToSocial = (platform, text, imageUrl) => {
  const encodedText = encodeURIComponent(text);
  const appUrl = window.location.origin;
  
  let shareUrl;
  
  switch (platform) {
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${encodedText}%20${appUrl}`;
      break;
      
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${appUrl}`;
      break;
      
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${appUrl}&quote=${encodedText}`;
      break;
      
    case 'instagram':
      // Instagram doesn't have direct web sharing, so download the image
      downloadImage(imageUrl, 'zikri-share.png');
      alert('📸 Image downloaded! Share it on Instagram from your photos! 💚');
      return;
      
    case 'copy':
      navigator.clipboard.writeText(`${text} ${appUrl}`);
      alert('📋 Link copied to clipboard!');
      return;
      
    default:
      return;
  }
  
  // Open share URL in new window
  window.open(shareUrl, '_blank', 'width=600,height=400');
};

// Generate share data for different types
export const getShareData = (type, data) => {
  switch (type) {
    case 'achievement':
      return {
        text: SHARE_TEMPLATES.achievement(data.name),
        cardData: { name: data.name }
      };
      
    case 'streak':
      return {
        text: SHARE_TEMPLATES.streak(data.days),
        cardData: { days: data.days }
      };
      
    case 'leaderboard':
      return {
        text: SHARE_TEMPLATES.leaderboard(data.rank, data.points),
        cardData: { rank: data.rank, points: data.points }
      };
      
    case 'session':
      return {
        text: SHARE_TEMPLATES.session(data.points, data.duration),
        cardData: { points: data.points, duration: data.duration }
      };
      
    default:
      return null;
  }
};

// Check if Web Share API is available
export const isWebShareSupported = () => {
  return navigator.share !== undefined;
};

// Use native Web Share API if available
export const nativeShare = async (title, text, url) => {
  if (!isWebShareSupported()) {
    return false;
  }
  
  try {
    await navigator.share({
      title,
      text,
      url
    });
    return true;
  } catch (error) {
    console.log('Share cancelled or failed:', error);
    return false;
  }
};

