import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import confetti from 'canvas-confetti';
import { BookOpen, Award, MessageCircle, HelpCircle, Volume2, Sparkles, Flame, ArrowRight, Plus, Dices, Loader2, Sun, Moon, Search, PlusCircle } from 'lucide-react';

const BASE_VOCAB = [
  { id: 1, category: 'Essentials', malay: 'Selamat Pagi', english: 'Good Morning', pronunciation: 'suh-LAH-maht PAH-gee' },
  { id: 2, category: 'Essentials', malay: 'Terima Kasih', english: 'Thank You', pronunciation: 'tuh-REE-mah KAH-seh' },
  { id: 3, category: 'Essentials', malay: 'Sama-sama', english: "You're Welcome", pronunciation: 'SAH-mah SAH-mah' },
  { id: 4, category: 'Essentials', malay: 'Apa Khabar?', english: 'How are you?', pronunciation: 'AH-pah KAH-bar' },
  { id: 5, category: 'Food & Mamak', malay: 'Makan', english: 'To Eat / Meal', pronunciation: 'MAH-kahn' },
  { id: 6, category: 'Food & Mamak', malay: 'Sedap', english: 'Delicious', pronunciation: 'SUH-dahp' },
  { id: 7, category: 'Food & Mamak', malay: 'Kurang Manis', english: 'Less Sweet', pronunciation: 'KOO-rahng MAH-nees' },
  { id: 8, category: 'Food & Mamak', malay: 'Bungkus', english: 'Takeaway / To Go', pronunciation: 'BOONG-koos' },
  { id: 9, category: 'Money & Ringgit', malay: 'Berapa?', english: 'How much?', pronunciation: 'buh-RAH-pah' },
  { id: 10, category: 'Money & Ringgit', malay: 'Mahal', english: 'Expensive', pronunciation: 'MAH-hahl' },
  { id: 11, category: 'Money & Ringgit', malay: 'Murah', english: 'Cheap', pronunciation: 'MOO-rah' },
  { id: 12, category: 'Travel', malay: 'Di mana ...?', english: 'Where is ...?', pronunciation: 'dee MAH-nah' },
  { id: 13, category: 'Travel', malay: 'Tandas', english: 'Restroom / Toilet', pronunciation: 'TAHN-dahs' },
  { id: 14, category: 'Travel', malay: 'Jalan', english: 'Street / To Walk', pronunciation: 'JAH-lahn' },
  { id: 15, category: 'Kata Ganda', malay: 'Anak-anak', english: 'Children (Full Reduplication)', pronunciation: 'AH-nahk AH-nahk' },
  { id: 16, category: 'Kata Ganda', malay: 'Jejari', english: 'Fingers / Spokes (Partial Reduplication)', pronunciation: 'juh-JAH-ree' },
  { id: 17, category: 'Kata Ganda', malay: 'Kuih-muih', english: 'Assorted Cakes (Rhyming)', pronunciation: 'KWEY MOO-wey' }
];

const DIALOGUES = [
  {
    title: 'Ordering at a Mamak Stall',
    lines: [
      { speaker: 'Boss', malay: 'Makan atau bungkus?', english: 'Dine in or takeaway?' },
      { speaker: 'You', malay: 'Makan sini. Roti canai satu.', english: 'Dine in. One roti canai.' },
      { speaker: 'Boss', malay: 'Minum apa?', english: 'What to drink?' },
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

export default function App() {
  const [activeTab, setActiveTab] = useState('VOCAB'); // VOCAB | QUIZ | DIALOGUE | GRAMMAR
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [flippedCards, setFlippedCards] = useState({});
  
  // Theme state (dark vs light)
  const [theme, setTheme] = useState(() => localStorage.getItem('malay_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('malay_theme', theme);
  }, [theme]);

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

  // Gamification XP & Non-Repeating Shuffled Quiz State
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('malay_xp') || '0', 10));
  const [streak] = useState(() => parseInt(localStorage.getItem('malay_streak') || '1', 10));
  
  // Shuffled non-repeating quiz queue
  const [quizDeck, setQuizDeck] = useState([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  useEffect(() => {
    const customOnly = vocabList.filter(v => v.isAI);
    localStorage.setItem('malay_ai_vocab', JSON.stringify(customOnly));
  }, [vocabList]);

  useEffect(() => {
    localStorage.setItem('malay_xp', xp.toString());
  }, [xp]);

  useEffect(() => {
    if (vocabList.length > 0) {
      const shuffled = [...vocabList].sort(() => 0.5 - Math.random());
      setQuizDeck(shuffled);
      setQuizStep(0);
    }
  }, [vocabList]);

  const currentQuizItem = quizDeck[quizStep];

  useEffect(() => {
    if (!currentQuizItem || vocabList.length < 4) return;
    const wrongPool = vocabList.filter(v => v.id !== currentQuizItem.id);
    const shuffledWrong = [...wrongPool].sort(() => 0.5 - Math.random()).slice(0, 3);
    const combined = [...shuffledWrong, currentQuizItem].sort(() => 0.5 - Math.random());
    setQuizOptions(combined);
    setSelectedAnswer(null);
  }, [quizStep, currentQuizItem, vocabList]);

  const speakMalay = (e, text) => {
    e.stopPropagation();
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

  // --- FREE KAMUS DICTIONARY LOOKUP ENGINE ---
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

      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(term)}&langpair=ms|en`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json();
        const translatedText = data?.responseData?.translatedText;
        if (translatedText && !translatedText.includes('NO QUERY SPECIFIED')) {
          setSearchResult({
            id: Date.now(),
            category: 'Kamus',
            malay: searchQuery.trim().replace(/^./, c => c.toUpperCase()),
            english: translatedText.replace(/^./, c => c.toUpperCase()),
            pronunciation: searchQuery.trim().toLowerCase(),
            isNewSearch: true
          });
          setIsSearching(false);
          return;
        }
      }

      const activeKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
      if (!activeKey) throw new Error("Not found");

      const ai = new GoogleGenAI({ apiKey: activeKey });
      const prompt = `Define the Bahasa Melayu word "${searchQuery.trim()}". Return ONLY raw JSON: {"malay": "word", "english": "meaning", "pronunciation": "phonetic"}`;
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
{"id": number, "category": string, "malay": string, "english": string, "pronunciation": string}
Ensure category is concise (e.g. 'AI: Kata Ganda' or 'AI: Everyday') and pronunciation is an easy English phonetic guide.`;

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
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.7 } });
    }
  };

  const handleNextQuestion = () => {
    if (quizStep + 1 >= quizDeck.length) {
      const reshuffled = [...vocabList].sort(() => 0.5 - Math.random());
      setQuizDeck(reshuffled);
      setQuizStep(0);
    } else {
      setQuizStep(s => s + 1);
    }
  };

  const categoriesAvailable = ['ALL', ...new Set(vocabList.map(v => v.category))];
  const filteredVocab = selectedCategory === 'ALL' 
    ? vocabList 
    : vocabList.filter(v => v.category === selectedCategory);

  return (
    <div className="app-shell">
      {/* Header Banner - Royal Emerald & Malacca Gold */}
      <header className="header-banner">
        <div className="title-area">
          <h1>
            <span className="flag-badge">🇲🇾</span>
            <span>Bahasa Melayu</span>
          </h1>
          <p style={{color: 'var(--text-muted)', fontSize: '14px', marginTop: '6px'}}>
            Active Library: <strong style={{color: 'var(--accent-secondary)'}}>{vocabList.length} Words</strong>
          </p>
        </div>

        <div className="stats-bar">
          <button 
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="theme-toggle-btn"
          >
            {theme === 'dark' ? <Sun size={16} color="#f59e0b" /> : <Moon size={16} color="#0d9488" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

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
          {/* Minimalist Dictionary Search Bar */}
          <form onSubmit={handleDictionarySearch} className="kamus-search-box">
            <Search size={22} color="var(--accent-primary)" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dictionary..."
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

              {searchResult.isNewSearch && (
                <button onClick={handleAddSearchResultToDeck} className="add-deck-btn">
                  <PlusCircle size={20} />
                  <span>+ Add to Deck</span>
                </button>
              )}
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

          {/* Category Filter Pills */}
          <div className="category-pills">
            {categoriesAvailable.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat === 'ALL' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Flashcards Grid */}
          <div className="flashcards-grid">
            {filteredVocab.map(card => (
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
                    <span style={{fontSize: '12px', color: 'var(--accent-primary)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>
                      {card.category}
                    </span>
                    <h2 className="word-malay">{card.malay}</h2>
                  </div>

                  <div className="flip-card-back">
                    <button onClick={(e) => speakMalay(e, card.malay)} className="audio-btn" style={{background: 'rgba(0,0,0,0.3)'}}>
                      <Volume2 size={18} />
                    </button>
                    <h3 className="word-eng">{card.english}</h3>
                    <div className="word-pronounce">{card.pronunciation}</div>
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

      {/* --- TAB 3: DIALOGUES --- */}
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

      {/* --- TAB 4: GRAMMAR --- */}
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
