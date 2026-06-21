import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import confetti from 'canvas-confetti';
import { BookOpen, Award, MessageCircle, HelpCircle, Volume2, Sparkles, Flame, ArrowRight, Plus, Dices, Loader2, Sun, Moon, Search, PlusCircle, PenTool, CheckCircle2, RotateCcw, Star, Target, Download, Users, Lock, Unlock, Cloud, CloudOff, Settings } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

const BASE_VOCAB = [
  { id: 1, category: 'Essentials', malay: 'Selamat Pagi', english: 'Good Morning', pronunciation: 'suh-LAH-maht PAH-gee', exampleMalay: 'Selamat pagi, boss! Apa khabar hari ini?', exampleEnglish: 'Good morning, boss! How are you today?' },
  { id: 2, category: 'Essentials', malay: 'Terima Kasih', english: 'Thank You', pronunciation: 'tuh-REE-mah KAH-seh', exampleMalay: 'Terima kasih banyak atas bantuan anda.', exampleEnglish: 'Thank you very much for your help.' },
  { id: 3, category: 'Essentials', malay: 'Sama-sama', english: "You're Welcome", pronunciation: 'SAH-mah SAH-mah', exampleMalay: 'Sama-sama, gembira dapat membantu.', exampleEnglish: "You're welcome, happy to help." },
  { id: 4, category: 'Essentials', malay: 'Apa Khabar?', english: 'How are you?', pronunciation: 'AH-pah KAH-bar', exampleMalay: 'Hai lama tidak berjumpa, apa khabar?', exampleEnglish: "Hi long time no see, how are you?" },
  { id: 5, category: 'Food & Mamak', malay: 'Makan', english: 'To Eat / Meal', pronunciation: 'MAH-kahn', exampleMalay: 'Jom kita pergi makan nasi lemak sekarang.', exampleEnglish: 'Let us go eat nasi lemak now.' },
  { id: 6, category: 'Food & Mamak', malay: 'Sedap', english: 'Delicious', pronunciation: 'SUH-dahp', exampleMalay: 'Mee goreng di kedai mamak ini sangat sedap.', exampleEnglish: 'The fried noodles at this mamak stall are delicious.' },
  { id: 7, category: 'Food & Mamak', malay: 'Kurang Manis', english: 'Less Sweet', pronunciation: 'KOO-rahng MAH-nees', exampleMalay: 'Tolong buat teh tarik satu, kurang manis.', exampleEnglish: 'Please make one teh tarik, less sweet.' },
  { id: 8, category: 'Food & Mamak', malay: 'Bungkus', english: 'Takeaway / To Go', pronunciation: 'BOONG-koos', exampleMalay: 'Roti canai dua bungkus untuk dibawa pulang.', exampleEnglish: 'Two roti canai takeaway to bring home.' },
  { id: 9, category: 'Money & Ringgit', malay: 'Berapa?', english: 'How much?', pronunciation: 'buh-RAH-pah', exampleMalay: 'Berapa harga buah durian ini sekilo?', exampleEnglish: 'How much is this durian per kilo?' },
  { id: 10, category: 'Money & Ringgit', malay: 'Mahal', english: 'Expensive', pronunciation: 'MAH-hahl', exampleMalay: 'Barangan di pusat beli-belah itu agak mahal.', exampleEnglish: 'Goods at that shopping mall are quite expensive.' },
  { id: 11, category: 'Money & Ringgit', malay: 'Murah', english: 'Cheap', pronunciation: 'MOO-rah', exampleMalay: 'Sayur-mayur di pasar malam jauh lebih murah.', exampleEnglish: 'Vegetables at the night market are much cheaper.' },
  { id: 12, category: 'Travel', malay: 'Di mana ...?', english: 'Where is ...?', pronunciation: 'dee MAH-nah', exampleMalay: 'Tumpang tanya, di mana stesen kereta api?', exampleEnglish: 'Excuse me, where is the train station?' },
  { id: 13, category: 'Travel', malay: 'Tandas', english: 'Restroom / Toilet', pronunciation: 'TAHN-dahs', exampleMalay: 'Boleh saya tahu di mana tandas awam?', exampleEnglish: 'May I know where the public toilet is?' },
  { id: 14, category: 'Travel', malay: 'Jalan', english: 'Street / To Walk', pronunciation: 'JAH-lahn', exampleMalay: 'Kita perlu jalan terus sebelum belok kanan.', exampleEnglish: 'We need to walk straight before turning right.' },
  { id: 15, category: 'Kata Ganda', malay: 'Anak-anak', english: 'Children (Kata Ganda Penuh)', pronunciation: 'AH-nahk AH-nahk', exampleMalay: 'Anak-anak sedang bermain bola di padang.', exampleEnglish: 'The children are playing football in the field.' },
  { id: 16, category: 'Kata Ganda', malay: 'Jejari', english: 'Fingers / Spokes (Kata Ganda Separa)', pronunciation: 'juh-JAH-ree', exampleMalay: 'Jejari basikal adik patah akibat kemalangan.', exampleEnglish: 'My younger sibling bike spokes broke from an accident.' },
  { id: 17, category: 'Kata Ganda', malay: 'Kuih-muih', english: 'Assorted Cakes (Kata Ganda Berentak)', pronunciation: 'KWEY MOO-wey', exampleMalay: 'Ibu menyediakan pelbagai kuih-muih tradisional.', exampleEnglish: 'Mother prepared assorted traditional cakes.' }
];

const DIALOGUES = [
  {
    title: 'Ordering at a Mamak Stall',
    lines: [
      { speaker: 'Boss Stall', malay: 'Makan atau bungkus?', english: 'Dine in or takeaway?' },
      { speaker: 'You', malay: 'Makan sini. Roti canai satu.', english: 'Dine in. One roti canai.' },
      { speaker: 'Boss Stall', malay: 'Minum apa?', english: 'What to drink?' },
      { speaker: 'You', malay: 'Teh tarik satu, kurang manis!', english: 'One teh tarik, less sweet!' }
    ]
  },
  {
    title: 'Asking for Directions',
    lines: [
      { speaker: 'You', malay: 'Tumpang tanya, di mana stesen LRT?', english: 'Excuse me asking, where is the LRT station?' },
      { speaker: 'Guard', malay: 'Jalan terus, lepas itu belok kanan.', english: 'Walk straight, then turn right.' },
      { speaker: 'You', malay: 'Terima kasih banyak!', english: 'Thank you very much!' }
    ]
  }
];

const PRACTICE_SENTENCES = [
  // Level 1: Beginner (3 Words)
  { level: 'Beginner', targetEng: 'Good morning boss', words: ['Selamat', 'pagi', 'boss'] },
  { level: 'Beginner', targetEng: 'Thank you very much', words: ['Terima', 'kasih', 'banyak'] },
  { level: 'Beginner', targetEng: 'Delicious fried noodles', words: ['Mee', 'goreng', 'sedap'] },
  { level: 'Beginner', targetEng: 'Where is the toilet', words: ['Tandas', 'di', 'mana'] },
  // Level 2: Easy (4 & 5 Words)
  { level: 'Easy', targetEng: 'Hot tea less sweet', words: ['Teh', 'panas', 'kurang', 'manis'] },
  { level: 'Easy', targetEng: 'I want to eat chicken rice', words: ['Saya', 'nak', 'makan', 'nasi', 'ayam'] },
  // Level 3: Advanced (6 & 7 Words)
  { level: 'Intermediate', targetEng: 'Night market durians are very cheap', words: ['Durian', 'pasar', 'malam', 'sangat', 'murah'] },
  { level: 'Advanced', targetEng: 'Please make one teh tarik less sweet', words: ['Tolong', 'buat', 'teh', 'tarik', 'satu', 'kurang', 'manis'] }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('VOCAB'); // VOCAB | QUIZ | DIALOGUE | GRAMMAR | BINA_AYAT
  const [activeProfile, setActiveProfile] = useState(() => localStorage.getItem('malay_active_prof') || 'UMANG'); // UMANG | ARCHANA
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [flippedCards, setFlippedCards] = useState({});
  
  // Theme state (dark vs light)
  const [theme, setTheme] = useState(() => localStorage.getItem('malay_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-profile', activeProfile);
    localStorage.setItem('malay_theme', theme);
    localStorage.setItem('malay_active_prof', activeProfile);
  }, [theme, activeProfile]);

  // Dynamic Vocab List
  const [vocabList, setVocabList] = useState(() => {
    const savedAIWords = localStorage.getItem('malay_ai_vocab');
    if (savedAIWords) {
      try {
        const parsed = JSON.parse(savedAIWords);
        return [...parsed, ...BASE_VOCAB];
      } catch (e) {
        console.error("Failed parsing saved AI words", e);
      }
    }
    return BASE_VOCAB;
  });

  // AI Generation Modal & State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState('Everyday');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');

  // Dictionary Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [searchLang, setSearchLang] = useState('MS_EN'); // MS_EN | EN_MS

  // Gamification XP & Non-Repeating Shuffled Quiz State
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('malay_xp') || '0', 10));
  const [streak] = useState(() => parseInt(localStorage.getItem('malay_streak') || '1', 10));
  
  // Shuffled non-repeating quiz queue
  const [quizDeck, setQuizDeck] = useState([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  // Scrambled Sentence Builder State (Tab 5 - Feature 1)
  const [scrambleIndex, setScrambleIndex] = useState(0);
  const [scrambledPool, setScrambledPool] = useState([]);
  const [assembledWords, setAssembledWords] = useState([]);
  const [isScrambleSolved, setIsScrambleSolved] = useState(false);

  // Live AI Sentence Doctor State (Tab 5 - Feature 3)
  const [practiceInput, setPracticeInput] = useState('');
  const [isDoctoring, setIsDoctoring] = useState(false);
  const [doctorFeedback, setDoctorFeedback] = useState(null);
  const [doctorError, setDoctorError] = useState('');

  // Feature 1: Starred Hard Words Focus Deck
  const [starredIds, setStarredIds] = useState(() => JSON.parse(localStorage.getItem('malay_starred') || '[]'));
  const [quizFilter, setQuizFilter] = useState('ALL'); // ALL | STARRED

  // Feature 3: Daily Word Goal (X / 10 Quizzes Today)
  const todayStr = new Date().toISOString().split('T')[0];
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = JSON.parse(localStorage.getItem('malay_daily') || '{}');
    return saved.date === todayStr ? saved.count : 0;
  });

  const incrementDaily = () => {
    setDailyGoal(prev => {
      const next = prev + 1;
      localStorage.setItem(`malay_daily_${activeProfile}`, JSON.stringify({ date: todayStr, count: next }));
      if (next === 10) confetti({ particleCount: 80, spread: 100, origin: { y: 0.3 } });
      return next;
    });
  };

  const toggleStar = (id) => {
    setStarredIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(`malay_starred_${activeProfile}`, JSON.stringify(next));
      return next;
    });
  };

  // Feature 4: 1-Click Spreadsheet CSV Export
  const handleExportCsv = () => {
    const headers = ['Malay Word', 'English Meaning', 'Category', 'Phonetic Guide', 'Example Sentence Malay', 'Example Sentence English'];
    const rows = vocabList.map(v => [
      `"${(v.malay || '').replace(/"/g, '""')}"`,
      `"${(v.english || '').replace(/"/g, '""')}"`,
      `"${(v.category || '').replace(/"/g, '""')}"`,
      `"${(v.pronunciation || '').replace(/"/g, '""')}"`,
      `"${(v.exampleMalay || '').replace(/"/g, '""')}"`,
      `"${(v.exampleEnglish || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Bahasa_Melayu_Vocabulary_${activeProfile}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    confetti({ particleCount: 40, spread: 70, origin: { y: 0.2 } });
  };

  // Switch profile data loader
  useEffect(() => {
    const pk = `_${activeProfile}`;
    const savedAIWords = localStorage.getItem(`malay_ai_vocab${pk}`);
    if (savedAIWords) {
      try { setVocabList([...JSON.parse(savedAIWords), ...BASE_VOCAB]); }
      catch { setVocabList(BASE_VOCAB); }
    } else { setVocabList(BASE_VOCAB); }

    const savedXp = localStorage.getItem(`malay_xp${pk}`);
    setXp(savedXp !== null ? parseInt(savedXp, 10) : (activeProfile === 'UMANG' ? 150 : 0));
    setStarredIds(JSON.parse(localStorage.getItem(`malay_starred${pk}`) || '[]'));

    const savedDaily = JSON.parse(localStorage.getItem(`malay_daily${pk}`) || '{}');
    setDailyGoal(savedDaily.date === todayStr ? savedDaily.count : 0);
  }, [activeProfile, todayStr]);

  useEffect(() => {
    const customOnly = vocabList.filter(v => v.isAI);
    localStorage.setItem(`malay_ai_vocab_${activeProfile}`, JSON.stringify(customOnly));
  }, [vocabList, activeProfile]);

  useEffect(() => {
    localStorage.setItem(`malay_xp_${activeProfile}`, xp.toString());
  }, [xp, activeProfile]);

  useEffect(() => {
    if (vocabList.length > 0) {
      const activeSource = quizFilter === 'STARRED' 
        ? vocabList.filter(v => starredIds.includes(v.id))
        : vocabList;

      const base = activeSource.length > 0 ? activeSource : vocabList;
      const shuffled = [...base].sort(() => 0.5 - Math.random());
      setQuizDeck(shuffled);
      setQuizStep(0);
    }
  }, [vocabList, quizFilter, starredIds]);

  const currentQuizItem = quizDeck[quizStep];

  useEffect(() => {
    if (!currentQuizItem || vocabList.length < 4) return;
    const wrongPool = vocabList.filter(v => v.id !== currentQuizItem.id);
    const shuffledWrong = [...wrongPool].sort(() => 0.5 - Math.random()).slice(0, 3);
    const combined = [...shuffledWrong, currentQuizItem].sort(() => 0.5 - Math.random());
    setQuizOptions(combined);
    setSelectedAnswer(null);
  }, [quizStep, currentQuizItem, vocabList]);

  // Init scrambled builder puzzle
  const currentScramble = PRACTICE_SENTENCES[scrambleIndex % PRACTICE_SENTENCES.length];
  useEffect(() => {
    if (!currentScramble) return;
    const pool = [...currentScramble.words].sort(() => 0.5 - Math.random());
    setScrambledPool(pool.map((w, idx) => ({ id: idx, text: w })));
    setAssembledWords([]);
    setIsScrambleSolved(false);
  }, [scrambleIndex, currentScramble]);

  const speakMalay = (e, text) => {
    e?.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ms-MY';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleFlip = (id) => {
    setFlippedCards(prev => ({ ...prev, [id]: !prev[id] }));
    if (!flippedCards[id]) {
      setXp(x => x + 5);
    }
  };

  // Scramble word clicks
  const handleSelectWord = (item) => {
    if (isScrambleSolved) return;
    setScrambledPool(p => p.filter(x => x.id !== item.id));
    const nextAssembled = [...assembledWords, item];
    setAssembledWords(nextAssembled);

    // Check solution
    if (nextAssembled.length === currentScramble.words.length) {
      const fullSentence = nextAssembled.map(x => x.text).join(' ').toLowerCase();
      const targetSentence = currentScramble.words.join(' ').toLowerCase();
      if (fullSentence === targetSentence) {
        setIsScrambleSolved(true);
        setXp(x => x + 30);
        incrementDaily();
        confetti({ particleCount: 65, spread: 80, origin: { y: 0.6 } });
        speakMalay(null, currentScramble.words.join(' '));
      }
    }
  };

  const handleReturnWord = (item) => {
    if (isScrambleSolved) return;
    setAssembledWords(a => a.filter(x => x.id !== item.id));
    setScrambledPool(p => [...p, item]);
  };

  // --- AI SENTENCE DOCTOR (Feature 3) ---
  const handleCheckPracticeSentence = async (e) => {
    e?.preventDefault();
    if (!practiceInput.trim()) return;

    setIsDoctoring(true);
    setDoctorError('');
    setDoctorFeedback(null);

    try {
      let resultObj = null;
      const proxyRes = await fetch('/api/doctor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: practiceInput })
      }).catch(() => null);

      if (proxyRes && proxyRes.ok) {
        resultObj = await proxyRes.json();
      } else {
        const activeKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
        if (!activeKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey: activeKey });
        const prompt = `Act as an encouraging KL Bahasa Melayu language coach. Analyze this practice sentence typed by an English-speaking student: "${practiceInput}".
CRITICAL LANGUAGE REQUIREMENT: You MUST write the "feedback" explanation strictly in clear, friendly ENGLISH! Do not write feedback in Malay.
GRADING RULE: If the student writes correct formal or casual Malay, grade it 10/10! In feedback, explain their grammar in English.
Return ONLY raw JSON: {"rating": number (1-10 scale), "isCorrect": boolean, "feedback": "encouraging explanation written strictly in ENGLISH", "nativeBetter": "natural KL street phrasing in Malay"}`;
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        let clean = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const fB = clean.indexOf('{');
        const lB = clean.lastIndexOf('}');
        if (fB !== -1 && lB !== -1) clean = clean.slice(fB, lB + 1);
        resultObj = JSON.parse(clean);
      }

      if (resultObj) {
        setDoctorFeedback(resultObj);
        setXp(x => x + 15);
      }
    } catch {
      setDoctorError("Could not check sentence right now. Check network.");
    } finally {
      setIsDoctoring(false);
    }
  };

  // --- FREE KAMUS DICTIONARY LOOKUP ENGINE (Dual Direction MS->EN / EN->MS) ---
  const handleDictionarySearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    const term = searchQuery.trim().toLowerCase();
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const localMatch = vocabList.find(v => v.malay.toLowerCase() === term || v.english.toLowerCase() === term);
      if (localMatch) {
        setSearchResult(localMatch);
        setIsSearching(false);
        return;
      }

      const langPair = searchLang === 'MS_EN' ? 'ms|en' : 'en|ms';
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=${langPair}`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const translatedText = data?.responseData?.translatedText;
        if (translatedText && !translatedText.includes('NO QUERY SPECIFIED')) {
          const isMsToEn = searchLang === 'MS_EN';
          setSearchResult({
            id: Date.now(),
            category: 'Kamus',
            malay: isMsToEn ? searchQuery.trim().replace(/^./, c => c.toUpperCase()) : translatedText.replace(/^./, c => c.toUpperCase()),
            english: isMsToEn ? translatedText.replace(/^./, c => c.toUpperCase()) : searchQuery.trim().replace(/^./, c => c.toUpperCase()),
            pronunciation: isMsToEn ? searchQuery.trim().toLowerCase() : translatedText.toLowerCase(),
            isNewSearch: true
          });
          setIsSearching(false);
          return;
        }
      }

      const activeKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
      if (!activeKey) throw new Error("Not found");

      const ai = new GoogleGenAI({ apiKey: activeKey });
      const prompt = searchLang === 'MS_EN'
        ? `Define the Bahasa Melayu word "${searchQuery.trim()}". Return ONLY raw JSON: {"malay": "${searchQuery.trim()}", "english": "meaning", "pronunciation": "phonetic"}`
        : `Translate the English word "${searchQuery.trim()}" into Malay. Return ONLY raw JSON: {"malay": "malay translation", "english": "${searchQuery.trim()}", "pronunciation": "phonetic"}`;

      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
      let clean = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
      const firstB = clean.indexOf('{');
      const lastB = clean.lastIndexOf('}');
      if (firstB !== -1 && lastB !== -1) clean = clean.slice(firstB, lastB + 1);
      const obj = JSON.parse(clean);

      setSearchResult({ ...obj, id: Date.now(), category: 'Kamus', isNewSearch: true });
    } catch {
      setSearchError(`Definition for "${searchQuery}" not found.`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSearchResultToDeck = () => {
    if (!searchResult) return;
    setVocabList(prev => [{ ...searchResult, isAI: true }, ...prev]);
    setSearchResult(null);
    setSearchQuery('');
    setXp(x => x + 20);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
  };

  // --- GEMINI AI DAILY 10 WORD GENERATOR ENGINE ---
  const handleGenerateAIWords = async (customTopic) => {
    const targetTopic = customTopic || aiTopic || 'Random Practical Everyday Malaysian Words';
    setIsGenerating(true);
    setAiError('');

    try {
      let generatedArray = [];

      const proxyRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: targetTopic })
      }).catch(() => null);

      if (proxyRes && proxyRes.ok) {
        const data = await proxyRes.json();
        generatedArray = data.words || [];
      } else {
        const activeKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
        if (!activeKey) throw new Error("API Key missing");

        const ai = new GoogleGenAI({ apiKey: activeKey });
        const prompt = `Generate exactly 10 practical, commonly used Malay words or short daily phrases for conversational fluency in Malaysia. Theme or Focus: "${targetTopic}". 
CRITICAL GRAMMAR REQUIREMENT: Ensure at least 3 of the 10 generated words showcase classic Malaysian reduplication (Kata Ganda - such as Kata Ganda Penuh [e.g. anak-anak], Kata Ganda Separa [e.g. jejari, lelangit], or Kata Ganda Berentak [e.g. kuih-muih, gotong-royong]).
CRITICAL PURITY FILTER: Do NOT include English loan words or obvious cognates (such as boss/bos, meeting/miting, OT/overtime, fail/file, e-mel/email, bank, teksi, ekon). Only generate authentic Malaysian vocabulary where the Malay word is distinct from English.
Return ONLY a valid raw JSON array of objects. Do not include markdown formatting or backticks. 
Each object MUST match this schema:
{"id": number, "category": string, "malay": string, "english": string, "pronunciation": string, "exampleMalay": string, "exampleEnglish": string}
Ensure category is concise (e.g. 'AI: Kata Ganda' or 'AI: Everyday'), pronunciation is phonetic, and attach practical example sentences.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });

        let rawText = response.text || '';
        const firstBracket = rawText.indexOf('[');
        const lastBracket = rawText.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
          rawText = rawText.slice(firstBracket, lastBracket + 1);
        } else {
          rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(rawText);
        generatedArray = parsed.map((item, idx) => ({
          ...item,
          id: Date.now() + idx,
          isAI: true
        }));
      }

      if (Array.isArray(generatedArray) && generatedArray.length > 0) {
        setVocabList(prev => [...generatedArray, ...prev]);
        setSelectedCategory('ALL');
        setIsAiModalOpen(false);
        setXp(x => x + 50);
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } });
      } else {
        throw new Error("Invalid structure.");
      }
    } catch (err) {
      console.error(err);
      setAiError("Could not generate words. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerQuiz = (item) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(item.id);

    if (item.id === currentQuizItem.id) {
      setQuizScore(s => s + 1);
      setXp(x => x + 25);
      incrementDaily();
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
    }
  };

  const handleNextQuestion = () => {
    if (quizStep + 1 >= quizDeck.length) {
      const activeSource = quizFilter === 'STARRED' 
        ? vocabList.filter(v => starredIds.includes(v.id))
        : vocabList;
      const base = activeSource.length > 0 ? activeSource : vocabList;
      const reshuffled = [...base].sort(() => 0.5 - Math.random());
      setQuizDeck(reshuffled);
      setQuizStep(0);
    } else {
      setQuizStep(s => s + 1);
    }
  };

  const getMasterBucket = (cat = '', isAI = false) => {
    if (isAI || cat.startsWith('AI:') || cat.includes('AI Generated') || cat.includes('Everyday:')) return '✨ AI Generated';
    if (cat.includes('Food') || cat.includes('Mamak')) return '🍛 Food & Dining';
    if (cat.includes('Travel') || cat.includes('Money')) return '🚕 Travel & Shopping';
    if (cat.includes('Kata Ganda')) return '🇲🇾 Kata Ganda';
    return '📌 Essentials';
  };

  const masterBuckets = ['ALL', '📌 Essentials', '🍛 Food & Dining', '🚕 Travel & Shopping', '🇲🇾 Kata Ganda', '✨ AI Generated'];

  const filteredVocab = selectedCategory === 'ALL' 
    ? vocabList 
    : vocabList.filter(v => getMasterBucket(v.category, v.isAI) === selectedCategory);

  if (!activeProfile) {
    return (
      <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #1e293b 0%, #090e17 100%)', color: '#fff', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif'}}>
        <div style={{textAlign: 'center', marginBottom: '56px'}}>
          <span style={{fontSize: '64px', display: 'block', marginBottom: '16px', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'}}>🇲🇾</span>
          <h1 style={{fontSize: '42px', fontWeight: '950', letterSpacing: '-1.5px', margin: 0}}>Bahasa Melayu Hub</h1>
          <p style={{fontSize: '18px', color: '#94a3b8', marginTop: '8px', fontWeight: 'bold'}}>Who is learning today?</p>
        </div>

        <div style={{display: 'flex', gap: '36px', flexWrap: 'wrap', justifyContent: 'center'}}>
          <button 
            type="button"
            onClick={() => { setActiveProfile('UMANG'); localStorage.setItem('malay_active_prof', 'UMANG'); confetti({particleCount: 50, spread: 70}); }}
            style={{background: 'rgba(0, 210, 196, 0.08)', border: '2px solid rgba(0, 210, 196, 0.4)', borderRadius: '36px', padding: '44px 36px', width: '210px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'all 0.25s ease', boxShadow: '0 20px 40px rgba(0,0,0,0.6)'}}
          >
            <span style={{fontSize: '80px', marginBottom: '20px'}}>👨</span>
            <span style={{fontSize: '24px', fontWeight: '950', color: '#00d2c4'}}>Umang</span>
          </button>

          <button 
            type="button"
            onClick={() => { setActiveProfile('ARCHANA'); localStorage.setItem('malay_active_prof', 'ARCHANA'); confetti({particleCount: 50, spread: 70}); }}
            style={{background: 'rgba(168, 85, 247, 0.08)', border: '2px solid rgba(168, 85, 247, 0.4)', borderRadius: '36px', padding: '44px 36px', width: '210px', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', transition: 'all 0.25s ease', boxShadow: '0 20px 40px rgba(0,0,0,0.6)'}}
          >
            <span style={{fontSize: '80px', marginBottom: '20px'}}>👩</span>
            <span style={{fontSize: '24px', fontWeight: '950', color: '#a855f7'}}>Archana</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Header Banner - Royal Emerald & Malacca Gold */}
      <header className="header-banner">
        <div className="title-area">
          <h1>
            <span className="flag-badge">🇲🇾</span>
            <span>Bahasa Melayu</span>
          </h1>
          <div style={{color: 'var(--text-muted)', fontSize: '13px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px'}}>
            <span>Active Library: <strong style={{color: 'var(--accent-secondary)'}}>{vocabList.length} Words</strong></span>
            <span style={{opacity: 0.3}}>|</span>
            <button 
              onClick={handleExportCsv}
              style={{background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'underline', cursor: 'pointer', opacity: 0.65, padding: 0, display: 'inline-flex', alignItems: 'center', gap: '4px'}}
              title="Export backup to Excel/CSV"
            >
              <Download size={12} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: '28px'}}>
          <div className="stats-bar" style={{alignItems: 'center', margin: 0}}>
            <button 
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="theme-toggle-btn"
            >
              {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#0d9488" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>

            <div className="stat-chip">
              <Target size={20} color="#10b981" />
              <div>
                <span style={{fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block'}}>Daily Goal</span>
                <span className="stat-num" style={{color: dailyGoal >= 10 ? '#10b981' : 'var(--text-main)'}}>{Math.min(dailyGoal, 10)}/10 {dailyGoal >= 10 ? '✓' : ''}</span>
              </div>
            </div>

            <div className="stat-chip">
              <Flame size={20} color="var(--accent-secondary)" />
              <div>
                <span style={{fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block'}}>Streak</span>
                <span className="stat-num">{streak} Days</span>
              </div>
            </div>

            <div className="stat-chip">
              <Award size={20} color="var(--accent-primary)" />
              <div>
                <span style={{fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold', display: 'block'}}>XP</span>
                <span className="stat-num teal">{xp} XP</span>
              </div>
            </div>
          </div>

          {/* Dedicated Far Right Identity Nook (Executive Desktop Layout) */}
          <div style={{borderLeft: '1px solid var(--glass-border)', paddingLeft: '24px', display: 'flex', alignItems: 'center'}}>
            <button 
              type="button"
              onClick={() => { setActiveProfile(null); localStorage.removeItem('malay_active_prof'); }}
              style={{background: activeProfile === 'UMANG' ? 'linear-gradient(135deg, #00d2c4, #0d9488)' : 'linear-gradient(135deg, #a855f7, #7e22ce)', color: activeProfile === 'UMANG' ? '#000' : '#fff', border: 'none', padding: '8px 18px', borderRadius: '999px', fontWeight: '950', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.35)', transition: 'transform 0.15s ease'}}
              title="Lock workspace and return to Netflix profile selection portal"
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{fontSize: '18px'}}>{activeProfile === 'UMANG' ? '👨' : '👩'}</span>
              <span>{activeProfile === 'UMANG' ? 'Umang' : 'Archana'}</span>
              <Lock size={14} style={{opacity: 0.85}} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button 
          onClick={() => setActiveTab('VOCAB')} 
          className={`tab-btn ${activeTab === 'VOCAB' ? 'active' : ''}`}
        >
          <BookOpen size={18} />
          <span>Kosa Kata</span>
        </button>

        <button 
          onClick={() => setActiveTab('QUIZ')} 
          className={`tab-btn ${activeTab === 'QUIZ' ? 'active' : ''}`}
        >
          <Sparkles size={18} />
          <span>Ujian</span>
        </button>

        <button 
          onClick={() => setActiveTab('BINA_AYAT')} 
          className={`tab-btn ${activeTab === 'BINA_AYAT' ? 'active' : ''}`}
        >
          <PenTool size={18} />
          <span>✍️ Bina Ayat</span>
        </button>

        <button 
          onClick={() => setActiveTab('DIALOGUE')} 
          className={`tab-btn ${activeTab === 'DIALOGUE' ? 'active' : ''}`}
        >
          <MessageCircle size={18} />
          <span>Perbualan</span>
        </button>

        <button 
          onClick={() => setActiveTab('GRAMMAR')} 
          className={`tab-btn ${activeTab === 'GRAMMAR' ? 'active' : ''}`}
        >
          <HelpCircle size={18} />
          <span>Tatabahasa</span>
        </button>
      </nav>

      {/* --- TAB 1: VOCABULARY --- */}
      {activeTab === 'VOCAB' && (
        <section>
          {/* Minimalist Bi-Directional Dictionary Search Bar */}
          <form onSubmit={handleDictionarySearch} className="kamus-search-box">
            <button 
              type="button" 
              onClick={() => setSearchLang(l => l === 'MS_EN' ? 'EN_MS' : 'MS_EN')}
              style={{background: 'var(--pill-bg)', border: '1px solid var(--glass-border)', padding: '8px 14px', borderRadius: '16px', fontSize: '13px', fontWeight: '950', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0}}
              title="Click to flip translation direction"
            >
              <span>{searchLang === 'MS_EN' ? '🇲🇾 BM → EN' : '🇬🇧 EN → BM'}</span>
              <RotateCcw size={14} />
            </button>

            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchLang === 'MS_EN' ? "Search Malay word (e.g. Sedap)..." : "Search English word (e.g. Water)..."}
              className="kamus-input"
            />
            <button type="submit" disabled={isSearching} className="kamus-search-btn">
              {isSearching ? <Loader2 size={18} className="animate-spin" /> : <span>Search</span>}
            </button>
          </form>

          {searchError && (
            <p style={{color: '#f43f5e', fontSize: '14px', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center'}}>
              ⚠️ {searchError}
            </p>
          )}

          {searchResult && (
            <div className="kamus-result-card">
              <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                <button onClick={(e) => speakMalay(e, searchResult.malay)} className="audio-btn" style={{position: 'static'}}>
                  <Volume2 size={20} />
                </button>
                <div>
                  <span style={{fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold'}}>
                    {searchResult.category}
                  </span>
                  <h3 style={{fontSize: '28px', fontWeight: '950', color: 'var(--text-main)', margin: '2px 0'}}>
                    {searchResult.malay} &rarr; <span style={{color: 'var(--accent-primary)'}}>{searchResult.english}</span>
                  </h3>
                  <p style={{fontFamily: 'monospace', fontSize: '14px', color: 'var(--text-muted)'}}>
                    {searchResult.pronunciation}
                  </p>
                </div>
              </div>

              <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                {searchResult.isNewSearch && (
                  <button onClick={handleAddSearchResultToDeck} className="add-deck-btn">
                    <PlusCircle size={20} />
                    <span>+ Add to Deck</span>
                  </button>
                )}

                <button 
                  onClick={() => { setSearchResult(null); setSearchQuery(''); }} 
                  style={{background: 'var(--input-bg)', border: '2px solid var(--glass-border)', color: 'var(--text-main)', padding: '14px 18px', borderRadius: '16px', cursor: 'pointer', fontWeight: '950', fontSize: '15px'}}
                  title="Close definition"
                >
                  <span>✖ Close</span>
                </button>
              </div>
            </div>
          )}

          {/* AI Generator Banner */}
          <div className="ai-action-card">
            <div className="ai-card-info">
              <Sparkles size={32} color="var(--accent-secondary)" />
              <div>
                <h3>Generate Vocabulary</h3>
                <p style={{color: 'var(--text-muted)', fontSize: '13px', marginTop: '2px'}}>Curate 10 words with AI</p>
              </div>
            </div>

            <button onClick={() => setIsAiModalOpen(true)} className="ai-btn">
              <Plus size={20} />
              <span>Generate</span>
            </button>
          </div>

          {/* Minimalist Master Category Filter Pills */}
          <div className="category-pills" style={{alignItems: 'center'}}>
            {masterBuckets.map(cat => (
              <button 
                key={cat}
                onClick={() => { setSelectedCategory(cat); setQuizFilter('ALL'); }}
                className={`cat-pill ${selectedCategory === cat && quizFilter === 'ALL' ? 'active' : ''}`}
              >
                {cat === 'ALL' ? '🌟 All Words' : cat}
              </button>
            ))}

            <button 
              onClick={() => setQuizFilter(f => f === 'ALL' ? 'STARRED' : 'ALL')}
              className={`cat-pill ${quizFilter === 'STARRED' ? 'active' : ''}`}
              style={{borderColor: '#f59e0b', color: quizFilter === 'STARRED' ? '#000' : '#f59e0b', background: quizFilter === 'STARRED' ? '#f59e0b' : 'transparent', fontWeight: '950'}}
            >
              ⭐ Hard / Starred ({starredIds.length})
            </button>
          </div>

          {/* Flashcards Grid */}
          <div className="flashcards-grid">
            {(quizFilter === 'STARRED' ? filteredVocab.filter(v => starredIds.includes(v.id)) : filteredVocab).map(card => (
              <div 
                key={card.id}
                onClick={() => toggleFlip(card.id)}
                className={`flip-card ${flippedCards[card.id] ? 'flipped' : ''}`}
              >
                <div className="flip-card-inner">
                  <div className="flip-card-front">
                    <button onClick={(e) => speakMalay(e, card.malay)} className="audio-btn" title="Listen pronunciation">
                      <Volume2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleStar(card.id); }} 
                      style={{position: 'absolute', top: '16px', left: '16px', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10, padding: '6px'}}
                      title={starredIds.includes(card.id) ? "Unstar word" : "Star word as hard"}
                    >
                      <Star size={22} fill={starredIds.includes(card.id) ? "#f59e0b" : "none"} color={starredIds.includes(card.id) ? "#f59e0b" : "var(--text-muted)"} />
                    </button>
                    <span style={{fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>
                      {card.category}
                    </span>
                    <h2 className="word-malay">{card.malay}</h2>
                  </div>

                  <div className="flip-card-back">
                    <button onClick={(e) => speakMalay(e, card.malay)} className="audio-btn" style={{background: 'rgba(0,0,0,0.3)'}}>
                      <Volume2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleStar(card.id); }} 
                      style={{position: 'absolute', top: '16px', left: '16px', background: 'transparent', border: 'none', cursor: 'pointer', zIndex: 10, padding: '6px'}}
                      title={starredIds.includes(card.id) ? "Unstar word" : "Star word as hard"}
                    >
                      <Star size={22} fill={starredIds.includes(card.id) ? "#f59e0b" : "none"} color={starredIds.includes(card.id) ? "#f59e0b" : "var(--text-muted)"} />
                    </button>
                    <h3 className="word-eng">{card.english}</h3>
                    <div className="word-pronounce">{card.pronunciation}</div>

                    {/* Feature 2: Flashcard Back Example Sentence Snippet */}
                    {card.exampleMalay && (
                      <div className="card-example-box">
                        <p className="ex-malay">"{card.exampleMalay}"</p>
                        <p className="ex-eng">{card.exampleEnglish}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- TAB 2: QUIZ --- */}
      {activeTab === 'QUIZ' && currentQuizItem && (
        <section>
          <div className="quiz-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <span style={{fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase'}}>
                Card {quizStep + 1} of {quizDeck.length}
              </span>
              <span style={{fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold'}}>
                Score: {quizScore}
              </span>
            </div>

            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', margin: '20px 0'}}>
              <h2 className="quiz-question" style={{margin: 0}}>{currentQuizItem.malay}</h2>
              <button onClick={(e) => speakMalay(e, currentQuizItem.malay)} className="audio-btn" style={{position: 'static'}}>
                <Volume2 size={20} color="var(--accent-secondary)" />
              </button>
            </div>

            <div className="quiz-options" style={{marginBottom: '24px'}}>
              {quizOptions.map(opt => {
                let btnClass = '';
                if (selectedAnswer !== null) {
                  if (opt.id === currentQuizItem.id) btnClass = 'correct';
                  else if (opt.id === selectedAnswer) btnClass = 'wrong';
                }

                return (
                  <button
                    key={opt.id}
                    disabled={selectedAnswer !== null}
                    onClick={() => handleAnswerQuiz(opt)}
                    className={`quiz-opt-btn ${btnClass}`}
                  >
                    {opt.english}
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <div>
                <button onClick={handleNextQuestion} className="ai-btn" style={{margin: '0 auto'}}>
                  <span>{quizStep + 1 >= quizDeck.length ? 'Reshuffle 🔄' : 'Next'}</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- TAB 3: BINA AYAT (Feature 1 & Feature 3) --- */}
      {activeTab === 'BINA_AYAT' && (
        <section className="bina-ayat-grid">
          {/* Feature 1: Scrambled Sentence Builder */}
          <div className="scramble-card">
            <h3 style={{fontSize: '24px', fontWeight: '950', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span>🧩 Bina Ayat</span>
              <span style={{fontSize: '11px', background: 'var(--accent-primary)', color: '#000', padding: '4px 12px', borderRadius: '999px', fontWeight: 'bold'}}>
                {currentScramble.level || 'Beginner'} &bull; {currentScramble.words.length} Words
              </span>
            </h3>
            <p style={{fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px'}}>Tap word blocks in correct Malay order (Noun before Adjective).</p>

            <div className="scramble-target">
              Target: "{currentScramble.targetEng}"
            </div>

            {/* Real-time word order feedback bar */}
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px'}}>
              <span>Progress: {assembledWords.filter((w, i) => w.text.toLowerCase() === currentScramble.words[i]?.toLowerCase()).length} / {currentScramble.words.length} words correct</span>
              <span>🟢 ✓ Correct &nbsp;&bull;&nbsp; 🔴 ✗ Wrong (Tap to remove)</span>
            </div>

            <div className="assembled-area">
              {assembledWords.length === 0 && <span style={{color: 'var(--text-muted)', fontSize: '14px'}}>Tap tiles below to assemble sentence...</span>}
              {assembledWords.map((w, idx) => {
                const targetWord = currentScramble.words[idx];
                const isCorrectSlot = w.text.toLowerCase() === targetWord?.toLowerCase();

                return (
                  <button 
                    key={w.id} 
                    onClick={() => handleReturnWord(w)} 
                    className={`word-block ${isCorrectSlot ? 'correct-slot' : 'wrong-slot'}`}
                  >
                    {w.text} {isCorrectSlot ? '✓' : '✗'}
                  </button>
                );
              })}
            </div>

            <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '24px', minHeight: '50px'}}>
              {scrambledPool.map(w => (
                <button key={w.id} onClick={() => handleSelectWord(w)} className="word-block pool">
                  + {w.text}
                </button>
              ))}
            </div>

            {isScrambleSolved && (
              <div style={{textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.15)', borderRadius: '18px'}}>
                <p style={{fontSize: '18px', fontWeight: 'bold', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'}}>
                  <CheckCircle2 size={22} />
                  <span>Betul! (Correct! +30 XP)</span>
                </p>
                <button onClick={() => setScrambleIndex(i => i + 1)} className="ai-btn" style={{margin: '14px auto 0'}}>
                  <span>Next Sentence</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Feature 3: AI Live Sentence Doctor */}
          <div className="doctor-card">
            <h3 style={{fontSize: '24px', fontWeight: '950', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <span>🤖 AI Coach</span>
              <span style={{fontSize: '11px', background: 'var(--accent-secondary)', color: '#000', padding: '3px 10px', borderRadius: '999px'}}>Sentence Doctor</span>
            </h3>
            <p style={{fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px'}}>Type any practice sentence to get KL conversational coaching (~80 tokens).</p>

            <form onSubmit={handleCheckPracticeSentence} style={{marginTop: '20px'}}>
              <textarea
                rows={3}
                value={practiceInput}
                onChange={(e) => setPracticeInput(e.target.value)}
                placeholder="Type your practice Malay sentence here (e.g. Saya nak pergi pasar malam beli ayam)..."
                style={{width: '100%', background: 'var(--input-bg)', border: '2px solid var(--glass-border)', borderRadius: '18px', padding: '16px', color: 'var(--text-main)', fontSize: '15px', fontWeight: 'bold', outline: 'none', resize: 'none', fontFamily: 'inherit'}}
              />
              <button disabled={isDoctoring || !practiceInput.trim()} type="submit" className="ai-btn" style={{width: '100%', justifyContent: 'center', marginTop: '16px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-teal) 100%)', color: '#000'}}>
                {isDoctoring ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span>Check My Sentence</span>
              </button>
            </form>

            {doctorError && <p style={{color: '#f43f5e', fontSize: '13px', marginTop: '12px'}}>⚠️ {doctorError}</p>}

            {doctorFeedback && (
              <div className="doctor-result-box">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                  <span style={{fontSize: '14px', fontWeight: '950', color: doctorFeedback.rating >= 7 ? '#10b981' : '#f59e0b'}}>
                    Fluency Score: {doctorFeedback.rating}/10
                  </span>
                  <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)'}}>+15 XP</span>
                </div>
                <p style={{fontSize: '14px', color: 'var(--text-main)', marginBottom: '12px'}}>
                  {doctorFeedback.feedback}
                </p>
                <div style={{padding: '12px', background: 'rgba(0,210,196,0.12)', borderRadius: '12px'}}>
                  <span style={{fontSize: '11px', color: 'var(--accent-primary)', fontWeight: '950', textTransform: 'uppercase', display: 'block'}}>Native KL Phrasing:</span>
                  <p style={{fontSize: '16px', fontWeight: '900', color: '#fff', marginTop: '2px'}}>"{doctorFeedback.nativeBetter}"</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- TAB 4: DIALOGUES --- */}
      {activeTab === 'DIALOGUE' && (
        <section>
          {DIALOGUES.map((dlg, idx) => (
            <div key={idx} className="dialogue-box">
              <h3 style={{fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-secondary)', marginBottom: '20px'}}>
                {dlg.title}
              </h3>

              <div>
                {dlg.lines.map((line, lIdx) => (
                  <div key={lIdx} className="dialogue-line">
                    <div className="speaker-avatar">{line.speaker.split(' ')[0]}</div>
                    <div className="dialogue-text">
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                        <span style={{fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-primary)'}}>{line.speaker}</span>
                        <button onClick={(e) => speakMalay(e, line.malay)} style={{background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer'}}>
                          <Volume2 size={16} />
                        </button>
                      </div>
                      <p style={{fontSize: '16px', fontWeight: 'bold', color: 'var(--text-main)'}}>{line.malay}</p>
                      <p style={{fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px'}}>{line.english}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* --- TAB 5: GRAMMAR --- */}
      {activeTab === 'GRAMMAR' && (
        <section className="grammar-grid">
          <div className="grammar-rule-card">
            <h3>Zero Verb Conjugations</h3>
            <p style={{fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6'}}>
              Verbs never change form based on tense or person. Makan means eat, ate, or eating. Add time markers like Sudah (already) or Akan (will).
            </p>
          </div>

          <div className="grammar-rule-card">
            <h3>Kata Ganda (Reduplication)</h3>
            <p style={{fontSize: '13px', color: 'var(--text-main)', lineHeight: '1.6'}}>
              Repeating words for plurals or emphasis.
              <br/><br/>
              • <strong>Penuh:</strong> Anak-anak (Children)
              <br/>
              • <strong>Separa:</strong> Jejari (Fingers)
              <br/>
              • <strong>Berentak:</strong> Kuih-muih (Cakes)
            </p>
          </div>

          <div className="grammar-rule-card">
            <h3>Adjective Placement</h3>
            <p style={{fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6'}}>
              The noun comes before the adjective. Rumah (House) + Besar (Big) = Rumah Besar (Big House).
            </p>
          </div>
        </section>
      )}

      {/* --- AI GENERATION OVERLAY MODAL --- */}
      {isAiModalOpen && (
        <div className="ai-modal-backdrop">
          <div className="ai-modal-box">
            <h2>Generate Vocab</h2>
            <p style={{color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px'}}>Select theme or generate random words</p>

            <div style={{marginBottom: '22px'}}>
              <button
                disabled={isGenerating}
                onClick={() => handleGenerateAIWords('Random Practical Everyday Malaysian Words')}
                className="ai-btn"
                style={{width: '100%', justifyContent: 'center', background: 'var(--accent-primary)', color: '#000'}}
              >
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Dices size={20} />}
                <span>Surprise Me (Random Words)</span>
              </button>
            </div>

            <div className="form-field">
              <input 
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="Topic focus (e.g. Dining, Slang)"
              />
              <div className="quick-topics">
                {['Kata Ganda', 'Dining', 'Office', 'Slang', 'Greetings'].map(t => (
                  <button key={t} type="button" onClick={() => setAiTopic(t)} className="topic-chip">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {aiError && <p style={{color: '#f43f5e', fontSize: '13px', marginBottom: '16px'}}>{aiError}</p>}

            <div className="modal-actions">
              <button disabled={isGenerating} onClick={() => setIsAiModalOpen(false)} className="cancel-btn">
                Cancel
              </button>
              
              <button disabled={isGenerating} onClick={() => handleGenerateAIWords(aiTopic)} className="ai-btn" style={{flex: 2, justifyContent: 'center'}}>
                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <span>Generate</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
