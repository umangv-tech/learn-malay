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
  const [activeTab, setActiveTab] = useState('VOCAB');
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
      {/* Apple Cupertino Minimal Header */}
      <header className="header-banner">
        <div className="title-area">
          <h1>Bahasa Melayu</h1>
          <p>Active Library: {vocabList.length}</p>
        </div>

        <div className="stats-bar">
          <button 
            onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
            className="theme-toggle-btn"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <div className="stat-chip">
            <Flame size={14} color="var(--text-muted)" />
            <span>Streak:</span> {streak}
          </div>

          <div className="stat-chip">
            <Award size={14} color="var(--accent-blue)" />
            <span>XP:</span> {xp}
          </div>
        </div>
      </header>

      {/* Minimal Tabs */}
      <nav className="nav-tabs">
        <button 
          onClick={() => setActiveTab('VOCAB')} 
          className={`tab-btn ${activeTab === 'VOCAB' ? 'active' : ''}`}
        >
          Kosa Kata
        </button>

        <button 
          onClick={() => setActiveTab('QUIZ')} 
          className={`tab-btn ${activeTab === 'QUIZ' ? 'active' : ''}`}
        >
          Ujian
        </button>

        <button 
          onClick={() => setActiveTab('DIALOGUE')} 
          className={`tab-btn ${activeTab === 'DIALOGUE' ? 'active' : ''}`}
        >
          Perbualan
        </button>

        <button 
          onClick={() => setActiveTab('GRAMMAR')} 
          className={`tab-btn ${activeTab === 'GRAMMAR' ? 'active' : ''}`}
        >
          Tatabahasa
        </button>
      </nav>

      {/* --- TAB 1: VOCABULARY --- */}
      {activeTab === 'VOCAB' && (
        <section>
          {/* Apple Style Search Bar */}
          <form onSubmit={handleDictionarySearch} className="kamus-search-box">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dictionary..."
              className="kamus-input"
            />
            <button type="submit" disabled={isSearching} className="kamus-search-btn">
              {isSearching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
            </button>
          </form>

          {searchError && (
            <p style={{color: '#ff3b30', fontSize: '13px', marginBottom: '16px', textAlign: 'center'}}>
              {searchError}
            </p>
          )}

          {searchResult && (
            <div className="kamus-result-card">
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                <button onClick={(e) => speakMalay(e, searchResult.malay)} className="audio-btn" style={{position: 'static'}}>
                  <Volume2 size={16} />
                </button>
                <div>
                  <h3 style={{fontSize: '20px', fontWeight: '700', color: 'var(--text-main)'}}>
                    {searchResult.malay} <span style={{fontWeight: 400, color: 'var(--text-muted)'}}>&rarr;</span> {searchResult.english}
                  </h3>
                  <p style={{fontFamily: 'monospace', fontSize: '13px', color: 'var(--text-muted)'}}>
                    {searchResult.pronunciation}
                  </p>
                </div>
              </div>

              {searchResult.isNewSearch && (
                <button onClick={handleAddSearchResultToDeck} className="add-deck-btn">
                  <PlusCircle size={15} style={{marginRight: '6px', verticalAlign: '-2px'}} />
                  Add to Deck
                </button>
              )}
            </div>
          )}

          {/* Minimal AI Action Card */}
          <div className="ai-action-card">
            <div className="ai-card-info">
              <div>
                <h3>Generate Vocabulary</h3>
                <p>Curate 10 words with AI</p>
              </div>
            </div>

            <button onClick={() => setIsAiModalOpen(true)} className="ai-btn">
              <Plus size={16} />
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
                    <button onClick={(e) => speakMalay(e, card.malay)} className="audio-btn">
                      <Volume2 size={16} />
                    </button>
                    <span style={{fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px'}}>
                      {card.category}
                    </span>
                    <h2 className="word-malay">{card.malay}</h2>
                  </div>

                  <div className="flip-card-back">
                    <button onClick={(e) => speakMalay(e, card.malay)} className="audio-btn">
                      <Volume2 size={16} />
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
            <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px'}}>
              <span>{quizStep + 1} of {quizDeck.length}</span>
              <span>Score: {quizScore}</span>
            </div>

            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', margin: '16px 0'}}>
              <h2 className="quiz-question" style={{margin: 0}}>{currentQuizItem.malay}</h2>
              <button onClick={(e) => speakMalay(e, currentQuizItem.malay)} className="audio-btn" style={{position: 'static'}}>
                <Volume2 size={18} />
              </button>
            </div>

            <div className="quiz-options" style={{margin: '28px 0'}}>
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
                  <span>{quizStep + 1 >= quizDeck.length ? 'Restart 🔄' : 'Next'}</span>
                  <ArrowRight size={16} />
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
              <h3 style={{fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px'}}>
                {dlg.title}
              </h3>

              <div>
                {dlg.lines.map((line, lIdx) => (
                  <div key={lIdx} className="dialogue-line">
                    <div className="speaker-avatar">{line.speaker}</div>
                    <div className="dialogue-text">
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <p style={{fontSize: '15px', fontWeight: '600', color: 'var(--text-main)'}}>{line.malay}</p>
                        <button onClick={(e) => speakMalay(e, line.malay)} className="audio-btn" style={{position: 'static'}}>
                          <Volume2 size={14} />
                        </button>
                      </div>
                      <p style={{fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px'}}>{line.english}</p>
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
            <p>Verbs never change form based on tense or person. Makan means eat, ate, or eating. Add time markers like Sudah (already) or Akan (will).</p>
          </div>

          <div className="grammar-rule-card">
            <h3>Kata Ganda (Reduplication)</h3>
            <p>Repeating words for plurals or emphasis. Penuh: Anak-anak (Children). Separa: Jejari (Fingers). Berentak: Kuih-muih (Cakes).</p>
          </div>

          <div className="grammar-rule-card">
            <h3>Adjective Placement</h3>
            <p>The noun comes before the adjective. Rumah (House) + Besar (Big) = Rumah Besar (Big House).</p>
          </div>
        </section>
      )}

      {/* --- AI MODAL --- */}
      {isAiModalOpen && (
        <div className="ai-modal-backdrop">
          <div className="ai-modal-box">
            <h2>Generate Vocab</h2>
            <p>Curate 10 conversational words</p>

            <div style={{marginBottom: '20px'}}>
              <button
                disabled={isGenerating}
                onClick={() => handleGenerateAIWords('Random Practical Everyday Malaysian Words')}
                className="ai-btn"
                style={{width: '100%', justifyContent: 'center', background: 'var(--text-main)', color: 'var(--bg-main)'}}
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Dices size={16} />}
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
                {['Kata Ganda', 'Dining', 'Office', 'Shopping', 'Greetings'].map(t => (
                  <button key={t} type="button" onClick={() => setAiTopic(t)} className="topic-chip">
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {aiError && <p style={{color: '#ff3b30', fontSize: '13px', marginBottom: '12px'}}>{aiError}</p>}

            <div className="modal-actions">
              <button disabled={isGenerating} onClick={() => setIsAiModalOpen(false)} className="cancel-btn">
                Cancel
              </button>
              
              <button disabled={isGenerating} onClick={() => handleGenerateAIWords(aiTopic)} className="ai-btn" style={{flex: 2, justifyContent: 'center'}}>
                {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <span>Generate</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
