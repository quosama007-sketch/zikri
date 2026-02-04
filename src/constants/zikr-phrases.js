/**
 * ZIKR PHRASES - Focus Mode
 * 27 Islamic remembrance phrases with Arabic, transliteration, and translations
 * Organized by tiers and word count for game difficulty progression
 */

export const ZIKR_PHRASES = [
  // TIER 1: 2-WORD PHRASES (10 points each)
  { id: 1, arabic: 'بِسْمِ اللهِ', transliteration: 'Bismillah', translation: 'In the name of Allah', points: 10, unlockAt: 0, wordCount: 2 },
  { id: 2, arabic: 'الْحَمْدُ لِلَّهِ', transliteration: 'Alhamdulillah', translation: 'Praise be to Allah', points: 10, unlockAt: 0, wordCount: 2 },
  { id: 3, arabic: 'اللهُ أَكْبَرُ', transliteration: 'Allahu Akbar', translation: 'Allah is the Greatest', points: 10, unlockAt: 50, wordCount: 2 },
  { id: 4, arabic: 'سُبْحَانَ اللهِ', transliteration: 'SubhanAllah', translation: 'Glory be to Allah', points: 10, unlockAt: 150, wordCount: 2 },
  { id: 5, arabic: 'أَسْتَغْفِرُ اللهَ', transliteration: 'Astaghfirullah', translation: 'I seek forgiveness from Allah', points: 10, unlockAt: 300, wordCount: 2 },
  { id: 6, arabic: 'حَسْبِيَ اللهُ', transliteration: 'Hasbiyallah', translation: 'Allah is sufficient for me', points: 10, unlockAt: 500, wordCount: 2 },
  { id: 7, arabic: 'يَا اللهُ', transliteration: 'Ya Allah', translation: 'O Allah', points: 10, unlockAt: 750, wordCount: 2 },
  { id: 8, arabic: 'يَا رَبِّي', transliteration: 'Ya Rabbi', translation: 'O my Lord', points: 10, unlockAt: 1050, wordCount: 2 },
  { id: 9, arabic: 'تَوَكَّلْتُ عَلَى اللهِ', transliteration: 'Tawakkaltu alallah', translation: 'I put my trust in Allah', points: 10, unlockAt: 1400, wordCount: 2 },
  { id: 10, arabic: 'أَعُوذُ بِاللهِ', transliteration: 'A\'udhu billah', translation: 'I seek refuge in Allah', points: 10, unlockAt: 1800, wordCount: 2 },
  { id: 11, arabic: 'اللهُ الْمُسْتَعَانُ', transliteration: 'Allahul musta\'an', translation: 'Allah is the One sought for help', points: 10, unlockAt: 2250, wordCount: 2 },
  { id: 12, arabic: 'تُبْتُ إِلَى اللهِ', transliteration: 'Tubtu ilallah', translation: 'I repent to Allah', points: 10, unlockAt: 2750, wordCount: 2 },
  
  // TIER 2: 3-WORD PHRASES (15 points for first 7)
  { id: 13, arabic: 'سُبْحَانَ اللهِ وَبِحَمْدِهِ', transliteration: 'SubhanAllah wa bihamdihi', translation: 'Glory be to Allah and praise Him', points: 15, unlockAt: 3300, wordCount: 3 },
  { id: 14, arabic: 'اللَّهُمَّ صَلِّ وَسَلِّمْ', transliteration: 'Allahumma salli wa sallim', translation: 'O Allah, send blessings and peace', points: 15, unlockAt: 3900, wordCount: 3 },
  { id: 15, arabic: 'سُبْحَانَ رَبِّيَ الْأَعْلَىٰ', transliteration: 'Subhana rabbiyal a\'la', translation: 'Glory to my Lord, the Most High', points: 15, unlockAt: 4550, wordCount: 3 },
  { id: 16, arabic: 'سُبْحَانَ رَبِّيَ الْعَظِيمِ', transliteration: 'Subhana rabbiyal azim', translation: 'Glory to my Lord, the Magnificent', points: 15, unlockAt: 5250, wordCount: 3 },
  { id: 17, arabic: 'رَبِّ اغْفِرْ لِي', transliteration: 'Rabbi ighfir li', translation: 'My Lord, forgive me', points: 15, unlockAt: 6000, wordCount: 3 },
  { id: 18, arabic: 'رَبِّ ارْحَمْنِي', transliteration: 'Rabbi irhamni', translation: 'My Lord, have mercy on me', points: 15, unlockAt: 6800, wordCount: 3 },
  { id: 19, arabic: 'رَبِّ ارْزُقْنِي', transliteration: 'Rabbi rzuqni', translation: 'My Lord, grant me provision', points: 15, unlockAt: 7650, wordCount: 3 },
  
  // TIER 2 CONTINUED: 3-WORD PHRASES (20 points for last 7)
  { id: 20, arabic: 'رَبِّ يَسِّرْ لِي', transliteration: 'Rabbi yassir li', translation: 'My Lord, make it easy for me', points: 20, unlockAt: 8550, wordCount: 3 },
  { id: 21, arabic: 'رَبِّ زِدْنِي عِلْمًا', transliteration: 'Rabbi zidni ilma', translation: 'My Lord, increase me in knowledge', points: 20, unlockAt: 9500, wordCount: 3 },
  { id: 22, arabic: 'اللَّهُمَّ احْفَظْنِي', transliteration: 'Allahumma hfizni', translation: 'O Allah, protect me', points: 20, unlockAt: 10500, wordCount: 3 },
  { id: 23, arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', transliteration: 'Ihdinas sirat al-mustaqim', translation: 'Guide us to the straight path', points: 20, unlockAt: 11550, wordCount: 3 },
  { id: 24, arabic: 'اللهُ أَكْبَرُ كَبِيرًا', transliteration: 'Allahu akbar kabira', translation: 'Allah is the Greatest, greatly', points: 20, unlockAt: 12650, wordCount: 3 },
  { id: 25, arabic: 'الْحَمْدُ لِلَّهِ كَثِيرًا', transliteration: 'Alhamdulillahi kathira', translation: 'Praise be to Allah, abundantly', points: 20, unlockAt: 13800, wordCount: 3 },
  { id: 26, arabic: 'قِنَا عَذَابَ النَّارِ', transliteration: 'Qina azab annar', translation: 'Save us from the punishment of the Fire', points: 20, unlockAt: 15000, wordCount: 3 },
  
  // TIER 3: SPECIAL 4-WORD (25 points - Most Important!)
  { id: 27, arabic: 'لَا إِلٰهَ إِلَّا اللهُ', transliteration: 'La ilaha illallah', translation: 'There is no god but Allah', points: 25, unlockAt: 16250, wordCount: 4 },
];
