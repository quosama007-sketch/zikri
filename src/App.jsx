import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Heart, Pause, Play, Lock, Unlock, LogOut, User, Award, TrendingUp, Sparkles, Star, Flame, Clock, Target, Zap, Crown, Medal, Users, Circle, Shield } from 'lucide-react';

// Firebase imports
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase-config';
import { registerUser, loginUser, logoutUser } from './firebase-auth';
import { getUserData, saveGameProgress, getLeaderboard, incrementPhraseCount } from './firebase-data';

// Zikr phrases data
const ZIKR_PHRASES = [
  { id: 1, arabic: 'بِسْمِ اللهِ', transliteration: 'Bismillah', translation: 'In the name of Allah', points: 10, unlockAt: 0, category: 'Foundation - Said before any action', wordCount: 2 },
  { id: 2, arabic: 'اللهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest', points: 10, unlockAt: 0, category: 'Foundation - Expression of Allah\'s greatness', wordCount: 2 },
  { id: 3, arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', translation: 'All praise is for Allah', points: 10, unlockAt: 0, category: 'Foundation - Praise and gratitude', wordCount: 2 },
  { id: 4, arabic: 'سُبْحَانَ اللهِ', transliteration: 'Subhanallah', translation: 'Glory be to Allah', points: 10, unlockAt: 0, category: 'Foundation - Tasbih, acknowledging perfection', wordCount: 2 },
  { id: 5, arabic: 'أَسْتَغْفِرُ اللهَ', transliteration: 'Astaghfirullah', translation: 'I seek forgiveness from Allah', points: 10, unlockAt: 250, category: 'Foundation - Seeking forgiveness', wordCount: 2 },
  { id: 6, arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', transliteration: 'Subhanallahi wa bihamdihi', translation: 'Glory be to Allah and all praise is His', points: 15, unlockAt: 600, category: 'Extended Praise - A "tree in Paradise"', wordCount: 3 },
  { id: 7, arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ', transliteration: 'La hawla wa la quwwata illa billah', translation: 'There is no power nor strength except with Allah', points: 15, unlockAt: 1000, category: 'Strength & Reliance - Key to Paradise', wordCount: 6 },
  { id: 8, arabic: 'حَسْبِيَ اللهُ وَنِعْمَ الْوَكِيلُ', transliteration: 'Hasbunallahu wa ni\'mal wakeel', translation: 'Allah is sufficient for us, and He is the best disposer of affairs', points: 15, unlockAt: 1500, category: 'Trust - Expression of complete reliance', wordCount: 4 },
  { id: 9, arabic: 'سُبْحَانَ اللهِ الْعَظِيمِ', transliteration: 'Subhanallahil \'Azeem', translation: 'Glory be to Allah, the Magnificent', points: 15, unlockAt: 2100, category: 'Magnificence - Often said in Ruku\' (bowing)', wordCount: 3 },
  { id: 10, arabic: 'رَضِيتُ بِاللهِ رَبًّا', transliteration: 'Radheetu billahi Rabban', translation: 'I am pleased with Allah as my Lord', points: 20, unlockAt: 2800, category: 'Contentment - Part of a powerful du\'a', wordCount: 3 },
  { id: 11, arabic: 'رَبِّ اغْفِرْلِي', transliteration: 'Rabbighfir lee', translation: 'My Lord, forgive me', points: 10, unlockAt: 3600, category: 'Simple Supplication - Short and powerful plea', wordCount: 2 },
  { id: 12, arabic: 'نِعْمَ الْمَوْلَى وَنِعْمَ النَّصِيرُ', transliteration: 'Ni\'mal Mawla wa ni\'man-Naseer', translation: 'What an excellent Master and what an excellent Helper', points: 15, unlockAt: 4500, category: 'Praise & Reliance - Praise of Allah from the Quran', wordCount: 4 },
  { id: 13, arabic: 'لَا إِلَهَ إِلَّا اللهُ', transliteration: 'La ilaha illallah', translation: 'There is no deity worthy of worship except Allah', points: 25, unlockAt: 5500, category: 'The Best Dhikr - The statement of Tawhid', wordCount: 4 },
  { id: 14, arabic: 'أَسْتَغْفِرُ اللهَ وَأَتُوبُ إِلَيْهِ', transliteration: 'Astaghfirullaha wa atubu ilayh', translation: 'I seek forgiveness from Allah and repent to Him', points: 20, unlockAt: 6600, category: 'Repentance - A comprehensive form of seeking forgiveness', wordCount: 5 },
  { id: 15, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', transliteration: 'Alhamdulillahi Rabbil \'Aalameen', translation: 'All praise is for Allah, Lord of all the worlds', points: 20, unlockAt: 7800, category: 'Complete Praise - The opening praise from Surah Al-Fatihah', wordCount: 4 },
  { id: 16, arabic: 'أَعُوذُ بِاللهِ مِنَ الشَّيْطَانِ الرَّجِيمِ', transliteration: 'A\'oodhu billahi min ash-shaytan ir-rajeem', translation: 'I seek refuge in Allah from the accursed Satan', points: 15, unlockAt: 9100, category: 'Protection - Said before recitation, when angry', wordCount: 5 },
  { id: 17, arabic: 'بِسْمِ اللهِ الرَّحْمَٰنِ الرَّحِيمِ', transliteration: 'Bismillahir Rahmanir Rahim', translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful', points: 20, unlockAt: 10500, category: 'The Basmala - The full, blessed opening', wordCount: 4 },
  { id: 18, arabic: 'رَبِّ زِدْنِي عِلْمًا', transliteration: 'Rabbi zidni \'ilma', translation: 'My Lord, increase me in knowledge', points: 25, unlockAt: 12000, category: 'Seeking Knowledge - A du\'a for beneficial knowledge', wordCount: 3 },
  { id: 19, arabic: 'رَبِّ اشْرَحْ لِي صَدْرِي', transliteration: 'Rabbishrah li sadri', translation: 'My Lord, expand for me my breast [ease my task]', points: 25, unlockAt: 13600, category: 'Ease & Confidence - The du\'a of Prophet Musa (AS) for ease', wordCount: 4 },
  { id: 20, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', transliteration: 'Ihdinas-siratal mustaqeem', translation: 'Guide us to the straight path', points: 30, unlockAt: 15300, category: 'Guidance - From Surah Al-Fatihah, asking for the straight path', wordCount: 3 },
  { id: 21, arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ', transliteration: 'Allahumma Salli wa Sallim', translation: 'O Allah, send blessings and peace (upon the Prophet)', points: 20, unlockAt: 16800, category: 'Salawat - Sending blessings upon the Prophet ﷺ', wordCount: 3 },
];

// 99 Names of Allah (Asma ul Husna) - Complete List
const NAMES_OF_ALLAH = [
  { id: 101, arabic: 'يَا اللهُ', transliteration: 'Ya Allah', translation: 'O Allah, The Greatest Name', points: 10, unlockAt: 0, wordCount: 2 },
  { id: 102, arabic: 'يَا رَبُّ', transliteration: 'Ya Rabb', translation: 'O Lord, The Sustainer', points: 10, unlockAt: 0, wordCount: 2 },
  { id: 103, arabic: 'يَا رَحْمَٰنُ', transliteration: 'Ya Rahman', translation: 'O Most Merciful', points: 10, unlockAt: 500, wordCount: 2 },
  { id: 104, arabic: 'يَا رَحِيمُ', transliteration: 'Ya Raheem', translation: 'O Most Compassionate', points: 10, unlockAt: 500, wordCount: 2 },
  { id: 105, arabic: 'يَا مَلِكُ', transliteration: 'Ya Malik', translation: 'O The King', points: 10, unlockAt: 1000, wordCount: 2 },
  { id: 106, arabic: 'يَا قُدُّوسُ', transliteration: 'Ya Quddus', translation: 'O The Most Holy', points: 10, unlockAt: 1000, wordCount: 2 },
  { id: 107, arabic: 'يَا سَلَامُ', transliteration: 'Ya Salaam', translation: 'O The Source of Peace', points: 10, unlockAt: 1500, wordCount: 2 },
  { id: 108, arabic: 'يَا مُؤْمِنُ', transliteration: 'Ya Mu\'min', translation: 'O The Granter of Security', points: 10, unlockAt: 1500, wordCount: 2 },
  { id: 109, arabic: 'يَا مُهَيْمِنُ', transliteration: 'Ya Muhaymin', translation: 'O The Guardian', points: 10, unlockAt: 2000, wordCount: 2 },
  { id: 110, arabic: 'يَا عَزِيزُ', transliteration: 'Ya Aziz', translation: 'O The Almighty', points: 10, unlockAt: 2000, wordCount: 2 },
  { id: 111, arabic: 'يَا جَبَّارُ', transliteration: 'Ya Jabbar', translation: 'O The Compeller', points: 10, unlockAt: 2500, wordCount: 2 },
  { id: 112, arabic: 'يَا مُتَكَبِّرُ', transliteration: 'Ya Mutakabbir', translation: 'O The Supreme', points: 10, unlockAt: 2500, wordCount: 2 },
  { id: 113, arabic: 'يَا خَالِقُ', transliteration: 'Ya Khaliq', translation: 'O The Creator', points: 10, unlockAt: 3000, wordCount: 2 },
  { id: 114, arabic: 'يَا بَارِئُ', transliteration: 'Ya Bari', translation: 'O The Evolver', points: 10, unlockAt: 3000, wordCount: 2 },
  { id: 115, arabic: 'يَا مُصَوِّرُ', transliteration: 'Ya Musawwir', translation: 'O The Fashioner', points: 10, unlockAt: 3500, wordCount: 2 },
  { id: 116, arabic: 'يَا غَفَّارُ', transliteration: 'Ya Ghaffar', translation: 'O The Forgiving', points: 10, unlockAt: 3500, wordCount: 2 },
  { id: 117, arabic: 'يَا قَهَّارُ', transliteration: 'Ya Qahhar', translation: 'O The Subduer', points: 10, unlockAt: 4000, wordCount: 2 },
  { id: 118, arabic: 'يَا وَهَّابُ', transliteration: 'Ya Wahhab', translation: 'O The Bestower', points: 10, unlockAt: 4000, wordCount: 2 },
  { id: 119, arabic: 'يَا رَزَّاقُ', transliteration: 'Ya Razzaq', translation: 'O The Provider', points: 10, unlockAt: 4500, wordCount: 2 },
  { id: 120, arabic: 'يَا فَتَّاحُ', transliteration: 'Ya Fattah', translation: 'O The Opener', points: 10, unlockAt: 4500, wordCount: 2 },
  { id: 121, arabic: 'يَا عَلِيمُ', transliteration: 'Ya Aleem', translation: 'O The All-Knowing', points: 10, unlockAt: 5000, wordCount: 2 },
  { id: 122, arabic: 'يَا قَابِضُ', transliteration: 'Ya Qabid', translation: 'O The Withholder', points: 10, unlockAt: 5000, wordCount: 2 },
  { id: 123, arabic: 'يَا بَاسِطُ', transliteration: 'Ya Basit', translation: 'O The Extender', points: 10, unlockAt: 5500, wordCount: 2 },
  { id: 124, arabic: 'يَا خَافِضُ', transliteration: 'Ya Khafid', translation: 'O The Abaser', points: 10, unlockAt: 5500, wordCount: 2 },
  { id: 125, arabic: 'يَا رَافِعُ', transliteration: 'Ya Rafi', translation: 'O The Exalter', points: 10, unlockAt: 6000, wordCount: 2 },
  { id: 126, arabic: 'يَا مُعِزُّ', transliteration: 'Ya Mu\'izz', translation: 'O The Honorer', points: 10, unlockAt: 6000, wordCount: 2 },
  { id: 127, arabic: 'يَا مُذِلُّ', transliteration: 'Ya Muzill', translation: 'O The Humiliator', points: 10, unlockAt: 6500, wordCount: 2 },
  { id: 128, arabic: 'يَا سَمِيعُ', transliteration: 'Ya Sami', translation: 'O The All-Hearing', points: 10, unlockAt: 6500, wordCount: 2 },
  { id: 129, arabic: 'يَا بَصِيرُ', transliteration: 'Ya Basir', translation: 'O The All-Seeing', points: 10, unlockAt: 7000, wordCount: 2 },
  { id: 130, arabic: 'يَا حَكَمُ', transliteration: 'Ya Hakam', translation: 'O The Judge', points: 10, unlockAt: 7000, wordCount: 2 },
  { id: 131, arabic: 'يَا عَدْلُ', transliteration: 'Ya Adl', translation: 'O The Just', points: 10, unlockAt: 7500, wordCount: 2 },
  { id: 132, arabic: 'يَا لَطِيفُ', transliteration: 'Ya Latif', translation: 'O The Subtle', points: 10, unlockAt: 7500, wordCount: 2 },
  { id: 133, arabic: 'يَا خَبِيرُ', transliteration: 'Ya Khabir', translation: 'O The Aware', points: 10, unlockAt: 8000, wordCount: 2 },
  { id: 134, arabic: 'يَا حَلِيمُ', transliteration: 'Ya Halim', translation: 'O The Forbearing', points: 10, unlockAt: 8000, wordCount: 2 },
  { id: 135, arabic: 'يَا عَظِيمُ', transliteration: 'Ya Azim', translation: 'O The Magnificent', points: 10, unlockAt: 8500, wordCount: 2 },
  { id: 136, arabic: 'يَا غَفُورُ', transliteration: 'Ya Ghafur', translation: 'O The Forgiving', points: 10, unlockAt: 8500, wordCount: 2 },
  { id: 137, arabic: 'يَا شَكُورُ', transliteration: 'Ya Shakur', translation: 'O The Appreciative', points: 10, unlockAt: 9000, wordCount: 2 },
  { id: 138, arabic: 'يَا عَلِيُّ', transliteration: 'Ya Ali', translation: 'O The Most High', points: 10, unlockAt: 9000, wordCount: 2 },
  { id: 139, arabic: 'يَا كَبِيرُ', transliteration: 'Ya Kabir', translation: 'O The Great', points: 10, unlockAt: 9500, wordCount: 2 },
  { id: 140, arabic: 'يَا حَفِيظُ', transliteration: 'Ya Hafiz', translation: 'O The Preserver', points: 10, unlockAt: 9500, wordCount: 2 },
  { id: 141, arabic: 'يَا مُقِيتُ', transliteration: 'Ya Muqit', translation: 'O The Sustainer', points: 10, unlockAt: 10000, wordCount: 2 },
  { id: 142, arabic: 'يَا حَسِيبُ', transliteration: 'Ya Hasib', translation: 'O The Reckoner', points: 10, unlockAt: 10000, wordCount: 2 },
  { id: 143, arabic: 'يَا جَلِيلُ', transliteration: 'Ya Jalil', translation: 'O The Majestic', points: 10, unlockAt: 10500, wordCount: 2 },
  { id: 144, arabic: 'يَا كَرِيمُ', transliteration: 'Ya Karim', translation: 'O The Generous', points: 10, unlockAt: 10500, wordCount: 2 },
  { id: 145, arabic: 'يَا رَقِيبُ', transliteration: 'Ya Raqib', translation: 'O The Watchful', points: 10, unlockAt: 11000, wordCount: 2 },
  { id: 146, arabic: 'يَا مُجِيبُ', transliteration: 'Ya Mujib', translation: 'O The Responsive', points: 10, unlockAt: 11000, wordCount: 2 },
  { id: 147, arabic: 'يَا وَاسِعُ', transliteration: 'Ya Wasi', translation: 'O The All-Encompassing', points: 10, unlockAt: 11500, wordCount: 2 },
  { id: 148, arabic: 'يَا حَكِيمُ', transliteration: 'Ya Hakim', translation: 'O The Wise', points: 10, unlockAt: 11500, wordCount: 2 },
  { id: 149, arabic: 'يَا وَدُودُ', transliteration: 'Ya Wadud', translation: 'O The Loving', points: 10, unlockAt: 12000, wordCount: 2 },
  { id: 150, arabic: 'يَا مَجِيدُ', transliteration: 'Ya Majid', translation: 'O The Glorious', points: 10, unlockAt: 12000, wordCount: 2 },
  { id: 151, arabic: 'يَا بَاعِثُ', transliteration: 'Ya Ba\'ith', translation: 'O The Resurrector', points: 10, unlockAt: 12500, wordCount: 2 },
  { id: 152, arabic: 'يَا شَهِيدُ', transliteration: 'Ya Shahid', translation: 'O The Witness', points: 10, unlockAt: 12500, wordCount: 2 },
  { id: 153, arabic: 'يَا حَقُّ', transliteration: 'Ya Haqq', translation: 'O The Truth', points: 10, unlockAt: 13000, wordCount: 2 },
  { id: 154, arabic: 'يَا وَكِيلُ', transliteration: 'Ya Wakil', translation: 'O The Trustee', points: 10, unlockAt: 13000, wordCount: 2 },
  { id: 155, arabic: 'يَا قَوِيُّ', transliteration: 'Ya Qawi', translation: 'O The Strong', points: 10, unlockAt: 13500, wordCount: 2 },
  { id: 156, arabic: 'يَا مَتِينُ', transliteration: 'Ya Matin', translation: 'O The Firm', points: 10, unlockAt: 13500, wordCount: 2 },
  { id: 157, arabic: 'يَا وَلِيُّ', transliteration: 'Ya Wali', translation: 'O The Protecting Friend', points: 10, unlockAt: 14000, wordCount: 2 },
  { id: 158, arabic: 'يَا حَمِيدُ', transliteration: 'Ya Hamid', translation: 'O The Praiseworthy', points: 10, unlockAt: 14000, wordCount: 2 },
  { id: 159, arabic: 'يَا مُحْصِي', transliteration: 'Ya Muhsi', translation: 'O The Accounter', points: 10, unlockAt: 14500, wordCount: 2 },
  { id: 160, arabic: 'يَا مُبْدِئُ', transliteration: 'Ya Mubdi', translation: 'O The Originator', points: 10, unlockAt: 14500, wordCount: 2 },
  { id: 161, arabic: 'يَا مُعِيدُ', transliteration: 'Ya Mu\'id', translation: 'O The Restorer', points: 10, unlockAt: 15000, wordCount: 2 },
  { id: 162, arabic: 'يَا مُحْيِي', transliteration: 'Ya Muhyi', translation: 'O The Giver of Life', points: 10, unlockAt: 15000, wordCount: 2 },
  { id: 163, arabic: 'يَا مُمِيتُ', transliteration: 'Ya Mumit', translation: 'O The Bringer of Death', points: 10, unlockAt: 15500, wordCount: 2 },
  { id: 164, arabic: 'يَا حَيُّ', transliteration: 'Ya Hayy', translation: 'O The Ever-Living', points: 10, unlockAt: 15500, wordCount: 2 },
  { id: 165, arabic: 'يَا قَيُّومُ', transliteration: 'Ya Qayyum', translation: 'O The Sustainer', points: 10, unlockAt: 16000, wordCount: 2 },
  { id: 166, arabic: 'يَا وَاجِدُ', transliteration: 'Ya Wajid', translation: 'O The Finder', points: 10, unlockAt: 16000, wordCount: 2 },
  { id: 167, arabic: 'يَا مَاجِدُ', transliteration: 'Ya Majid', translation: 'O The Noble', points: 10, unlockAt: 16500, wordCount: 2 },
  { id: 168, arabic: 'يَا وَاحِدُ', transliteration: 'Ya Wahid', translation: 'O The One', points: 10, unlockAt: 16500, wordCount: 2 },
  { id: 169, arabic: 'يَا صَمَدُ', transliteration: 'Ya Samad', translation: 'O The Eternal', points: 10, unlockAt: 17000, wordCount: 2 },
  { id: 170, arabic: 'يَا قَادِرُ', transliteration: 'Ya Qadir', translation: 'O The Capable', points: 10, unlockAt: 17000, wordCount: 2 },
  { id: 171, arabic: 'يَا مُقْتَدِرُ', transliteration: 'Ya Muqtadir', translation: 'O The Powerful', points: 10, unlockAt: 17500, wordCount: 2 },
  { id: 172, arabic: 'يَا مُقَدِّمُ', transliteration: 'Ya Muqaddim', translation: 'O The Expediter', points: 10, unlockAt: 17500, wordCount: 2 },
  { id: 173, arabic: 'يَا مُؤَخِّرُ', transliteration: 'Ya Mu\'akhkhir', translation: 'O The Delayer', points: 10, unlockAt: 18000, wordCount: 2 },
  { id: 174, arabic: 'يَا أَوَّلُ', transliteration: 'Ya Awwal', translation: 'O The First', points: 10, unlockAt: 18000, wordCount: 2 },
  { id: 175, arabic: 'يَا آخِرُ', transliteration: 'Ya Akhir', translation: 'O The Last', points: 10, unlockAt: 18500, wordCount: 2 },
  { id: 176, arabic: 'يَا ظَاهِرُ', transliteration: 'Ya Zahir', translation: 'O The Manifest', points: 10, unlockAt: 18500, wordCount: 2 },
  { id: 177, arabic: 'يَا بَاطِنُ', transliteration: 'Ya Batin', translation: 'O The Hidden', points: 10, unlockAt: 19000, wordCount: 2 },
  { id: 178, arabic: 'يَا وَالِي', transliteration: 'Ya Wali', translation: 'O The Governor', points: 10, unlockAt: 19000, wordCount: 2 },
  { id: 179, arabic: 'يَا مُتَعَالِي', transliteration: 'Ya Muta\'ali', translation: 'O The Most Exalted', points: 10, unlockAt: 19500, wordCount: 2 },
  { id: 180, arabic: 'يَا بَرُّ', transliteration: 'Ya Barr', translation: 'O The Source of Goodness', points: 10, unlockAt: 19500, wordCount: 2 },
  { id: 181, arabic: 'يَا تَوَّابُ', transliteration: 'Ya Tawwab', translation: 'O The Acceptor of Repentance', points: 10, unlockAt: 20000, wordCount: 2 },
  { id: 182, arabic: 'يَا مُنْتَقِمُ', transliteration: 'Ya Muntaqim', translation: 'O The Avenger', points: 10, unlockAt: 20000, wordCount: 2 },
  { id: 183, arabic: 'يَا عَفُوُّ', transliteration: 'Ya Afuww', translation: 'O The Pardoner', points: 10, unlockAt: 20500, wordCount: 2 },
  { id: 184, arabic: 'يَا رَؤُوفُ', transliteration: 'Ya Ra\'uf', translation: 'O The Kind', points: 10, unlockAt: 20500, wordCount: 2 },
  { id: 185, arabic: 'يَا مَالِكَ الْمُلْكِ', transliteration: 'Ya Malik-ul-Mulk', translation: 'O Owner of Sovereignty', points: 15, unlockAt: 21000, wordCount: 3 },
  { id: 186, arabic: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', transliteration: 'Ya Dhal-Jalali wal-Ikram', translation: 'O Possessor of Majesty and Honor', points: 15, unlockAt: 21500, wordCount: 4 },
  { id: 187, arabic: 'يَا مُقْسِطُ', transliteration: 'Ya Muqsit', translation: 'O The Equitable', points: 10, unlockAt: 22000, wordCount: 2 },
  { id: 188, arabic: 'يَا جَامِعُ', transliteration: 'Ya Jami', translation: 'O The Gatherer', points: 10, unlockAt: 22000, wordCount: 2 },
  { id: 189, arabic: 'يَا غَنِيُّ', transliteration: 'Ya Ghani', translation: 'O The Self-Sufficient', points: 10, unlockAt: 22500, wordCount: 2 },
  { id: 190, arabic: 'يَا مُغْنِي', transliteration: 'Ya Mughni', translation: 'O The Enricher', points: 10, unlockAt: 22500, wordCount: 2 },
  { id: 191, arabic: 'يَا مَانِعُ', transliteration: 'Ya Mani', translation: 'O The Preventer', points: 10, unlockAt: 23000, wordCount: 2 },
  { id: 192, arabic: 'يَا ضَارُّ', transliteration: 'Ya Darr', translation: 'O The Distresser', points: 10, unlockAt: 23000, wordCount: 2 },
  { id: 193, arabic: 'يَا نَافِعُ', transliteration: 'Ya Nafi', translation: 'O The Benefiter', points: 10, unlockAt: 23500, wordCount: 2 },
  { id: 194, arabic: 'يَا نُورُ', transliteration: 'Ya Nur', translation: 'O The Light', points: 10, unlockAt: 23500, wordCount: 2 },
  { id: 195, arabic: 'يَا هَادِي', transliteration: 'Ya Hadi', translation: 'O The Guide', points: 10, unlockAt: 24000, wordCount: 2 },
  { id: 196, arabic: 'يَا بَدِيعُ', transliteration: 'Ya Badi', translation: 'O The Incomparable', points: 10, unlockAt: 24000, wordCount: 2 },
  { id: 197, arabic: 'يَا بَاقِي', transliteration: 'Ya Baqi', translation: 'O The Everlasting', points: 10, unlockAt: 24500, wordCount: 2 },
  { id: 198, arabic: 'يَا وَارِثُ', transliteration: 'Ya Warith', translation: 'O The Inheritor', points: 10, unlockAt: 24500, wordCount: 2 },
  { id: 199, arabic: 'يَا رَشِيدُ', transliteration: 'Ya Rashid', translation: 'O The Guide to the Right Path', points: 10, unlockAt: 25000, wordCount: 2 },
  { id: 200, arabic: 'يَا صَبُورُ', transliteration: 'Ya Sabur', translation: 'O The Patient', points: 10, unlockAt: 25000, wordCount: 2 },
];

// Refined Badges & Achievements System
const ACHIEVEMENTS = [
  // Category 1: The Consistency Chain (The Path of the Steadfast)
  { 
    id: 'al-mujawid', 
    name: 'Al-Mujawid', 
    nameEn: 'The Excellent Worshipper',
    description: '7-Day Streak', 
    icon: '🟢', 
    category: 'consistency',
    rarity: 'common',
    requirement: { type: 'streak', count: 7 } 
  },
  { 
    id: 'al-muqim', 
    name: 'Al-Muqim', 
    nameEn: 'The Steadfast',
    description: '30-Day Streak', 
    icon: '🔵', 
    category: 'consistency',
    rarity: 'rare',
    requirement: { type: 'streak', count: 30 } 
  },
  { 
    id: 'al-muhsin', 
    name: 'Al-Muhsin', 
    nameEn: 'The Virtuous Doer',
    description: '100-Day Streak', 
    icon: '🟣', 
    category: 'consistency',
    rarity: 'epic',
    requirement: { type: 'streak', count: 100 } 
  },
  { 
    id: 'al-abrar', 
    name: 'Al-Abrar', 
    nameEn: 'The Righteous',
    description: '365-Day Streak', 
    icon: '🟡', 
    category: 'consistency',
    rarity: 'legendary',
    requirement: { type: 'streak', count: 365 } 
  },

  // Category 2: The Path to Mastery - Subhanallah (Example - others can be added)
  { 
    id: 'glorifier-1', 
    name: 'Al-Musabbih I', 
    nameEn: 'The Glorifier',
    description: 'Said "Subhanallah" 1,000 times', 
    icon: '🌟', 
    category: 'mastery',
    tier: 1,
    tierName: 'Brass',
    rarity: 'common',
    requirement: { type: 'phrase_count', phraseId: 4, count: 1000 } 
  },
  { 
    id: 'glorifier-2', 
    name: 'Al-Musabbih II', 
    nameEn: 'The Glorifier',
    description: 'Said "Subhanallah" 2,000 times', 
    icon: '🌟🌟', 
    category: 'mastery',
    tier: 2,
    tierName: 'Bronze',
    rarity: 'common',
    requirement: { type: 'phrase_count', phraseId: 4, count: 2000 } 
  },
  { 
    id: 'glorifier-3', 
    name: 'Al-Musabbih Al-Kabir III', 
    nameEn: 'The Master Glorifier',
    description: 'Said "Subhanallah" 3,000 times', 
    icon: '🌟🌟🌟', 
    category: 'mastery',
    tier: 3,
    tierName: 'Silver',
    rarity: 'rare',
    requirement: { type: 'phrase_count', phraseId: 4, count: 3000 } 
  },
  { 
    id: 'glorifier-4', 
    name: 'Al-Musabbih Al-Mithali IV', 
    nameEn: 'The Exemplary Glorifier',
    description: 'Said "Subhanallah" 4,000 times', 
    icon: '🌟🌟🌟🌟', 
    category: 'mastery',
    tier: 4,
    tierName: 'Platinum',
    rarity: 'epic',
    requirement: { type: 'phrase_count', phraseId: 4, count: 4000 } 
  },
  { 
    id: 'glorifier-5', 
    name: 'Al-Musabbih Al-Usstha V', 
    nameEn: 'The Legendary Glorifier',
    description: 'Said "Subhanallah" 5,000 times', 
    icon: '🌟🌟🌟🌟🌟', 
    category: 'mastery',
    tier: 5,
    tierName: 'Gold',
    rarity: 'legendary',
    requirement: { type: 'phrase_count', phraseId: 4, count: 5000 } 
  },

  // Path to Mastery - Allahu Akbar (Al-Mukabbir - The One Who Magnifies)
  { 
    id: 'mukabbir-1', 
    name: 'Al-Mukabbir I', 
    nameEn: 'The One Who Magnifies',
    description: 'Said "Allahu Akbar" 1,000 times', 
    icon: '🌟', 
    category: 'mastery',
    tier: 1,
    tierName: 'Brass',
    rarity: 'common',
    requirement: { type: 'phrase_count', phraseId: 2, count: 1000 } 
  },
  { 
    id: 'mukabbir-2', 
    name: 'Al-Mukabbir II', 
    nameEn: 'The One Who Magnifies',
    description: 'Said "Allahu Akbar" 2,000 times', 
    icon: '🌟🌟', 
    category: 'mastery',
    tier: 2,
    tierName: 'Bronze',
    rarity: 'common',
    requirement: { type: 'phrase_count', phraseId: 2, count: 2000 } 
  },
  { 
    id: 'mukabbir-3', 
    name: 'Al-Mukabbir Al-Kabir III', 
    nameEn: 'The Master Magnifier',
    description: 'Said "Allahu Akbar" 3,000 times', 
    icon: '🌟🌟🌟', 
    category: 'mastery',
    tier: 3,
    tierName: 'Silver',
    rarity: 'rare',
    requirement: { type: 'phrase_count', phraseId: 2, count: 3000 } 
  },
  { 
    id: 'mukabbir-4', 
    name: 'Al-Mukabbir Al-Mithali IV', 
    nameEn: 'The Exemplary Magnifier',
    description: 'Said "Allahu Akbar" 4,000 times', 
    icon: '🌟🌟🌟🌟', 
    category: 'mastery',
    tier: 4,
    tierName: 'Platinum',
    rarity: 'epic',
    requirement: { type: 'phrase_count', phraseId: 2, count: 4000 } 
  },
  { 
    id: 'mukabbir-5', 
    name: 'Al-Mukabbir Al-Usstha V', 
    nameEn: 'The Legendary Magnifier',
    description: 'Said "Allahu Akbar" 5,000 times', 
    icon: '🌟🌟🌟🌟🌟', 
    category: 'mastery',
    tier: 5,
    tierName: 'Gold',
    rarity: 'legendary',
    requirement: { type: 'phrase_count', phraseId: 2, count: 5000 } 
  },

  // Path to Mastery - Alhamdulillah (Al-Hammad - The One Who Praises)
  { 
    id: 'hammad-1', 
    name: 'Al-Hammad I', 
    nameEn: 'The One Who Praises',
    description: 'Said "Alhamdulillah" 1,000 times', 
    icon: '🌟', 
    category: 'mastery',
    tier: 1,
    tierName: 'Brass',
    rarity: 'common',
    requirement: { type: 'phrase_count', phraseId: 3, count: 1000 } 
  },
  { 
    id: 'hammad-2', 
    name: 'Al-Hammad II', 
    nameEn: 'The One Who Praises',
    description: 'Said "Alhamdulillah" 2,000 times', 
    icon: '🌟🌟', 
    category: 'mastery',
    tier: 2,
    tierName: 'Bronze',
    rarity: 'common',
    requirement: { type: 'phrase_count', phraseId: 3, count: 2000 } 
  },
  { 
    id: 'hammad-3', 
    name: 'Al-Hammad Al-Kabir III', 
    nameEn: 'The Master Praiser',
    description: 'Said "Alhamdulillah" 3,000 times', 
    icon: '🌟🌟🌟', 
    category: 'mastery',
    tier: 3,
    tierName: 'Silver',
    rarity: 'rare',
    requirement: { type: 'phrase_count', phraseId: 3, count: 3000 } 
  },
  { 
    id: 'hammad-4', 
    name: 'Al-Hammad Al-Mithali IV', 
    nameEn: 'The Exemplary Praiser',
    description: 'Said "Alhamdulillah" 4,000 times', 
    icon: '🌟🌟🌟🌟', 
    category: 'mastery',
    tier: 4,
    tierName: 'Platinum',
    rarity: 'epic',
    requirement: { type: 'phrase_count', phraseId: 3, count: 4000 } 
  },
  { 
    id: 'hammad-5', 
    name: 'Al-Hammad Al-Usstha V', 
    nameEn: 'The Legendary Praiser',
    description: 'Said "Alhamdulillah" 5,000 times', 
    icon: '🌟🌟🌟🌟🌟', 
    category: 'mastery',
    tier: 5,
    tierName: 'Gold',
    rarity: 'legendary',
    requirement: { type: 'phrase_count', phraseId: 3, count: 5000 } 
  },

  // Path to Mastery - Astaghfirullah (At-Tawwab - The Repentant)
  { 
    id: 'tawwab-1', 
    name: 'At-Tawwab I', 
    nameEn: 'The Repentant',
    description: 'Said "Astaghfirullah" 1,000 times', 
    icon: '🌟', 
    category: 'mastery',
    tier: 1,
    tierName: 'Brass',
    rarity: 'common',
    requirement: { type: 'phrase_count', phraseId: 5, count: 1000 } 
  },
  { 
    id: 'tawwab-2', 
    name: 'At-Tawwab II', 
    nameEn: 'The Repentant',
    description: 'Said "Astaghfirullah" 2,000 times', 
    icon: '🌟🌟', 
    category: 'mastery',
    tier: 2,
    tierName: 'Bronze',
    rarity: 'common',
    requirement: { type: 'phrase_count', phraseId: 5, count: 2000 } 
  },
  { 
    id: 'tawwab-3', 
    name: 'At-Tawwab Al-Kabir III', 
    nameEn: 'The Master Repentant',
    description: 'Said "Astaghfirullah" 3,000 times', 
    icon: '🌟🌟🌟', 
    category: 'mastery',
    tier: 3,
    tierName: 'Silver',
    rarity: 'rare',
    requirement: { type: 'phrase_count', phraseId: 5, count: 3000 } 
  },
  { 
    id: 'tawwab-4', 
    name: 'At-Tawwab Al-Mithali IV', 
    nameEn: 'The Exemplary Repentant',
    description: 'Said "Astaghfirullah" 4,000 times', 
    icon: '🌟🌟🌟🌟', 
    category: 'mastery',
    tier: 4,
    tierName: 'Platinum',
    rarity: 'epic',
    requirement: { type: 'phrase_count', phraseId: 5, count: 4000 } 
  },
  { 
    id: 'tawwab-5', 
    name: 'At-Tawwab Al-Usstha V', 
    nameEn: 'The Legendary Repentant',
    description: 'Said "Astaghfirullah" 5,000 times', 
    icon: '🌟🌟🌟🌟🌟', 
    category: 'mastery',
    tier: 5,
    tierName: 'Gold',
    rarity: 'legendary',
    requirement: { type: 'phrase_count', phraseId: 5, count: 5000 } 
  },

  // Category 3: The Spiritual Voyage (Earning Your Divine Titles)
  { 
    id: 'al-mustaghfir', 
    name: 'Al-Mustaghfir', 
    nameEn: 'The Constant Seeker of Forgiveness',
    description: 'Use all forgiveness-related phrases in a week', 
    icon: '🤲', 
    category: 'spiritual',
    rarity: 'rare',
    requirement: { type: 'category_weekly', category: 'forgiveness' } 
  },
  { 
    id: 'ash-shakir', 
    name: 'Ash-Shakir', 
    nameEn: 'The Thankful One',
    description: 'Reach Mastery Level II on Alhamdulillah phrases', 
    icon: '🙏', 
    category: 'spiritual',
    rarity: 'rare',
    requirement: { type: 'mastery_level', phrases: [3, 15], level: 2 } 
  },
  { 
    id: 'al-mutawakkil', 
    name: 'Al-Mutawakkil', 
    nameEn: 'The One Who Relies on God',
    description: 'Use "Hasbunallahu" phrases 500 times', 
    icon: '🤝', 
    category: 'spiritual',
    rarity: 'rare',
    requirement: { type: 'phrase_count', phraseId: 8, count: 500 } 
  },
  { 
    id: 'at-talib-ul-ilm', 
    name: 'At-Talib ul-\'Ilm', 
    nameEn: 'The Seeker of Knowledge',
    description: 'Use "Rabbi zidni \'ilma" 100 times', 
    icon: '📚', 
    category: 'spiritual',
    rarity: 'rare',
    requirement: { type: 'phrase_count', phraseId: 18, count: 100 } 
  },
  { 
    id: 'ar-radi', 
    name: 'Ar-Radi', 
    nameEn: 'The Contented One',
    description: 'Use "Radheetu billahi Rabban" 100 times', 
    icon: '😌', 
    category: 'spiritual',
    rarity: 'rare',
    requirement: { type: 'phrase_count', phraseId: 10, count: 100 } 
  },
  { 
    id: 'al-muhtadi', 
    name: 'Al-Muhtadi', 
    nameEn: 'The Guided One',
    description: 'Unlock the final phrase "Ihdinas-siratal mustaqeem"', 
    icon: '🕋', 
    category: 'spiritual',
    rarity: 'epic',
    requirement: { type: 'unlock_phrase', phraseId: 20 } 
  },

  // Category 4: The Immersive Experience (Deeds of the Pious)
  { 
    id: 'al-muraqib', 
    name: 'Al-Murāqib', 
    nameEn: 'The Mindful',
    description: 'Complete a 10-minute continuous session', 
    icon: '🎯', 
    category: 'immersive',
    rarity: 'common',
    requirement: { type: 'session_duration', count: 600 } 
  },
  { 
    id: 'al-mudhakkir', 
    name: 'Al-Mudhakkir', 
    nameEn: 'The Deep in Remembrance',
    description: 'Complete a 20-minute continuous session', 
    icon: '🧘', 
    category: 'immersive',
    rarity: 'rare',
    requirement: { type: 'session_duration', count: 1200 } 
  },
  { 
    id: 'dhu-al-hijjatayn', 
    name: 'Dhū al-Hijjatayn', 
    nameEn: 'The One of Two Migrations',
    description: 'Earn 1,000 points in a single day', 
    icon: '🚀', 
    category: 'immersive',
    rarity: 'epic',
    requirement: { type: 'daily_points', count: 1000 } 
  },

  // Category 5: The Secret & Serendipitous (Hidden Blessings)
  { 
    id: 'al-fatih', 
    name: 'Al-Fātih', 
    nameEn: 'The Opener',
    description: 'Say "Bismillah" as your very first phrase ever', 
    icon: '🔑', 
    category: 'secret',
    rarity: 'rare',
    requirement: { type: 'first_phrase', phraseId: 1 } 
  },
  { 
    id: 'al-lubb', 
    name: 'Al-Lubb', 
    nameEn: 'Night Intellect',
    description: 'Perform Zikr during last third of night', 
    icon: '🌙', 
    category: 'secret',
    rarity: 'epic',
    requirement: { type: 'night_session' } 
  },
  { 
    id: 'al-khalish', 
    name: 'Al-Khālish', 
    nameEn: 'The Sincere',
    description: 'Perform a 5-minute session with phone on silent', 
    icon: '🤫', 
    category: 'secret',
    rarity: 'rare',
    requirement: { type: 'silent_session', count: 300 } 
  },
  { 
    id: 'dhu-al-faqar', 
    name: 'Dhū al-Faqār', 
    nameEn: 'The One with the Distinction',
    description: 'Unlock all other badges in the game', 
    icon: '🎉', 
    category: 'secret',
    rarity: 'legendary',
    requirement: { type: 'all_badges' } 
  },
];

// Color scheme for each phrase
const getPhraseColor = (phraseId) => {
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

const ZikrGame = () => {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Game state
  const [screen, setScreen] = useState('menu'); // menu, game, stats, profile, leaderboard, achievements, mode-select, tasbih-setup
  const [gameMode, setGameMode] = useState('focus'); // focus, names, arcade, tasbih
  const [totalPoints, setTotalPoints] = useState(0);
  const [sessionScore, setSessionScore] = useState(0);
  const [lives, setLives] = useState(5);
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [bismillahCount, setBismillahCount] = useState(0); // Track total Bismillah spawns
  const [bismillahHelpCount, setBismillahHelpCount] = useState(0); // Track "help" Bismillah spawns after misses
  const [phrases, setPhrases] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [newlyUnlockedPhrases, setNewlyUnlockedPhrases] = useState({}); // Track newly unlocked phrases and their appearance count
  const [newlyUnlockedAsmaNames, setNewlyUnlockedAsmaNames] = useState({}); // Track newly unlocked Asma names and their appearance count
  const [totalPhrasesAppeared, setTotalPhrasesAppeared] = useState(0); // Track total phrases that appeared
  const [sessionStats, setSessionStats] = useState({
    totalTaps: 0,
    missedPhrases: 0,
    accuracy: 0,
    duration: 0
  });
  
  // Tasbih Mode specific state (formerly Tasbih)
  const [tasbihSelectedPhrase, setTasbihSelectedPhrase] = useState(null);
  const [tasbihTargetCount, setTasbihTargetCount] = useState(100);
  const [tasbihCurrentCount, setTasbihCurrentCount] = useState(0);
  const [tasbihTotalCounts, setTasbihTotalCounts] = useState({}); // Track total counts per phrase in Tasbih mode
  
  // Asma ul Husna tap counter (for 33-tap unlock system)
  const [asmaTotalTaps, setAsmaTotalTaps] = useState(0); // Cumulative taps across all sessions
  
  // Background change notification
  const [showBackgroundChange, setShowBackgroundChange] = useState(false);
  const [backgroundMessage, setBackgroundMessage] = useState('');
  const lastBackgroundRef = useRef(null);
  
  // Dynamic Background & Audio System (Focus Mode)
  const [currentBackgroundIndex, setCurrentBackgroundIndex] = useState(1);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const audioRef = useRef(null);
  const nextAudioRef = useRef(null); // For preloading
  const isFadingRef = useRef(false);
  
  // Sound Effects System
  const [soundsLoaded, setSoundsLoaded] = useState(false);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const soundRefs = useRef({
    tapSuccess: null,
    phraseMiss: null,
    phraseUnlock: null,
    completion: null
  });
  const soundVolumes = {
    tapSuccess: 0.6,    // 60%
    phraseMiss: 0.4,    // 40%
    phraseUnlock: 0.8,  // 80%
    completion: 0.9     // 90%
  };
  
  // Streak Freeze Token System
  const [showTokenEarned, setShowTokenEarned] = useState(false);
  const [showTokenUsed, setShowTokenUsed] = useState(false);
  const [tokenUsedMessage, setTokenUsedMessage] = useState('');
  const [showFreezeCalendar, setShowFreezeCalendar] = useState(false);
  const [selectedFreezeDates, setSelectedFreezeDates] = useState([]);
  
  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [leaderboardUserContext, setLeaderboardUserContext] = useState([]);

  const gameLoopRef = useRef(null);
  const nextPhraseIdRef = useRef(0);
  const gameStartTimeRef = useRef(null);
  const previouslyUnlockedRef = useRef(new Set([1, 2, 3, 4])); // Track what was unlocked before this session
  const sessionScoreRef = useRef(0); // Track session score in ref for real-time access
  const tasbihCurrentCountRef = useRef(0); // Track Tasbih count in ref for real-time access (renamed from tasbih)
  const gameModeRef = useRef('focus'); // Track game mode in ref for immediate updates
  const bismillahCountRef = useRef(0); // Track Bismillah count in ref for immediate access

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
          setTasbihTotalCounts(result.data.tasbihTotalCounts || {}); // Load Tasbih counts
          setShowAuth(false);
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

  // Sync totalPoints when currentUser updates
  useEffect(() => {
    if (currentUser && currentUser.totalPoints !== undefined) {
      setTotalPoints(currentUser.totalPoints);
    }
  }, [currentUser]);

  // Auth functions
  const handleAuth = async () => {
    if (!username || !password) {
      alert('Please enter username and password');
      return;
    }

    let result;
    if (isSignUp) {
      result = await registerUser(username, password);
    } else {
      result = await loginUser(username, password);
    }

    if (result.success) {
      const userData = result.userData || (await getUserData(result.userId)).data;
      
      setCurrentUser({
        userId: result.userId,
        username: userData.username,
        ...userData
      });
      setIsAuthenticated(true);
      setShowAuth(false);
      setTotalPoints(userData.totalPoints || 0);
      
      console.log('✅ Logged in successfully');
    } else {
      alert(result.error || 'Authentication failed');
    }
  };

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setShowAuth(true);
      setScreen('menu');
    }
  };
  
  // Load leaderboard from Firebase
  const loadLeaderboard = async () => {
    const result = await getLeaderboard(currentUser?.userId || null);
    if (result.success) {
      setLeaderboardData(result.leaderboard);
      setLeaderboardUserContext(result.userContext || []);
    } else {
      console.error('Failed to load leaderboard:', result.error);
    }
  };
  
  // Load leaderboard when screen changes
  useEffect(() => {
    if (screen === 'leaderboard' && isAuthenticated) {
      loadLeaderboard();
    }
  }, [screen, isAuthenticated]);

  // ===== STREAK FREEZE TOKEN SYSTEM =====
  
  // Calculate freeze tokens from lifetime points
  const calculateFreezeTokens = (lifetimePoints) => {
    const tokensEarned = Math.floor(lifetimePoints / 30000);
    return Math.min(tokensEarned, 10); // Max 10 tokens
  };
  
  // Check if a specific date has active freeze
  const isDateFrozen = (dateString) => {
    const activeFreezes = currentUser?.activeFreezes || [];
    return activeFreezes.includes(dateString);
  };
  
  // Activate manual freeze for selected dates
  const activateManualFreeze = async (dates) => {
    if (!currentUser || !currentUser.userId) return;
    
    const availableTokens = calculateFreezeTokens(currentUser.totalLifetimePoints || 0);
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
        activeFreezes: newFreezes
      });
      
      setCurrentUser(prev => ({
        ...prev,
        activeFreezes: newFreezes
      }));
      
      console.log('[FREEZE] Manual freeze activated for:', dates);
      setShowFreezeCalendar(false);
      setSelectedFreezeDates([]);
      
      alert(`Streak freeze activated for ${dates.length} day(s)!`);
    } catch (error) {
      console.error('[FREEZE] Error activating freeze:', error);
    }
  };
  
  // ===== END STREAK FREEZE TOKEN SYSTEM =====

  // ===== DAILY STREAK SYSTEM (Calendar-based) =====
  
  // Update daily streak (called when game starts)
  const updateDailyStreak = async () => {
    if (!currentUser || !currentUser.userId) return;
    
    const now = new Date();
    const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Today at midnight
    
    const lastPlayed = currentUser.lastPlayedDate ? new Date(currentUser.lastPlayedDate) : null;
    const lastPlayedDate = lastPlayed ? new Date(lastPlayed.getFullYear(), lastPlayed.getMonth(), lastPlayed.getDate()) : null;
    
    let newStreak = currentUser.currentStreak || 0;
    let newLongestStreak = currentUser.longestStreak || 0;
    
    if (!lastPlayedDate) {
      // First time playing ever
      newStreak = 1;
      console.log('[STREAK] First play ever - streak set to 1');
    } else {
      // Calculate days between last played and today
      const daysDifference = Math.floor((todayDate - lastPlayedDate) / (1000 * 60 * 60 * 24));
      
      console.log('[STREAK] Days since last play:', daysDifference);
      
      if (daysDifference === 0) {
        // Already played today - keep streak
        console.log('[STREAK] Already played today - maintaining streak:', newStreak);
        return; // Don't update database, just return
      } else if (daysDifference === 1) {
        // Played yesterday - increment streak
        newStreak += 1;
        console.log('[STREAK] Consecutive day - streak incremented to:', newStreak);
      } else {
        // Missed 1+ days - check for freeze tokens or active freezes
        const missedDays = daysDifference - 1;
        console.log('[STREAK] Missed', missedDays, 'days - checking for freeze tokens...');
        
        // Check if missed days have active freezes or can use tokens
        let canProtectStreak = false;
        const activeFreezes = currentUser.activeFreezes || [];
        const availableTokens = calculateFreezeTokens(currentUser.totalLifetimePoints || 0);
        const usedTokens = activeFreezes.length;
        const remainingTokens = availableTokens - usedTokens;
        
        // Check if all missed days are covered by active freezes
        const allMissedDaysFrozen = Array.from({length: missedDays}, (_, i) => {
          const missedDate = new Date(lastPlayedDate);
          missedDate.setDate(missedDate.getDate() + i + 1);
          const dateString = missedDate.toISOString().split('T')[0];
          return activeFreezes.includes(dateString);
        }).every(Boolean);
        
        if (allMissedDaysFrozen) {
          // All missed days were manually frozen
          newStreak += 1;
          canProtectStreak = true;
          console.log('[FREEZE] All missed days covered by manual freezes');
        } else if (missedDays <= remainingTokens) {
          // Auto-use tokens to protect streak
          const newFreezes = [...activeFreezes];
          
          // Add missed days to active freezes (auto-use tokens)
          for (let i = 0; i < missedDays; i++) {
            const missedDate = new Date(lastPlayedDate);
            missedDate.setDate(missedDate.getDate() + i + 1);
            const dateString = missedDate.toISOString().split('T')[0];
            if (!newFreezes.includes(dateString)) {
              newFreezes.push(dateString);
            }
          }
          
          // Update active freezes in current user
          currentUser.activeFreezes = newFreezes;
          
          // Continue streak
          newStreak += 1;
          canProtectStreak = true;
          
          console.log(`[FREEZE] Auto-used ${missedDays} token(s) to protect streak`);
          
          // Show notification to user
          setTokenUsedMessage(`You missed ${missedDays} day(s)!\nStreak Freeze used 🛡️\nYour ${newStreak - 1}-day streak is safe!\nTokens remaining: ${remainingTokens - missedDays}/10`);
          setShowTokenUsed(true);
        } else {
          // Not enough tokens - streak breaks
          newStreak = 1;
          console.log('[FREEZE] Not enough tokens - streak reset to 1');
          
          // Show message about no tokens
          if (remainingTokens === 0) {
            setTokenUsedMessage(`You missed ${missedDays} day(s)!\nNo streak freezes available.\nStreak reset to 1.\nKeep playing to earn tokens!\n(Every 30,000 lifetime points = 1 token)`);
          } else {
            setTokenUsedMessage(`You missed ${missedDays} day(s)!\nOnly ${remainingTokens} token(s) available.\nStreak reset to 1.\nKeep playing to earn more tokens!`);
          }
          setShowTokenUsed(true);
        }
        
        // Update active freezes in database if tokens were used
        if (canProtectStreak) {
          try {
            await saveGameProgress(currentUser.userId, {
              activeFreezes: currentUser.activeFreezes
            });
          } catch (error) {
            console.error('[FREEZE] Error updating active freezes:', error);
          }
        }
      }
    }
    
    // Update longest streak if current is higher
    if (newStreak > newLongestStreak) {
      newLongestStreak = newStreak;
      console.log('[STREAK] New longest streak!', newLongestStreak);
    }
    
    // Update in Firebase
    try {
      await saveGameProgress(currentUser.userId, {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastPlayedDate: now.toISOString()
      });
      
      // Update local state
      setCurrentUser(prev => ({
        ...prev,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastPlayedDate: now.toISOString()
      }));
      
      console.log('[STREAK] Updated in database:', { newStreak, newLongestStreak });
    } catch (error) {
      console.error('[STREAK] Error updating streak:', error);
    }
  };
  
  // ===== END DAILY STREAK SYSTEM =====

  // Save user progress
  const saveProgress = async (points, additionalTime = 0, sessionAccuracy = 0, sessionPoints = 0) => {
    if (!currentUser || !currentUser.userId) return false;
    
    const newTotalTime = (currentUser.totalZikrTime || 0) + additionalTime;
    const newSessionsCompleted = (currentUser.sessionsCompleted || 0) + 1;
    
    // Use current streak (already updated by updateDailyStreak when game started)
    const newStreak = currentUser.currentStreak || 0;
    const newLongestStreak = currentUser.longestStreak || 0;
    
    // Track lifetime points and check for token earning
    const previousLifetimePoints = currentUser.totalLifetimePoints || 0;
    const newLifetimePoints = previousLifetimePoints + sessionPoints;
    
    // Check if user earned new token (crossed 30K threshold)
    const previousTokens = calculateFreezeTokens(previousLifetimePoints);
    const newTokens = calculateFreezeTokens(newLifetimePoints);
    
    if (newTokens > previousTokens) {
      // User earned new token(s)!
      const tokensEarned = newTokens - previousTokens;
      console.log(`[TOKEN] Earned ${tokensEarned} new freeze token(s)!`);
      
      // Show celebration notification
      setTimeout(() => {
        setShowTokenEarned(true);
      }, 1000);
    }
    
    // Check for new achievements
    const currentAchievements = currentUser.achievements || [];
    const newAchievements = [...currentAchievements];
    
    ACHIEVEMENTS.forEach(achievement => {
      if (!currentAchievements.includes(achievement.id)) {
        let earned = false;
        
        switch (achievement.requirement.type) {
          case 'sessions':
            earned = newSessionsCompleted >= achievement.requirement.count;
            break;
          case 'points':
            earned = points >= achievement.requirement.count;
            break;
          case 'streak':
            earned = newStreak >= achievement.requirement.count;
            break;
          case 'time':
            earned = newTotalTime >= achievement.requirement.count;
            break;
          case 'unlocked':
            earned = getUnlockedPhraseIds(points).length >= achievement.requirement.count;
            break;
          case 'accuracy':
            earned = sessionAccuracy >= achievement.requirement.count;
            break;
          case 'session_score':
            earned = sessionPoints >= achievement.requirement.count;
            break;
          case 'phrase_count':
            const phraseCount = (currentUser.phraseCounts || {})[achievement.requirement.phraseId] || 0;
            earned = phraseCount >= achievement.requirement.count;
            console.log(`[ACHIEVEMENT CHECK] ${achievement.name}: phraseId ${achievement.requirement.phraseId} count ${phraseCount} >= ${achievement.requirement.count}? ${earned}`);
            break;
          case 'session_duration':
            earned = additionalTime >= achievement.requirement.count;
            break;
          case 'daily_points':
            earned = (currentUser.dailyPoints || 0) >= achievement.requirement.count;
            break;
          case 'unlock_phrase':
            earned = getUnlockedPhraseIds(points).includes(achievement.requirement.phraseId);
            break;
          case 'all_badges':
            const otherBadges = ACHIEVEMENTS.filter(a => a.id !== achievement.id);
            earned = otherBadges.every(a => currentAchievements.includes(a.id));
            break;
          case 'first_phrase':
            earned = false;
            break;
          case 'night_session':
          case 'silent_session':
          case 'category_weekly':
          case 'mastery_level':
            earned = false;
            break;
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
      totalLifetimePoints: newLifetimePoints, // Track cumulative lifetime points
      unlockedPhrases: getUnlockedPhraseIds(points),
      totalZikrTime: newTotalTime,
      achievements: newAchievements,
      sessionsCompleted: newSessionsCompleted,
      currentStreak: newStreak, // Already updated by updateDailyStreak()
      longestStreak: newLongestStreak, // Already updated by updateDailyStreak()
      phraseCounts: currentUser.phraseCounts || {},
      dailyPoints: currentUser.dailyPoints || 0,
      lastPointsResetDate: currentUser.lastPointsResetDate || new Date().toISOString().split('T')[0],
      asmaTotalTaps: asmaTotalTaps, // Save Asma tap count
      tasbihTotalCounts: tasbihTotalCounts, // Save Tasbih total counts
      activeFreezes: currentUser.activeFreezes || [] // Save active freeze dates
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

  // Get unlocked phrase IDs based on total points
  const getUnlockedPhraseIds = (points) => {
    return ZIKR_PHRASES.filter(p => p.unlockAt <= points).map(p => p.id);
  };
  
  // Get unlocked Asma ul Husna names based on tap count (33-tap rule)
  const getUnlockedAsmaIds = (tapCount) => {
    // Start with 2 names: Ya Allah (101) and Ya Rabb (102)
    // Every 33 taps unlocks the next name
    const baseUnlocked = 2;
    const additionalUnlocked = Math.floor(tapCount / 33);
    const totalUnlocked = Math.min(baseUnlocked + additionalUnlocked, NAMES_OF_ALLAH.length);
    
    return NAMES_OF_ALLAH.slice(0, totalUnlocked).map(n => n.id);
  };

  // Get available phrases for gameplay
  const getAvailablePhrases = () => {
    const unlockedIds = getUnlockedPhraseIds(totalPoints);
    return ZIKR_PHRASES.filter(p => unlockedIds.includes(p.id));
  };

  // Get dynamic background based on total points (Focus Mode only)
  // ===== DYNAMIC BACKGROUND & AUDIO SYSTEM (FOCUS MODE) =====
  
  // Calculate background index based on session score (1-11)
  const getBackgroundIndex = (score) => {
    // 0-799 → 1, 800-1599 → 2, 1600-2399 → 3, ... 8000+ → 11
    return Math.min(Math.floor(score / 800) + 1, 11);
  };
  
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
      audio.play().catch(err => {
        console.log('[AUDIO] Play prevented:', err);
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
    console.log(`[BG/AUDIO] Transitioning from ${currentBackgroundIndex} to ${newIndex}`);
    
    // Fade out current audio
    if (audioRef.current && !audioRef.current.paused) {
      await fadeOutAudio(audioRef.current, 1500);
    }
    
    // Update background index (triggers CSS transition)
    setCurrentBackgroundIndex(newIndex);
    
    // Load and fade in new audio
    if (!isAudioMuted && gameMode === 'focus' && screen === 'game') {
      const newAudio = new Audio(`/assets/audio/${newIndex}.mp3`);
      newAudio.loop = true;
      newAudio.volume = 0;
      
      // Preload next audio for smoother transitions
      if (newIndex < 11) {
        nextAudioRef.current = new Audio(`/assets/audio/${newIndex + 1}.mp3`);
        nextAudioRef.current.preload = 'auto';
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
    if (gameMode === 'focus' && screen === 'game') {
      const newIndex = getBackgroundIndex(sessionScore);
      if (newIndex !== currentBackgroundIndex) {
        transitionBackgroundAndAudio(newIndex);
      }
    }
  }, [sessionScore, gameMode, screen]);
  
  // Initialize audio when game starts (Focus Mode)
  useEffect(() => {
    if (gameMode === 'focus' && screen === 'game' && !isAudioMuted) {
      const initAudio = async () => {
        // Start with background 1 audio
        const audio = new Audio('/assets/audio/1.mp3');
        audio.loop = true;
        audio.volume = 0;
        audioRef.current = audio;
        
        // Preload background 2 audio
        nextAudioRef.current = new Audio('/assets/audio/2.mp3');
        nextAudioRef.current.preload = 'auto';
        
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
  }, [gameMode, screen]);
  
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
    console.log('[SOUNDS] Loading sound effects...');
    
    try {
      // Load all sound files
      soundRefs.current.tapSuccess = new Audio('/assets/audio/Tap Success.mp3');
      soundRefs.current.phraseMiss = new Audio('/assets/audio/Phrase Miss.mp3');
      soundRefs.current.phraseUnlock = new Audio('/assets/audio/Phrase Unlock.mp3');
      soundRefs.current.completion = new Audio('/assets/audio/Completion.mp3');
      
      // Set volumes
      soundRefs.current.tapSuccess.volume = soundVolumes.tapSuccess;
      soundRefs.current.phraseMiss.volume = soundVolumes.phraseMiss;
      soundRefs.current.phraseUnlock.volume = soundVolumes.phraseUnlock;
      soundRefs.current.completion.volume = soundVolumes.completion;
      
      // Preload all sounds
      Object.values(soundRefs.current).forEach(sound => {
        if (sound) sound.preload = 'auto';
      });
      
      setSoundsLoaded(true);
      console.log('[SOUNDS] All sound effects loaded successfully!');
    } catch (error) {
      console.error('[SOUNDS] Error loading sound effects:', error);
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
      soundClone.play().catch(err => {
        console.log(`[SOUNDS] Play prevented for ${soundName}:`, err);
      });
    } catch (error) {
      console.error(`[SOUNDS] Error playing ${soundName}:`, error);
    }
  };
  
  // Load sound effects on component mount
  useEffect(() => {
    loadSoundEffects();
    
    // Cleanup
    return () => {
      Object.values(soundRefs.current).forEach(sound => {
        if (sound) {
          sound.pause();
          sound.src = '';
        }
      });
    };
  }, []);
  
  // Toggle sound effects on/off
  const toggleSounds = () => {
    setSoundsEnabled(!soundsEnabled);
    console.log(`[SOUNDS] Sound effects ${!soundsEnabled ? 'enabled' : 'disabled'}`);
  };
  
  // ===== END SOUND EFFECTS SYSTEM =====
  
  // Handle pause/resume audio
  useEffect(() => {
    if (audioRef.current && gameMode === 'focus' && screen === 'game') {
      if (isPaused) {
        audioRef.current.pause();
      } else if (!isAudioMuted) {
        audioRef.current.play().catch(err => console.log('[AUDIO] Play prevented:', err));
      }
    }
  }, [isPaused, gameMode, screen]);
  
  // Legacy background function (kept for non-Focus modes)
  const getGameBackground = () => {
    const points = totalPoints + sessionScore;
    
    let background = '';
    let message = '';
    
    if (points < 250) {
      background = 'bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900';
      message = '🌙 Night Sky - Peaceful contemplation';
    } else if (points < 500) {
      background = 'bg-gradient-to-br from-amber-100 via-yellow-50 to-emerald-100';
      message = '🕌 Inside the Mosque - Sacred atmosphere';
    } else if (points < 750) {
      background = 'bg-gradient-to-br from-cyan-200 via-blue-100 to-amber-100';
      message = '🏖️ Beach - Calm and serene';
    } else if (points < 1000) {
      background = 'bg-gradient-to-br from-green-300 via-emerald-200 to-lime-100';
      message = '🌳 Jungle Morning - Fresh and alive';
    } else if (points < 1250) {
      background = 'bg-gradient-to-br from-slate-400 via-gray-300 to-blue-200';
      message = '🌧️ Rainy Road - Reflective moment';
    } else if (points < 1500) {
      background = 'bg-gradient-to-br from-orange-200 via-red-100 to-yellow-100';
      message = '🏪 Marketplace - Vibrant energy';
    } else {
      background = 'bg-gradient-to-br from-sky-300 via-slate-200 to-blue-100';
      message = '🏙️ High-rise View - You\'ve reached the top!';
    }
    
    // Check if background changed
    if (lastBackgroundRef.current !== background && lastBackgroundRef.current !== null) {
      setBackgroundMessage(message);
      setShowBackgroundChange(true);
      setTimeout(() => setShowBackgroundChange(false), 3000);
    }
    lastBackgroundRef.current = background;
    
    return background;
  };

  // Calculate speed based on session time
  // Speed scale: 1 (slowest) to 10 (fastest) - Starting at 3
  const getSpeed = () => {
    if (!gameStartTimeRef.current) return 0.3;
    
    // Asma ul Husna Mode: Fixed speed at Level 3 (0.3)
    if (gameModeRef.current === 'asma') {
      return 0.3; // Fixed speed at 0.3 (slower, more contemplative)
    }
    
    // Focus and Tasbih Modes: Gradual speed increase, then frequency increase
    const elapsed = (Date.now() - gameStartTimeRef.current) / 1000; // seconds
    const baseSpeed = 0.2; // Starting speed
    const speedIncrease = Math.floor(elapsed / 40) * 0.05; // Gradual increase every 40 seconds
    const maxSpeed = 0.4; // Cap speed at 0.4 (after this, increase frequency instead)
    return Math.min(baseSpeed + speedIncrease, maxSpeed);
  };

  // Create particle burst effect on unlock
  const createParticleBurst = (x = window.innerWidth / 2, y = window.innerHeight / 2, color = '#f59e0b') => {
    const particleCount = 20;
    const container = document.body;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor = color;
      
      // Random direction
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 100 + Math.random() * 100;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      particle.style.setProperty('--tx', `${tx}px`);
      particle.style.setProperty('--ty', `${ty}px`);
      
      container.appendChild(particle);
      
      // Remove after animation
      setTimeout(() => particle.remove(), 1000);
    }
  };

  // Create fireworks celebration effect
  const createFireworks = () => {
    const colors = ['#f59e0b', '#10b981', '#4f46e5', '#a855f7', '#fb923c'];
    const fireworkCount = 5;
    
    for (let i = 0; i < fireworkCount; i++) {
      setTimeout(() => {
        const x = Math.random() * window.innerWidth * 0.6 + window.innerWidth * 0.2; // 20-80% of width
        const y = Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.2; // 20-60% of height
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Create burst center
        const burst = document.createElement('div');
        burst.className = 'firework firework-burst';
        burst.style.left = `${x}px`;
        burst.style.top = `${y}px`;
        burst.style.backgroundColor = color;
        document.body.appendChild(burst);
        setTimeout(() => burst.remove(), 800);
        
        // Create particles
        const particleCount = 12;
        for (let j = 0; j < particleCount; j++) {
          const particle = document.createElement('div');
          particle.className = 'firework firework-particle';
          particle.style.left = `${x}px`;
          particle.style.top = `${y}px`;
          particle.style.backgroundColor = color;
          
          const angle = (Math.PI * 2 * j) / particleCount;
          const distance = 80 + Math.random() * 80;
          const tx = Math.cos(angle) * distance;
          const ty = Math.sin(angle) * distance;
          
          particle.style.setProperty('--tx', `${tx}px`);
          particle.style.setProperty('--ty', `${ty}px`);
          
          document.body.appendChild(particle);
          setTimeout(() => particle.remove(), 1200);
        }
      }, i * 300); // Stagger fireworks
    }
    
    // Add screen flash
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);
    
    // Add celebration text
    const celebrationText = document.createElement('div');
    celebrationText.className = 'celebration-text';
    celebrationText.textContent = '🎉 Alhamdulillah! 🎉';
    document.body.appendChild(celebrationText);
    setTimeout(() => celebrationText.remove(), 2000);
  };

  // ===== TAP EFFECT ANIMATIONS =====
  
  // Option A: Star Float (10 pts phrases)
  const createStarFloat = (x, y, points) => {
    const starElement = document.createElement('div');
    starElement.className = 'tap-star-float';
    starElement.textContent = `⭐ +${points}`;
    starElement.style.left = `${x}px`;
    starElement.style.top = `${y}px`;
    
    document.body.appendChild(starElement);
    setTimeout(() => starElement.remove(), 800);
  };
  
  // Option C: Sparkle Burst (15-20 pts phrases)
  const createSparkleBurst = (x, y, points) => {
    const sparkleCount = 8;
    
    // Create sparkles bursting outward
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'tap-sparkle';
      sparkle.textContent = '✨';
      sparkle.style.left = `${x}px`;
      sparkle.style.top = `${y}px`;
      
      // Random direction for burst
      const angle = (Math.PI * 2 * i) / sparkleCount;
      const distance = 40 + Math.random() * 40;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      sparkle.style.setProperty('--tx', `${tx}px`);
      sparkle.style.setProperty('--ty', `${ty}px`);
      
      document.body.appendChild(sparkle);
      setTimeout(() => sparkle.remove(), 800);
    }
    
    // Create floating points text
    const pointsText = document.createElement('div');
    pointsText.className = 'tap-sparkle-text';
    pointsText.textContent = `+${points} ✨`;
    pointsText.style.left = `${x}px`;
    pointsText.style.top = `${y}px`;
    
    document.body.appendChild(pointsText);
    setTimeout(() => pointsText.remove(), 1000);
  };
  
  // Option B: Transform to Star (25-30 pts phrases + newly unlocked)
  const createTransformStar = (x, y, points, isGolden = false) => {
    const starElement = document.createElement('div');
    starElement.className = isGolden ? 'tap-transform-star-glow' : 'tap-transform-star';
    starElement.textContent = isGolden ? '⭐✨' : '⭐';
    starElement.style.left = `${x}px`;
    starElement.style.top = `${y}px`;
    
    document.body.appendChild(starElement);
    setTimeout(() => starElement.remove(), isGolden ? 1500 : 1200);
    
    // Add points text that appears after star emerges
    setTimeout(() => {
      const pointsText = document.createElement('div');
      pointsText.className = 'tap-star-float';
      pointsText.textContent = `+${points}`;
      pointsText.style.left = `${x}px`;
      pointsText.style.top = `${y - 30}px`;
      pointsText.style.color = isGolden ? '#fbbf24' : '#f59e0b';
      
      document.body.appendChild(pointsText);
      setTimeout(() => pointsText.remove(), 800);
    }, 300);
  };
  
  // Main function to create tap effect based on phrase characteristics
  const createTapEffect = (x, y, points, isNewlyUnlocked) => {
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
  
  // ===== END TAP EFFECT ANIMATIONS =====

  // Start game
  const startGame = (mode = gameMode) => {
    console.log(`[START GAME] Mode parameter: ${mode}, gameMode state: ${gameMode}`);
    
    // Update daily streak (calendar-based)
    updateDailyStreak();
    
    // CRITICAL: Set mode ref IMMEDIATELY to prevent spawning wrong items
    gameModeRef.current = mode;
    console.log(`[START GAME] Set gameModeRef to: ${mode}`);
    
    // CRITICAL: Stop and clear everything from previous game first
    stopGameLoop();
    setPhrases([]);  // Clear old phrases immediately
    setIsPaused(false);
    
    // Small delay to ensure cleanup completes
    setTimeout(() => {
      // Determine which items to check based on game mode
      let allItems = [];
      if (mode === 'focus') {
        allItems = ZIKR_PHRASES;
      } else if (mode === 'asma') {
        allItems = NAMES_OF_ALLAH;
      } else if (mode === 'tasbih') {
        allItems = tasbihSelectedPhrase ? [tasbihSelectedPhrase] : [];
      }
      
      // Set previously unlocked based on current total points
      const currentUnlocked = allItems.filter(p => p.unlockAt <= totalPoints).map(p => p.id);
      previouslyUnlockedRef.current = new Set(currentUnlocked);
      
      setScreen('game');
      setSessionScore(0);
      sessionScoreRef.current = 0;
      setLives(5);
      setConsecutiveMisses(0);
      setBismillahCount(0); // Reset Bismillah counter
      bismillahCountRef.current = 0; // Reset ref
      setBismillahHelpCount(0); // Reset help Bismillah counter
      setPhrases([]);  // Clear again to be sure
      setNewlyUnlockedPhrases({});
      setNewlyUnlockedAsmaNames({}); // Reset newly unlocked Asma names
      setTotalPhrasesAppeared(0);
      
      // Reset background/audio for Focus Mode
      if (mode === 'focus') {
        setCurrentBackgroundIndex(1);
        isFadingRef.current = false;
      }
      
      // Reset game start time using ref for consistent speed
      const startTime = Date.now();
      gameStartTimeRef.current = startTime;
      setGameStartTime(startTime);
      
      setSessionStats({ totalTaps: 0, missedPhrases: 0, accuracy: 0, duration: 0 });
      nextPhraseIdRef.current = 0;
      
      // Small delay to ensure state is set before spawning initial phrases
      setTimeout(() => {
        // Spawn 3 initial items based on mode
        let firstItem;
        if (mode === 'focus') {
          firstItem = ZIKR_PHRASES[0]; // Bismillah
          console.log('[START GAME] Focus Mode - First item: Bismillah');
        } else if (mode === 'asma') {
          firstItem = NAMES_OF_ALLAH[0]; // Ya Allah
          console.log('[START GAME] Asma ul Husna Mode - First item: Ya Allah');
        } else if (mode === 'tasbih') {
          firstItem = tasbihSelectedPhrase; // Selected phrase
          console.log(`[START GAME] Tasbih Mode - Selected phrase: ${tasbihSelectedPhrase?.transliteration || 'ERROR: NONE'}`);
          console.log(`[START GAME] Tasbih Mode - firstItem.arabic: ${firstItem?.arabic}, firstItem.id: ${firstItem?.id}`);
          if (!tasbihSelectedPhrase) {
            console.error('[START GAME ERROR] Tasbih mode started without selected phrase!');
            alert('Error: No phrase selected for Tasbih mode!');
            setScreen('tasbih-setup');
            return;
          }
        }
        
        console.log(`[START GAME] Creating 3 initial phrases with: ${firstItem.transliteration} (ID: ${firstItem.id})`);
      
      const initialPhrases = [
        {
          id: nextPhraseIdRef.current++,
          data: firstItem,
          position: -20,
          verticalPosition: 30,
          isNewlyUnlocked: false,
          newUnlockCount: 0,
          phraseDataId: firstItem.id
        },
        {
          id: nextPhraseIdRef.current++,
          data: firstItem,
          position: -50,
          verticalPosition: 50,
          isNewlyUnlocked: false,
          newUnlockCount: 0,
          phraseDataId: firstItem.id
        },
        {
          id: nextPhraseIdRef.current++,
          data: firstItem,
          position: -80,
          verticalPosition: 70,
          isNewlyUnlocked: false,
          newUnlockCount: 0,
          phraseDataId: firstItem.id
        }
      ];
      setPhrases(initialPhrases);
      setTotalPhrasesAppeared(3);
      setBismillahCount(3); // Set to 3 since we spawned 3 Bismillahs initially
      bismillahCountRef.current = 3; // Set ref immediately for synchronous access
      
      startGameLoop();
      }, 50);
    }, 100); // Outer setTimeout for cleanup
  };

  // Spawn a new phrase
  const spawnPhrase = () => {
    const currentTotal = totalPoints + sessionScoreRef.current;
    const currentMode = gameModeRef.current;  // Use ref for immediate value
    
    let availableItems = [];
    
    // Determine which items to use based on game mode
    if (currentMode === 'focus') {
      // Focus Mode: Only zikr phrases (point-based)
      availableItems = ZIKR_PHRASES.filter(p => p.unlockAt <= currentTotal);
      console.log(`[FOCUS MODE] Spawning from ${availableItems.length} unlocked ZIKR_PHRASES`);
    } else if (currentMode === 'asma') {
      // Asma ul Husna Mode: Based on tap count (33-tap rule)
      const unlockedIds = getUnlockedAsmaIds(asmaTotalTaps);
      availableItems = NAMES_OF_ALLAH.filter(n => unlockedIds.includes(n.id));
      console.log(`[ASMA MODE] Spawning from ${availableItems.length} unlocked names (${asmaTotalTaps} total taps)`);
    } else if (currentMode === 'tasbih') {
      // Tasbih Mode: Only the selected phrase
      availableItems = tasbihSelectedPhrase ? [tasbihSelectedPhrase] : [];
      console.log(`[TASBIH MODE] Spawning selected phrase: ${tasbihSelectedPhrase?.transliteration || 'none'}`);
    }
    
    if (availableItems.length === 0) return;

    let randomItem;
    
    // Tasbih mode: Always use the selected phrase (skip probability distribution)
    if (currentMode === 'tasbih') {
      if (!tasbihSelectedPhrase) {
        console.error('[TASBIH MODE ERROR] No phrase selected!');
        return;
      }
      randomItem = tasbihSelectedPhrase;
      console.log(`[TASBIH MODE] ✓ Spawning: ${randomItem.transliteration} (${randomItem.arabic})`);
    } else {
      // SPECIAL BISMILLAH LOGIC: Force Bismillah for first 3 spawns OR 2 times after 3 consecutive misses
      if (currentMode === 'focus') {
        if (bismillahCountRef.current < 3) {
          // Force Bismillah for first 3 times only
          randomItem = ZIKR_PHRASES[0]; // Bismillah
          console.log(`[BISMILLAH] Initial spawn ${bismillahCountRef.current + 1}/3`);
        } else if (consecutiveMisses >= 3 && bismillahHelpCount < 2) {
          // Force Bismillah after 3 consecutive misses (only 2 help spawns total)
          randomItem = ZIKR_PHRASES[0]; // Bismillah
          setBismillahHelpCount(prev => prev + 1);
          console.log(`[BISMILLAH] Help spawn ${bismillahHelpCount + 1}/2 after 3 consecutive misses`);
        } else {
          // Normal spawning - FILTER OUT BISMILLAH from available items
          const itemsWithoutBismillah = availableItems.filter(p => p.id !== 1);
          
          console.log(`[DEBUG] bismillahCountRef.current: ${bismillahCountRef.current}`);
          console.log(`[DEBUG] bismillahCount state: ${bismillahCount}`);
          console.log(`[DEBUG] availableItems.length: ${availableItems.length}`);
          console.log(`[DEBUG] itemsWithoutBismillah.length: ${itemsWithoutBismillah.length}`);
          console.log(`[DEBUG] itemsWithoutBismillah IDs: ${itemsWithoutBismillah.map(p => p.id).join(', ')}`);
          
          if (itemsWithoutBismillah.length === 0) {
            console.error('[ERROR] No phrases available except Bismillah!');
            return;
          }
          
          // Categorize by word count for probability distribution
          const twoWordItems = itemsWithoutBismillah.filter(p => p.wordCount === 2);
          const threeWordItems = itemsWithoutBismillah.filter(p => p.wordCount === 3);
          const fourWordItems = itemsWithoutBismillah.filter(p => p.wordCount === 4);
          const longerItems = itemsWithoutBismillah.filter(p => p.wordCount > 4);
          
          console.log(`[DEBUG] 2-word: ${twoWordItems.length}, 3-word: ${threeWordItems.length}, 4-word: ${fourWordItems.length}, longer: ${longerItems.length}`);
          
          // Probability distribution: 2-word (90%), 3-word (5%), 4-word (2%), 5+ word (3%)
          const rand = Math.random();
          
          if (rand < 0.90 && twoWordItems.length > 0) {
            randomItem = twoWordItems[Math.floor(Math.random() * twoWordItems.length)];
          } else if (rand < 0.95 && threeWordItems.length > 0) {
            randomItem = threeWordItems[Math.floor(Math.random() * threeWordItems.length)];
          } else if (rand < 0.97 && fourWordItems.length > 0) {
            randomItem = fourWordItems[Math.floor(Math.random() * fourWordItems.length)];
          } else if (longerItems.length > 0) {
            randomItem = longerItems[Math.floor(Math.random() * longerItems.length)];
          } else {
            randomItem = itemsWithoutBismillah[Math.floor(Math.random() * itemsWithoutBismillah.length)];
          }
          
          console.log(`[NORMAL SPAWN] Selected: ${randomItem.transliteration} (ID: ${randomItem.id})`);
        }
      } else {
        // Asma mode - normal probability
        const twoWordItems = availableItems.filter(p => p.wordCount === 2);
        const threeWordItems = availableItems.filter(p => p.wordCount === 3);
        const fourWordItems = availableItems.filter(p => p.wordCount === 4);
        const longerItems = availableItems.filter(p => p.wordCount > 4);
        
        const rand = Math.random();
        
        if (rand < 0.90 && twoWordItems.length > 0) {
          randomItem = twoWordItems[Math.floor(Math.random() * twoWordItems.length)];
        } else if (rand < 0.95 && threeWordItems.length > 0) {
          randomItem = threeWordItems[Math.floor(Math.random() * threeWordItems.length)];
        } else if (rand < 0.97 && fourWordItems.length > 0) {
          randomItem = fourWordItems[Math.floor(Math.random() * fourWordItems.length)];
        } else if (longerItems.length > 0) {
          randomItem = longerItems[Math.floor(Math.random() * longerItems.length)];
        } else {
          randomItem = availableItems[Math.floor(Math.random() * availableItems.length)];
        }
      }
    }
    
    // Track Bismillah spawns (Focus Mode only)
    if (currentMode === 'focus' && randomItem.id === 1) {
      setBismillahCount(prev => prev + 1);
      bismillahCountRef.current += 1; // Update ref immediately
    }
    
    // Check if this item is newly unlocked (Focus or Asma mode)
    let isNewlyUnlocked = false;
    
    if (currentMode === 'focus') {
      // Check newlyUnlockedPhrases for Focus Mode
      const currentCount = newlyUnlockedPhrases[randomItem.id];
      isNewlyUnlocked = currentCount !== undefined && currentCount < 3;
    } else if (currentMode === 'asma') {
      // Check newlyUnlockedAsmaNames for Asma Mode
      const currentCount = newlyUnlockedAsmaNames[randomItem.id];
      isNewlyUnlocked = currentCount !== undefined && currentCount < 3;
    }
    
    // Find a vertical position that doesn't overlap with existing phrases
    let verticalPosition;
    let attempts = 0;
    const maxAttempts = 20;
    
    // Get current phrases positions
    setPhrases(currentPhrases => {
      do {
        verticalPosition = Math.random() * 60 + 20; // Random position between 20% and 80%
        
        // Check if this position overlaps with any existing phrase
        const hasOverlap = currentPhrases.some(p => {
          // Only check phrases that are still on screen (position < 100)
          if (p.position > 100 || p.position < -25) return false;
          
          // Check vertical distance - phrases need at least 15% spacing (reduced from 20%)
          const verticalDistance = Math.abs(p.verticalPosition - verticalPosition);
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
        phraseDataId: randomItem.id
      };
        
      return [...currentPhrases, newPhrase];
    });
    
    setTotalPhrasesAppeared(prevTotal => prevTotal + 1);
    
    // Increment appearance count for newly unlocked items
    if (isNewlyUnlocked) {
      if (currentMode === 'focus') {
        setNewlyUnlockedPhrases(prev => ({
          ...prev,
          [randomItem.id]: (prev[randomItem.id] || 0) + 1
        }));
      } else if (currentMode === 'asma') {
        setNewlyUnlockedAsmaNames(prev => ({
          ...prev,
          [randomItem.id]: (prev[randomItem.id] || 0) + 1
        }));
      }
    }
  };

  // Game loop
  const startGameLoop = () => {
    if (gameLoopRef.current) return;
    
    gameLoopRef.current = setInterval(() => {
      // Check for newly unlocked items using refs for real-time access
      const currentTotal = totalPoints + sessionScoreRef.current;
      const currentMode = gameModeRef.current;  // Use ref for immediate value
      
      // Determine which items to check based on game mode
      let itemsToCheck = [];
      if (currentMode === 'focus') {
        itemsToCheck = ZIKR_PHRASES;
      } else if (currentMode === 'asma') {
        itemsToCheck = NAMES_OF_ALLAH;
      } else if (currentMode === 'tasbih') {
        // Tasbih mode doesn't unlock new items during gameplay
        itemsToCheck = [];
      }
      
      itemsToCheck.forEach(item => {
        // If item is unlocked now but wasn't previously unlocked
        if (item.unlockAt <= currentTotal && !previouslyUnlockedRef.current.has(item.id)) {
          console.log(`🎉 Unlocking ${currentMode === 'asma' ? 'name' : 'phrase'} ${item.id}: ${item.transliteration} at ${currentTotal} points!`);
          previouslyUnlockedRef.current.add(item.id);
          
          // Trigger particle burst effect!
          createParticleBurst(window.innerWidth / 2, window.innerHeight / 2, '#f59e0b');
          
          // Play unlock sound
          playSound('phraseUnlock');
          
          // Mark as newly unlocked based on mode
          if (currentMode === 'focus') {
            // Focus Mode - mark in newlyUnlockedPhrases
            setNewlyUnlockedPhrases(prev => {
              const updated = { ...prev, [item.id]: 0 };
              
              // Then immediately spawn the newly unlocked item in golden!
              setTimeout(() => {
                const newPhrase = {
                  id: nextPhraseIdRef.current++,
                  data: item,
                  position: -20,
                  verticalPosition: Math.random() * 60 + 20,
                  isNewlyUnlocked: true,
                  phraseDataId: item.id
                };
                setPhrases(prevPhrases => [...prevPhrases, newPhrase]);
                setTotalPhrasesAppeared(prevTotal => prevTotal + 1);
                
                // Increment the counter for this newly unlocked item
                setNewlyUnlockedPhrases(prev2 => ({
                  ...prev2,
                  [item.id]: (prev2[item.id] || 0) + 1
                }));
              }, 100);
              
              return updated;
            });
          } else if (currentMode === 'asma') {
            // Asma Mode - mark in newlyUnlockedAsmaNames
            setNewlyUnlockedAsmaNames(prev => {
              const updated = { ...prev, [item.id]: 0 };
              
              // Then immediately spawn the newly unlocked name in golden!
              setTimeout(() => {
                const newPhrase = {
                  id: nextPhraseIdRef.current++,
                  data: item,
                  position: -20,
                  verticalPosition: Math.random() * 60 + 20,
                  isNewlyUnlocked: true,
                  phraseDataId: item.id
                };
                setPhrases(prevPhrases => [...prevPhrases, newPhrase]);
                setTotalPhrasesAppeared(prevTotal => prevTotal + 1);
                
                // Increment the counter for this newly unlocked name
                setNewlyUnlockedAsmaNames(prev2 => ({
                  ...prev2,
                  [item.id]: (prev2[item.id] || 0) + 1
                }));
              }, 100);
              
              return updated;
            });
          }
        }
      });
      
      setPhrases(prev => {
        const speed = getSpeed();
        const updated = prev.map(p => ({
          ...p,
          position: p.position + speed
        }));

        // Check for missed phrases
        const missed = updated.filter(p => p.position > 110);
        if (missed.length > 0) {
          // Play miss sound for each missed phrase
          missed.forEach(() => playSound('phraseMiss'));
          
          // In Tasbih mode, misses don't end the game - only reaching target count ends it
          // CRITICAL: Use gameModeRef.current to avoid stale closure in setInterval
          if (gameModeRef.current !== 'tasbih') {
            setConsecutiveMisses(prevMisses => {
              const newMisses = prevMisses + missed.length;
              
              console.log(`[MISS CHECK] Consecutive misses: ${prevMisses} → ${newMisses}`);
              
              if (newMisses >= 5) {
                console.log(`[GAME END] 5 consecutive misses reached! Ending game...`);
                setTimeout(() => endGame(), 100);
              }
              
              return newMisses;
            });
            
            setLives(prevLives => Math.max(0, prevLives - missed.length));
          }
          
          setSessionStats(prevStats => ({
            ...prevStats,
            missedPhrases: prevStats.missedPhrases + missed.length
          }));
        }

        // Remove off-screen phrases
        const remaining = updated.filter(p => p.position <= 110);

        // Calculate spawn frequency multiplier (increases after speed caps at 0.4)
        const currentSpeed = getSpeed();
        const elapsed = (Date.now() - gameStartTimeRef.current) / 1000;
        
        // After speed reaches 0.4 (at ~80 seconds), start increasing frequency
        let targetPhrases = 2; // Base: 2-3 phrases
        let spawnProbability = 0.7; // Base probability
        
        if (currentSpeed >= 0.4 && (gameModeRef.current === 'focus' || gameModeRef.current === 'tasbih')) {
          // Speed maxed out - now increase frequency!
          const frequencyBoost = Math.floor((elapsed - 80) / 30); // Increase every 30s after speed caps
          targetPhrases = Math.min(2 + frequencyBoost, 4); // Cap at 4 phrases max
          spawnProbability = Math.min(0.7 + (frequencyBoost * 0.1), 0.95); // Cap at 95% probability
        }

        // Maintain target number of phrases on screen
        if (remaining.length < targetPhrases) {
          spawnPhrase();
          // Spawn one more if significantly below target
          if (remaining.length < targetPhrases - 1) {
            setTimeout(() => spawnPhrase(), 200);
          }
        } else if (remaining.length < targetPhrases + 1 && Math.random() < spawnProbability) {
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
  const handlePhraseTap = (event, phraseId, points, phraseDataId, isNewlyUnlocked = false) => {
    console.log(`[TAP] gameMode: ${gameMode}, phraseId: ${phraseId}, points: ${points}, isNewlyUnlocked: ${isNewlyUnlocked}`);
    
    // Get tap position for animation
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    // Create tap effect animation based on points and unlock status
    createTapEffect(x, y, points, isNewlyUnlocked);
    
    // Play tap success sound
    playSound('tapSuccess');
    
    setPhrases(prev => prev.filter(p => p.id !== phraseId));
    
    // Update session score ONLY for Focus Mode (point-based)
    if (gameMode === 'focus') {
      setSessionScore(prev => {
        const newSessionScore = prev + points;
        sessionScoreRef.current = newSessionScore; // Update ref for real-time access
        return newSessionScore;
      });
    }
    
    // Asma Mode: Increment tap counter for 33-tap unlock system
    if (gameMode === 'asma') {
      setAsmaTotalTaps(prev => {
        const newTaps = prev + 1;
        const oldUnlockedCount = getUnlockedAsmaIds(prev).length;
        const newUnlockedCount = getUnlockedAsmaIds(newTaps).length;
        
        // Check if we unlocked a new name
        if (newUnlockedCount > oldUnlockedCount) {
          const newlyUnlockedIds = getUnlockedAsmaIds(newTaps).slice(oldUnlockedCount);
          console.log(`[ASMA UNLOCK] New name(s) unlocked! IDs:`, newlyUnlockedIds);
          
          // Trigger particle burst effect!
          createParticleBurst(window.innerWidth / 2, window.innerHeight / 2, '#a855f7');
          
          // Play unlock sound
          playSound('phraseUnlock');
          
          // Add to newly unlocked tracking
          setNewlyUnlockedAsmaNames(prevUnlocked => {
            const updated = { ...prevUnlocked };
            newlyUnlockedIds.forEach(id => {
              updated[id] = 0; // Start appearance count at 0
            });
            return updated;
          });
          
          // IMMEDIATELY SPAWN the newly unlocked name(s)
          newlyUnlockedIds.forEach(id => {
            setTimeout(() => {
              const newlyUnlockedName = NAMES_OF_ALLAH.find(name => name.id === id);
              if (newlyUnlockedName) {
                const newPhrase = {
                  id: nextPhraseIdRef.current++,
                  data: newlyUnlockedName,
                  position: -20,
                  verticalPosition: Math.random() * 60 + 20,
                  isNewlyUnlocked: true,
                  phraseDataId: newlyUnlockedName.id
                };
                setPhrases(prevPhrases => [...prevPhrases, newPhrase]);
                setTotalPhrasesAppeared(prevTotal => prevTotal + 1);
                
                // Increment appearance counter
                setNewlyUnlockedAsmaNames(prev2 => ({
                  ...prev2,
                  [id]: (prev2[id] || 0) + 1
                }));
                
                console.log(`[ASMA SPAWN] Spawned newly unlocked name: ${newlyUnlockedName.transliteration}`);
              }
            }, 100);
          });
        }
        
        console.log(`[ASMA TAP] Total taps: ${prev} → ${newTaps} (Next unlock at: ${Math.ceil(newTaps / 33) * 33})`);
        console.log(`[ASMA TAP] Names unlocked: ${oldUnlockedCount} → ${newUnlockedCount}`);
        return newTaps;
      });
    }
    
    // Track phrase count for achievements (Focus, Asma, AND Tasbih modes)
    if ((gameMode === 'focus' || gameMode === 'asma' || gameMode === 'tasbih') && currentUser && currentUser.userId && phraseDataId) {
      const oldCount = (currentUser.phraseCounts || {})[phraseDataId] || 0;
      const newCount = oldCount + 1;
      
      const updatedUser = {
        ...currentUser,
        phraseCounts: {
          ...(currentUser.phraseCounts || {}),
          [phraseDataId]: newCount  // Increment phrase count for achievements
        },
        dailyPoints: gameMode === 'focus' ? (currentUser.dailyPoints || 0) + points : (currentUser.dailyPoints || 0)
      };
      
      console.log(`[PHRASE COUNT] Mode: ${gameMode}, Phrase ID: ${phraseDataId}, Count: ${oldCount} → ${newCount}`);
      
      // Save to Firebase (non-blocking)
      incrementPhraseCount(currentUser.userId, phraseDataId, oldCount);
      
      setCurrentUser(updatedUser);
    }
    
    // Tasbih Mode: Separate counting system for achievements
    if (gameMode === 'tasbih') {
      // Increment Tasbih current count (for target goal)
      tasbihCurrentCountRef.current = tasbihCurrentCountRef.current + 1;
      const newCount = tasbihCurrentCountRef.current;
      console.log(`[TASBIH TAP] Count: ${newCount - 1} → ${newCount} / ${tasbihTargetCount}`);
      setTasbihCurrentCount(newCount);
      
      // Also increment Tasbih total counts (separate from Focus/Asma achievements)
      if (phraseDataId) {
        setTasbihTotalCounts(prev => {
          const oldTasbihCount = prev[phraseDataId] || 0;
          const newTasbihCount = oldTasbihCount + 1;
          console.log(`[TASBIH TOTAL] Phrase ${phraseDataId}: ${oldTasbihCount} → ${newTasbihCount} all-time`);
          return {
            ...prev,
            [phraseDataId]: newTasbihCount
          };
        });
      }
      
      if (newCount >= tasbihTargetCount) {
        // Goal achieved! End game
        console.log(`[TASBIH COMPLETE] Target reached! ${newCount}/${tasbihTargetCount}`);
        
        // Trigger fireworks celebration!
        createFireworks();
        
        setTimeout(() => endGame(), 500);
      }
    }
    
    setConsecutiveMisses(0);
    setBismillahHelpCount(0); // Reset help counter when user successfully taps
    setSessionStats(prev => ({
      ...prev,
      totalTaps: prev.totalTaps + 1
    }));

    // Show tap animation
    const element = document.getElementById(`phrase-${phraseId}`);
    if (element) {
      element.style.transform = 'scale(1.3)';
      element.style.transition = 'transform 0.2s';
      setTimeout(() => {
        element.style.transform = 'scale(1)';
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
    playSound('completion');
    
    stopGameLoop();
    const duration = gameStartTimeRef.current ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000) : 0;
    
    // CRITICAL: Use sessionScoreRef.current for accurate real-time value
    // This ensures we get the correct score even when called from setTimeout in game loop
    const finalSessionScore = sessionScoreRef.current;
    const newTotalPoints = totalPoints + finalSessionScore;
    setTotalPoints(newTotalPoints);
    
    const accuracy = sessionStats.totalTaps > 0 
      ? Math.round((sessionStats.totalTaps / (sessionStats.totalTaps + sessionStats.missedPhrases)) * 100)
      : 0;
    
    console.log('[END GAME] Saving progress with:');
    console.log('  - Total Points:', newTotalPoints);
    console.log('  - Session Score (from ref):', finalSessionScore);
    console.log('  - Duration:', duration);
    console.log('  - Accuracy:', accuracy);
    console.log('  - Current User:', currentUser?.username);
    
    // Save with duration, accuracy, and session score for achievements
    const newAchievementEarned = saveProgress(newTotalPoints, duration, accuracy, finalSessionScore);
    
    console.log('[END GAME] New achievement earned:', newAchievementEarned);
    
    setSessionStats(prev => ({
      ...prev,
      accuracy,
      duration,
      newAchievementEarned // Track if new achievement was earned
    }));
    
    setScreen('stats');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopGameLoop();
  }, []);

  // Auth screen
  if (showAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full p-4 mb-4">
              <Trophy size={40} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Zikr Game
            </h1>
            <p className="text-gray-600">Remember Allah, Earn Rewards</p>
          </div>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleAuth}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all"
            >
              {isSignUp ? 'Sign Up' : 'Login'}
            </button>
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full text-emerald-600 py-2 text-sm hover:underline"
            >
              {isSignUp ? 'Already have an account? Login' : 'Need an account? Sign Up'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tasbih Setup screen
  if (screen === 'tasbih-setup') {
    const unlockedPhrases = ZIKR_PHRASES.filter(p => p.unlockAt <= totalPoints);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
              Tasbih Mode Setup
            </h1>
            <p className="text-gray-600 text-lg">Choose a phrase and set your repetition goal</p>
          </div>

          {/* Phrase Selection */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Select Phrase</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              {unlockedPhrases.map(phrase => (
                <div
                  key={phrase.id}
                  onClick={() => setTasbihSelectedPhrase(phrase)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    tasbihSelectedPhrase?.id === phrase.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Set Target Count</h2>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="number"
                value={tasbihTargetCount}
                onChange={(e) => setTasbihTargetCount(Math.max(1, parseInt(e.target.value) || 100))}
                className="flex-1 text-4xl font-bold text-center p-4 border-2 border-blue-300 rounded-xl focus:outline-none focus:border-blue-500"
                min="1"
              />
              <span className="text-2xl text-gray-600 font-semibold">times</span>
            </div>
            
            {/* Quick select buttons */}
            <div className="grid grid-cols-5 gap-3">
              {[33, 99, 100, 500, 1000].map(count => (
                <button
                  key={count}
                  onClick={() => setTasbihTargetCount(count)}
                  className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                    tasbihTargetCount === count
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
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
              onClick={() => setScreen('mode-select')}
              className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-semibold text-lg hover:bg-gray-300 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (tasbihSelectedPhrase) {
                  console.log(`[TASBIH START] Setting gameMode to 'tasbih', resetting count to 0`);
                  console.log(`[TASBIH START] Selected phrase: ${tasbihSelectedPhrase.transliteration}`);
                  console.log(`[TASBIH START] Target count: ${tasbihTargetCount}`);
                  setGameMode('tasbih');
                  setTasbihCurrentCount(0);
                  tasbihCurrentCountRef.current = 0; // Reset ref too
                  startGame('tasbih');
                } else {
                  alert('Please select a phrase first!');
                }
              }}
              disabled={!tasbihSelectedPhrase}
              className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-all ${
                tasbihSelectedPhrase
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
  if (screen === 'mode-select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
              Choose Your Mode
            </h1>
            <p className="text-gray-600 text-lg">Select how you want to remember Allah</p>
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Focus Mode */}
            <div 
              onClick={() => {
                setGameMode('focus');
                startGame('focus');
              }}
              className="bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all border-4 border-emerald-300"
            >
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full p-6 mb-4">
                  <Target size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Focus Mode</h2>
                <p className="text-gray-600 mb-4">Zikr phrases only - Pure dhikr practice</p>
                <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700">
                  <p>✨ 20 Authentic Zikr Phrases</p>
                  <p>📈 Progressive Unlocking</p>
                  <p>🎯 Focused Daily Practice</p>
                </div>
              </div>
            </div>

            {/* Asma ul Husna Mode */}
            <div 
              onClick={() => {
                setGameMode('asma');
                startGame('asma');
              }}
              className="bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all border-4 border-purple-300"
            >
              <div className="text-center">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-full p-6 mb-4">
                  <Star size={48} className="fill-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Asma ul Husna</h2>
                <p className="text-gray-600 mb-4">Allah's Beautiful Names</p>
                <div className="bg-purple-50 rounded-xl p-3 text-sm text-purple-700">
                  <p>✨ 99 Divine Names</p>
                  <p>🎯 Tap 33 times to unlock next name</p>
                  <p>🌟 Start with Ya Allah & Ya Rabb</p>
                </div>
              </div>
            </div>

            {/* Tasbih Mode - Shows locked/unlocked based on progress */}
            <div 
              onClick={() => {
                if (getUnlockedPhraseIds(totalPoints).length >= 21) {
                  setScreen('tasbih-setup');
                } else {
                  alert(`Tasbih Mode unlocks when all 21 phrases are unlocked!\nCurrent progress: ${getUnlockedPhraseIds(totalPoints).length}/21`);
                }
              }}
              className={`bg-white rounded-3xl shadow-xl p-8 cursor-pointer hover:shadow-2xl hover:scale-105 transition-all border-4 ${
                getUnlockedPhraseIds(totalPoints).length >= 21 
                  ? 'border-blue-300' 
                  : 'border-gray-300 opacity-60'
              }`}
            >
              <div className="text-center">
                <div className={`inline-block bg-gradient-to-r text-white rounded-full p-6 mb-4 ${
                  getUnlockedPhraseIds(totalPoints).length >= 21
                    ? 'from-blue-500 to-indigo-600'
                    : 'from-gray-400 to-gray-500'
                }`}>
                  <Circle size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Tasbih Mode</h2>
                <p className="text-gray-600 mb-4">Focused repetition - Master one phrase</p>
                <div className={`rounded-xl p-3 text-sm ${
                  getUnlockedPhraseIds(totalPoints).length >= 21
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-gray-50 text-gray-600'
                }`}>
                  <p>🎯 Choose Any Phrase</p>
                  <p>🔢 Set Your Count</p>
                  <p>📿 Complete the Goal</p>
                </div>
                <div className={`mt-3 border rounded-lg p-2 ${
                  getUnlockedPhraseIds(totalPoints).length >= 21
                    ? 'bg-yellow-100 border-yellow-400'
                    : 'bg-gray-100 border-gray-400'
                }`}>
                  {getUnlockedPhraseIds(totalPoints).length >= 21 ? (
                    <p className="text-xs text-yellow-800 font-semibold">🔓 UNLOCKED!</p>
                  ) : (
                    <p className="text-xs text-gray-700 font-semibold">
                      🔒 {getUnlockedPhraseIds(totalPoints).length}/21 phrases unlocked
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div className="text-center">
            <button
              onClick={() => setScreen('menu')}
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
  if (screen === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#ffffff] p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-[#0f172a]">As-salamu alaykum, {currentUser?.username}!</h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-[#64748b]">Total Points: <span className="font-bold text-[#4f46e5]">{totalPoints}</span></p>
                  <span className="text-[#cbd5e1]">|</span>
                  <p className="text-[#64748b]">Zikr Time: <span className="font-bold text-[#a855f7]">{Math.floor((currentUser?.totalZikrTime || 0) / 60)}m</span></p>
                </div>
                {currentUser?.currentStreak > 0 && (
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Flame className="text-[#10b981]" size={20} />
                      <span className="text-sm font-semibold text-[#10b981]">{currentUser.currentStreak} Day Streak!</span>
                    </div>
                    <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      <Shield className="text-blue-600" size={16} />
                      <span className="text-sm font-semibold text-blue-700">
                        {calculateFreezeTokens(currentUser.totalLifetimePoints || 0) - (currentUser.activeFreezes || []).length}/10
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="p-3 hover:bg-[#f8fafc] rounded-full transition-colors">
                <LogOut className="text-[#64748b]" size={24} />
              </button>
            </div>
          </div>

          {/* Main Menu */}
          <div className="bg-white rounded-3xl shadow-lg p-8 mb-6 border border-[#cbd5e1]">
            <div className="text-center mb-8">
              <div className="inline-block bg-gradient-to-r from-[#1e3a8a] to-[#4f46e5] text-white rounded-full p-6 mb-4">
                <Trophy size={48} />
              </div>
              <h1 className="text-4xl font-bold text-[#1e3a8a] mb-2">
                Zikri
              </h1>
              <p className="text-[#64748b]">Remember Allah, Earn Rewards</p>
            </div>

            <div className="space-y-4">
              {/* Start Game Button */}
              <button
                onClick={() => setScreen('mode-select')}
                className="w-full bg-gradient-to-r from-[#1e3a8a] to-[#4f46e5] text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transform hover:scale-105 transition-all"
              >
                Start Game
              </button>
              
              {/* Grid of 2 buttons: Leaderboard, Achievements */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setScreen('leaderboard')}
                  className="bg-gradient-to-br from-[#fb923c] to-[#f59e0b] text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Crown size={28} />
                  <span className="text-base">Leaderboard</span>
                </button>
                <button
                  onClick={() => setScreen('achievements')}
                  className="bg-gradient-to-br from-[#a855f7] to-[#7c3aed] text-white py-4 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Medal size={28} />
                  <span className="text-base">Achievements</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Game screen
  if (screen === 'game') {
    // Get mode display info
    const modeInfo = {
      focus: { name: 'Focus Mode', color: 'emerald', icon: Target },
      asma: { name: 'Asma ul Husna', color: 'purple', icon: Star },
      tasbih: { name: 'Tasbih Mode', color: 'blue', icon: Circle }
    };
    const currentMode = modeInfo[gameMode] || modeInfo.focus;
    const ModeIcon = currentMode.icon;
    
    // Get background styling
    const backgroundClass = (gameMode === 'focus' || gameMode === 'asma' || gameMode === 'tasbih')
      ? '' // Focus, Asma, and Tasbih modes use image backgrounds
      : 'bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100';
    
    return (
      <div className={`min-h-screen ${backgroundClass} relative overflow-hidden`}>
        {/* Dynamic Background Image for Focus Mode */}
        {gameMode === 'focus' && (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-2000"
              style={{
                backgroundImage: `url(/assets/backgrounds/${currentBackgroundIndex}.jpg)`,
                opacity: 1
              }}
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/10" />
          </>
        )}
        
        {/* Static Background Image for Tasbih Mode */}
        {gameMode === 'tasbih' && (
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
        {gameMode === 'asma' && (
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
              {gameMode === 'focus' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-emerald-600">{sessionScore}</div>
                    <div className="text-gray-600 text-sm">session pts</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <Trophy className="text-purple-500" size={20} />
                    <div className="text-lg font-bold text-purple-600">{totalPoints}</div>
                    <div className="text-gray-600 text-sm">total</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  {/* Audio Control for Focus Mode */}
                  <button
                    onClick={toggleAudioMute}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title={isAudioMuted ? "Unmute Audio" : "Mute Audio"}
                  >
                    {isAudioMuted ? (
                      <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </>
              )}
              
              {gameMode === 'asma' && (
                <>
                  {/* Next Unlocking Name Preview */}
                  {(() => {
                    const currentUnlocked = getUnlockedAsmaIds(asmaTotalTaps).length;
                    const nextUnlockAt = (currentUnlocked + 1) * 33;
                    const tapsRemaining = nextUnlockAt - asmaTotalTaps;
                    const nextName = currentUnlocked < 99 ? NAMES_OF_ALLAH[currentUnlocked] : null;
                    
                    return nextName && tapsRemaining > 0 ? (
                      <div className="flex items-center gap-2 bg-purple-50 px-3 py-2 rounded-xl border border-purple-200">
                        <div className="text-xs text-purple-600 font-semibold">Next:</div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-purple-900">{nextName.arabic}</div>
                          <div className="text-xs text-purple-600">{nextName.transliteration}</div>
                        </div>
                        <div className="ml-2 text-xs text-purple-500 font-medium">
                          {tapsRemaining} {tapsRemaining === 1 ? 'tap' : 'taps'}
                        </div>
                      </div>
                    ) : null;
                  })()}
                  {(() => {
                    const nextName = getUnlockedAsmaIds(asmaTotalTaps).length < 99 ? NAMES_OF_ALLAH[getUnlockedAsmaIds(asmaTotalTaps).length] : null;
                    return nextName ? <div className="h-8 w-px bg-gray-300"></div> : null;
                  })()}
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-purple-600">{asmaTotalTaps}</div>
                    <div className="text-gray-600 text-sm">total taps</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <Star className="text-purple-500 fill-purple-500" size={20} />
                    <div className="text-lg font-bold text-purple-600">{getUnlockedAsmaIds(asmaTotalTaps).length}/99</div>
                    <div className="text-gray-600 text-sm">names</div>
                  </div>
                </>
              )}
              
              {gameMode === 'tasbih' && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold text-blue-600">{tasbihCurrentCount}</div>
                    <div className="text-gray-600 text-sm">current</div>
                  </div>
                  <div className="h-8 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <Target className="text-blue-500" size={20} />
                    <div className="text-lg font-bold text-blue-600">{tasbihTargetCount}</div>
                    <div className="text-gray-600 text-sm">target</div>
                  </div>
                </>
              )}
              
              <div className="h-8 w-px bg-gray-300"></div>
              <div className={`flex items-center gap-2 bg-${currentMode.color}-50 px-3 py-1 rounded-full`}>
                <ModeIcon className={`text-${currentMode.color}-600`} size={16} />
                <div className={`text-sm font-semibold text-${currentMode.color}-700`}>{currentMode.name}</div>
              </div>
            </div>
            
            {/* Tapped vs Total counter - or Tasbih Progress */}
            {gameMode === 'tasbih' ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-2 rounded-full border-2 border-blue-300">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-700">{tasbihCurrentCount}</span>
                  <span className="text-gray-500 font-semibold">/</span>
                  <span className="text-2xl font-bold text-gray-600">{tasbihTargetCount}</span>
                </div>
                <div className="text-xs text-center text-blue-600 font-semibold mt-1">
                  {Math.round((tasbihCurrentCount / tasbihTargetCount) * 100)}% Complete
                </div>
              </div>
            ) : gameMode === 'asma' ? (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-2 rounded-full border-2 border-purple-300">
                <div className="text-center">
                  <div className="text-xs text-purple-600 font-semibold">Next unlock</div>
                  <div className="text-lg font-bold text-purple-700">{Math.ceil(asmaTotalTaps / 33) * 33} taps</div>
                </div>
              </div>
            ) : null}

            <button
              onClick={togglePause}
              className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors"
            >
              {isPaused ? <Play size={24} /> : <Pause size={24} />}
            </button>
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
          {phrases.map(phrase => {
            const colors = getPhraseColor(phrase.data.id);
            const isNewlyUnlocked = phrase.isNewlyUnlocked;
            
            return (
              <div
                key={phrase.id}
                id={`phrase-${phrase.id}`}
                onClick={(e) => handlePhraseTap(e, phrase.id, phrase.data.points, phrase.data.id, phrase.isNewlyUnlocked)}
                style={{
                  position: 'absolute',
                  left: `${phrase.position}%`,
                  top: `${phrase.verticalPosition}%`,
                  transform: 'translateY(-50%) translateZ(0)', // Hardware acceleration
                  willChange: 'left',
                  backfaceVisibility: 'hidden', // Prevent flicker
                }}
                className="cursor-pointer select-none"
              >
                <div className={`rounded-2xl shadow-xl px-6 py-4 transition-shadow duration-200 border-2 ${
                  isNewlyUnlocked 
                    ? 'bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 border-yellow-500 animate-pulse' 
                    : `bg-gradient-to-r ${colors.bg} ${colors.border}`
                }`} style={isNewlyUnlocked ? {
                  boxShadow: '0 0 30px gold, 0 0 60px gold, 0 0 90px gold',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                } : {}}>
                  <p className={`text-3xl font-bold text-center ${isNewlyUnlocked ? 'text-yellow-900' : colors.text}`} style={{ fontFamily: 'Arial' }}>
                    {phrase.data.arabic}
                  </p>
                  {isNewlyUnlocked && (
                    <div className="mt-1">
                      <p className="text-xs text-center text-yellow-800 font-bold animate-pulse">✨ NEW! ✨</p>
                      <p className="text-xs text-center text-yellow-700 font-semibold mt-1">{phrase.data.transliteration}</p>
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
                  // Save progress before quitting
                  const duration = gameStartTimeRef.current ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000) : 0;
                  const newTotalPoints = totalPoints + sessionScore;
                  const accuracy = sessionStats.totalTaps > 0 
                    ? Math.round((sessionStats.totalTaps / (sessionStats.totalTaps + sessionStats.missedPhrases)) * 100)
                    : 0;
                  setTotalPoints(newTotalPoints);
                  saveProgress(newTotalPoints, duration, accuracy, sessionScore);
                  setScreen('menu');
                }}
                className="block w-full mt-4 text-red-600 hover:underline"
              >
                Quit to Menu
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Stats screen
  if (screen === 'stats') {
    // Total points already includes session score from endGame()
    const finalTotalPoints = totalPoints;
    
    // Determine congratulatory message based on performance
    let congratsMessage = "Well done!";
    let encouragementMessage = "May Allah accept your dhikr";
    
    // Mode-specific messages
    if (gameMode === 'focus') {
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
    } else if (gameMode === 'asma') {
      const sessionTaps = sessionStats.totalTaps;
      if (sessionTaps >= 100) {
        congratsMessage = "Masha Allah! Beautiful! 🌟";
      } else if (sessionTaps >= 50) {
        congratsMessage = "Excellent recitation! 🎉";
      } else {
        congratsMessage = "Well done! ✨";
      }
      encouragementMessage = `${Math.floor(sessionTaps / 33)} name${Math.floor(sessionTaps / 33) !== 1 ? 's' : ''} unlocked this session!`;
    } else if (gameMode === 'tasbih') {
      congratsMessage = "Goal Completed! 🎯";
      encouragementMessage = `${tasbihTargetCount} repetitions of ${tasbihSelectedPhrase?.transliteration || 'dhikr'}`;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 flex items-center justify-center relative overflow-hidden">
        {/* Celebration decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">🎉</div>
          <div className="absolute top-20 right-20 text-5xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
          <div className="absolute bottom-20 left-20 text-5xl animate-bounce" style={{ animationDelay: '0.4s' }}>⭐</div>
          <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDelay: '0.6s' }}>🌟</div>
          <div className="absolute top-1/2 left-5 text-4xl animate-pulse">💫</div>
          <div className="absolute top-1/3 right-10 text-4xl animate-pulse" style={{ animationDelay: '0.3s' }}>🎊</div>
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
              <Star className="text-yellow-400 animate-pulse fill-yellow-400" size={24} style={{ animationDelay: '0.2s' }} />
              <Sparkles className="text-yellow-500 animate-pulse" size={24} style={{ animationDelay: '0.4s' }} />
            </div>
            {sessionStats.newAchievementEarned && (
              <div className="mt-4 bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 rounded-xl p-3 animate-pulse">
                <p className="text-purple-700 font-bold flex items-center justify-center gap-2">
                  <Medal size={20} />
                  New Achievement Unlocked!
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4 mb-8">
            {/* Mode-specific primary stat */}
            {gameMode === 'focus' && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-4 border-2 border-emerald-200">
                <p className="text-gray-600 text-sm mb-1">Points Earned</p>
                <p className="text-4xl font-bold text-emerald-600">+{sessionScore}</p>
              </div>
            )}
            
            {gameMode === 'asma' && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-purple-200">
                <p className="text-gray-600 text-sm mb-1">Session Taps</p>
                <p className="text-4xl font-bold text-purple-600">{sessionStats.totalTaps}</p>
                <p className="text-xs text-gray-600 mt-2">Total: {asmaTotalTaps} taps | {getUnlockedAsmaIds(asmaTotalTaps).length}/99 names</p>
              </div>
            )}
            
            {gameMode === 'tasbih' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
                <p className="text-gray-600 text-sm mb-1">Completed</p>
                <p className="text-4xl font-bold text-blue-600">{tasbihTargetCount}</p>
                <p className="text-sm text-gray-600 mt-2">{tasbihSelectedPhrase?.arabic}</p>
                {tasbihSelectedPhrase && tasbihTotalCounts[tasbihSelectedPhrase.id] && (
                  <p className="text-xs text-gray-500 mt-1">All-time Tasbih count: {tasbihTotalCounts[tasbihSelectedPhrase.id]}</p>
                )}
              </div>
            )}

            {/* Common stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                <p className="text-gray-600 text-sm mb-1">Taps</p>
                <p className="text-2xl font-bold text-blue-600">{sessionStats.totalTaps}</p>
              </div>
              {gameMode !== 'tasbih' && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-gray-600 text-sm mb-1">Accuracy</p>
                  <p className="text-2xl font-bold text-purple-600">{sessionStats.accuracy}%</p>
                </div>
              )}
              {gameMode === 'tasbih' && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <p className="text-gray-600 text-sm mb-1">Duration</p>
                  <p className="text-2xl font-bold text-green-600">{sessionStats.duration}s</p>
                </div>
              )}
            </div>

            {gameMode !== 'tasbih' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                  <p className="text-gray-600 text-sm mb-1">Missed</p>
                  <p className="text-2xl font-bold text-orange-600">{sessionStats.missedPhrases}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                  <p className="text-gray-600 text-sm mb-1">Duration</p>
                  <p className="text-2xl font-bold text-green-600">{sessionStats.duration}s</p>
                </div>
              </div>
            )}

            {gameMode === 'focus' && (
              <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 border-2 border-indigo-300">
                <p className="text-gray-600 text-sm mb-1">Total Points</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{finalTotalPoints}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => {
                console.log(`[PLAY AGAIN] Restarting with mode: ${gameMode}`);
                if (gameMode === 'tasbih') {
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
              onClick={() => setScreen('menu')}
              className="w-full border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile screen
  if (screen === 'profile') {
    const unlockedIds = getUnlockedPhraseIds(totalPoints);
    const unlockedPhrases = ZIKR_PHRASES.filter(p => unlockedIds.includes(p.id));
    const lockedPhrases = ZIKR_PHRASES.filter(p => !unlockedIds.includes(p.id));

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#ffffff] p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[#0f172a]">Zikr Phrases</h2>
              <button
                onClick={() => setScreen('menu')}
                className="text-[#4f46e5] font-semibold hover:underline"
              >
                Back
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f8fafc] rounded-2xl p-4 border border-[#cbd5e1]">
                <p className="text-[#64748b] text-sm mb-1">Total Points</p>
                <p className="text-4xl font-bold text-[#4f46e5]">{totalPoints}</p>
              </div>
              <div className="bg-gradient-to-r from-[#e0e7ff] to-[#f8fafc] rounded-2xl p-4 border border-[#cbd5e1]">
                <p className="text-[#64748b] text-sm mb-1">Total Zikr Time</p>
                <p className="text-4xl font-bold text-[#a855f7]">{Math.floor((currentUser?.totalZikrTime || 0) / 60)}m</p>
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
                  <p className="text-4xl font-bold text-blue-600">
                    {calculateFreezeTokens(currentUser?.totalLifetimePoints || 0) - (currentUser?.activeFreezes || []).length}
                    <span className="text-2xl text-gray-500">/10</span>
                  </p>
                </div>
                <Shield className="text-blue-600" size={64} />
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lifetime Points</span>
                  <span className="font-bold text-gray-800">{currentUser?.totalLifetimePoints || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tokens Earned</span>
                  <span className="font-bold text-blue-600">{calculateFreezeTokens(currentUser?.totalLifetimePoints || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tokens Used</span>
                  <span className="font-bold text-gray-800">{(currentUser?.activeFreezes || []).length}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>How it works:</strong>
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Earn 1 token every 30,000 lifetime points</li>
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
                <p className="font-semibold text-gray-800 mb-3">Active Freezes:</p>
                <div className="space-y-2">
                  {(currentUser?.activeFreezes || []).sort().map(dateString => {
                    const date = new Date(dateString + 'T00:00:00');
                    return (
                      <div key={dateString} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200">
                        <span className="text-sm font-medium text-gray-700">
                          {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
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
              {unlockedPhrases.map(phrase => (
                <div key={phrase.id} className="bg-gradient-to-r from-[#e0e7ff] to-[#f8fafc] rounded-xl p-4 border-2 border-[#4f46e5]">
                  <p className="text-2xl font-bold text-[#0f172a] mb-2" style={{ fontFamily: 'Arial' }}>
                    {phrase.arabic}
                  </p>
                  <p className="text-sm font-semibold text-[#4f46e5] mb-1">{phrase.transliteration}</p>
                  <p className="text-sm text-[#64748b] mb-2">{phrase.translation}</p>
                  <p className="text-xs text-[#94a3b8] italic">{phrase.category}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="bg-[#4f46e5] text-white text-xs px-2 py-1 rounded-full font-semibold">
                      +{phrase.points} pts
                    </span>
                  </div>
                </div>
              ))}
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
                {lockedPhrases.map(phrase => (
                  <div key={phrase.id} className="bg-gradient-to-r from-[#f8fafc] to-[#ffffff] rounded-xl p-4 border-2 border-[#cbd5e1]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="text-[#94a3b8]" size={24} />
                        <div>
                          <p className="text-lg font-bold text-[#94a3b8]">Hidden Phrase #{phrase.id}</p>
                          <p className="text-xs text-[#94a3b8]">{phrase.category.split(' - ')[0]}</p>
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
  if (screen === 'leaderboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="text-yellow-500" size={32} />
                <h2 className="text-2xl font-bold text-gray-800">Global Leaderboard</h2>
              </div>
              <button
                onClick={() => setScreen('menu')}
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
              <h3 className="text-lg font-bold text-gray-700 mb-4">🏆 Top 10</h3>
              {leaderboardData.map((user) => (
                <div
                  key={user.userId}
                  className={`rounded-xl p-4 border-2 ${
                    user.isCurrentUser
                      ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 shadow-md'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                          user.rank === 1
                            ? 'bg-yellow-400 text-yellow-900'
                            : user.rank === 2
                            ? 'bg-gray-300 text-gray-700'
                            : user.rank === 3
                            ? 'bg-orange-400 text-orange-900'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {user.rank}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">
                          {user.username}
                          {user.isCurrentUser && <span className="ml-2 text-emerald-600 text-sm">(You)</span>}
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
                    {user.rank === 1 && <Crown className="text-yellow-500" size={24} />}
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

            {/* User Context Section (if user is not in top 10) */}
            {leaderboardUserContext.length > 0 && (
              <>
                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-gray-500 text-sm">•••</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-700 mb-4">📍 Your Position</h3>
                  {leaderboardUserContext.map((user) => (
                    <div
                      key={user.userId}
                      className={`rounded-xl p-4 border-2 ${
                        user.isCurrentUser
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-400 shadow-md'
                          : 'bg-gray-50 border-gray-200'
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
                              {user.isCurrentUser && <span className="ml-2 text-emerald-600 text-sm">(You)</span>}
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
          </div>
        </div>
      </div>
    );
  }

  // Achievements screen
  if (screen === 'achievements') {
    const userAchievements = currentUser?.achievements || [];
    const unlockedIds = getUnlockedPhraseIds(totalPoints);
    const unlockedPhrases = ZIKR_PHRASES.filter(p => unlockedIds.includes(p.id));
    const lockedPhrases = ZIKR_PHRASES.filter(p => !unlockedIds.includes(p.id));

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#e0e7ff] to-[#ffffff] p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Medal className="text-[#a855f7]" size={32} />
                <div>
                  <h2 className="text-2xl font-bold text-[#0f172a]">Achievements & Phrases</h2>
                  <p className="text-sm text-[#64748b]">{userAchievements.length}/{ACHIEVEMENTS.length} Achievements • {unlockedPhrases.length}/20 Phrases</p>
                </div>
              </div>
              <button
                onClick={() => setScreen('menu')}
                className="text-[#4f46e5] font-semibold hover:underline"
              >
                Back
              </button>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-[#cbd5e1]">
            <h3 className="text-xl font-bold text-[#0f172a] mb-4 flex items-center gap-2">
              <Medal className="text-[#a855f7]" size={24} />
              Your Achievements
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {ACHIEVEMENTS.map(achievement => {
                const isUnlocked = userAchievements.includes(achievement.id);
                let progress = 0;

                // Calculate progress
                switch (achievement.requirement.type) {
                  case 'sessions':
                    progress = Math.min(100, ((currentUser?.sessionsCompleted || 0) / achievement.requirement.count) * 100);
                    break;
                  case 'points':
                    progress = Math.min(100, (totalPoints / achievement.requirement.count) * 100);
                    break;
                  case 'streak':
                    progress = Math.min(100, ((currentUser?.currentStreak || 0) / achievement.requirement.count) * 100);
                    break;
                  case 'time':
                    progress = Math.min(100, ((currentUser?.totalZikrTime || 0) / achievement.requirement.count) * 100);
                    break;
                  case 'unlocked':
                    progress = Math.min(100, (getUnlockedPhraseIds(totalPoints).length / achievement.requirement.count) * 100);
                    break;
                }

                return (
                  <div
                    key={achievement.id}
                    className={`bg-gradient-to-r rounded-2xl shadow-lg p-6 border-2 ${
                      isUnlocked 
                        ? 'from-[#e0e7ff] to-[#f8fafc] border-[#a855f7]' 
                        : 'from-[#f8fafc] to-[#ffffff] border-[#cbd5e1] opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-5xl ${
                          isUnlocked ? 'grayscale-0' : 'grayscale opacity-50'
                        }`}
                      >
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-[#0f172a]">{achievement.name}</h3>
                        <p className="text-sm text-[#64748b] mb-2">{achievement.description}</p>
                        {!isUnlocked && (
                          <div className="w-full bg-[#cbd5e1] rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-[#a855f7] to-[#7c3aed] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        )}
                        {isUnlocked && (
                          <div className="flex items-center gap-2 text-[#a855f7] font-semibold">
                            <Star className="fill-[#a855f7]" size={16} />
                            <span>Unlocked!</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
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
              {unlockedPhrases.map(phrase => (
                <div key={phrase.id} className="bg-gradient-to-r from-[#e0e7ff] to-[#f8fafc] rounded-xl p-4 border-2 border-[#4f46e5]">
                  <p className="text-2xl font-bold text-[#0f172a] mb-2" style={{ fontFamily: 'Arial' }}>
                    {phrase.arabic}
                  </p>
                  <p className="text-sm font-semibold text-[#4f46e5] mb-1">{phrase.transliteration}</p>
                  <p className="text-sm text-[#64748b] mb-2">{phrase.translation}</p>
                  <p className="text-xs text-[#94a3b8] italic">{phrase.category}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="bg-[#4f46e5] text-white text-xs px-2 py-1 rounded-full font-semibold">
                      +{phrase.points} pts
                    </span>
                  </div>
                </div>
              ))}
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
                {lockedPhrases.map(phrase => (
                  <div key={phrase.id} className="bg-gradient-to-r from-[#f8fafc] to-[#ffffff] rounded-xl p-4 border-2 border-[#cbd5e1]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="text-[#94a3b8]" size={24} />
                        <div>
                          <p className="text-lg font-bold text-[#94a3b8]">Hidden Phrase #{phrase.id}</p>
                          <p className="text-xs text-[#94a3b8]">{phrase.category.split(' - ')[0]}</p>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={() => setShowTokenEarned(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl transform animate-bounce" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-bold text-blue-600 mb-2">Streak Freeze Earned!</h2>
                <div className="text-6xl my-4">🛡️</div>
                <p className="text-lg text-gray-700 mb-2">
                  You now have <span className="font-bold text-blue-600">{calculateFreezeTokens(currentUser?.totalLifetimePoints || 0) - (currentUser?.activeFreezes || []).length}</span> freeze token{(calculateFreezeTokens(currentUser?.totalLifetimePoints || 0) - (currentUser?.activeFreezes || []).length) !== 1 ? 's' : ''}!
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={() => setShowTokenUsed(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-md mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {(currentUser?.currentStreak || 0) > 1 ? '🛡️' : '💔'}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {(currentUser?.currentStreak || 0) > 1 ? 'Streak Protected!' : 'Streak Broken'}
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
        
        {/* Freeze Calendar Modal */}
        {showFreezeCalendar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000]" onClick={() => setShowFreezeCalendar(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Activate Streak Freeze</h2>
                <p className="text-gray-600">Select dates to freeze your streak</p>
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Available Tokens</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {calculateFreezeTokens(currentUser?.totalLifetimePoints || 0) - (currentUser?.activeFreezes || []).length}/10
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
                  const dateString = date.toISOString().split('T')[0];
                  const isAlreadyFrozen = (currentUser?.activeFreezes || []).includes(dateString);
                  const isSelected = selectedFreezeDates.includes(dateString);
                  
                  return (
                    <div
                      key={dateString}
                      onClick={() => {
                        if (isAlreadyFrozen) return;
                        
                        if (isSelected) {
                          setSelectedFreezeDates(prev => prev.filter(d => d !== dateString));
                        } else {
                          setSelectedFreezeDates(prev => [...prev, dateString]);
                        }
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isAlreadyFrozen
                          ? 'bg-green-50 border-green-300 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-sm text-gray-500">{dateString}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isAlreadyFrozen && (
                            <span className="text-green-600 font-semibold flex items-center gap-1">
                              <Shield size={16} />
                              Active
                            </span>
                          )}
                          {isSelected && !isAlreadyFrozen && (
                            <span className="text-blue-600 font-semibold">✓ Selected</span>
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
                  Activate ({selectedFreezeDates.length} {selectedFreezeDates.length === 1 ? 'day' : 'days'})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default ZikrGame;
