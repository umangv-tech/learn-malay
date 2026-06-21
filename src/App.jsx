import { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import confetti from 'canvas-confetti';
import { BookOpen, Award, MessageCircle, HelpCircle, Volume2, Sparkles, CheckCircle2, XCircle, Flame, ArrowRight, RefreshCw, Plus, Key, Loader2 } from 'lucide-react';

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
  { id: 15, category: 'Kata Ganda', malay: 'Anak-anak', english: 'Children (Kata Ganda Penuh)', pronunciation: 'AH-nahk AH-nahk' },
  { id: 16, category: 'Kata Ganda', malay: 'Jejari', english: 'Fingers / Spokes (Kata Ganda Separa)', pronunciation: 'juh-JAH-ree' },
  { id: 17, category: 'Kata Ganda', malay: 'Kuih-muih', english: 'Assorted Traditional Cakes (Kata Ganda Berentak)', pronunciation: 'KWEY MOO-wey' }
];

const DIALOGUES = [
  {
    title: '🍛 Ordering at a Mamak Stall (Teh Tarik & Roti Canai)',
    lines: [
      { speaker: '🧑‍🍳 Boss', malay: 'Makan atau bungkus?', english: 'Dine in or takeaway?' },
      { speaker: '🙋‍♂️ You', malay: 'Makan sini, boss. Roti canai satu.', english: 'Dine in, boss. One roti canai.' },
      { speaker: '🧑‍🍳 Boss', malay: 'Minum apa?', english: 'What to drink?' },
      { speaker: '🙋‍♂️ You', malay: 'Teh tarik satu, kurang manis!', english: 'One teh tarik, less sweet!' }
    ]
  },
  {
    title: '🚕 Asking for Directions in Kuala Lumpur',
    lines: [
      { speaker: '🙋‍♂️ You', malay: 'Tumpang tanya, di mana stesen LRT?', english: 'Excuse me asking, where is the LRT train station?' },
      { speaker: '👮‍♂️ Guard', malay: 'Jalan terus, lepas itu belok kanan.', english: 'Walk straight, after that turn right.' },
      { speaker: '🙋‍♂️ You', malay: 'Terima kasih banyak!', english: 'Thank you very much!' }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('VOCAB'); // VOCAB | QUIZ | DIALOGUE | GRAMMAR
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [flippedCards, setFlippedCards] = useState({});
  
  // Dynamic Vocab List (Loads custom AI words from localStorage)
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
  const [aiTopic, setAiTopic] = useState('Everyday Conversational Words');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [apiKey, setApiKey] = useState(() => {
    return import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
  });

  // Gamification XP & Quiz State
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem('malay_xp') || '0', 10));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('malay_streak') || '1', 10));
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizScore, setQuizScore] = useState(0);

  // Save AI vocab updates to localStorage
  useEffect(() => {
    const customOnly = vocabList.filter(v => v.isAI);
    localStorage.setItem('malay_ai_vocab', JSON.stringify(customOnly));
  }, [vocabList]);

  // Sync XP to localStorage
  useEffect(() => {
    localStorage.setItem('malay_xp', xp.toString());
  }, [xp]);

  const speakMalay = (e, text) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ms-MY'; // Bahasa Melayu voice
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

  // --- GEMINI AI DAILY 10 WORD GENERATOR ENGINE (Vercel Serverless Proxy + Local Dev Fallback) ---
  const handleGenerateAIWords = async () => {
    setIsGenerating(true);
    setAiError('');

    try {
      let generatedArray = [];

      // 1. Attempt secure Vercel Serverless proxy first (/api/generate)
      const proxyRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: aiTopic })
      }).catch(() => null);

      if (proxyRes && proxyRes.ok) {
        const data = await proxyRes.json();
        generatedArray = data.words || [];
      } else {
        // 2. Fallback to client SDK for local Vite dev server (which doesn't serve Node api handlers)
        const activeKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key') || '';
        if (!activeKey) {
          throw new Error("API Key missing. When testing locally, ensure VITE_GEMINI_API_KEY is in .env");
        }

        const ai = new GoogleGenAI({ apiKey: activeKey });
        const prompt = `Generate exactly 10 practical, commonly used Malay words or short daily phrases for conversational fluency in Malaysia. Theme or Focus: "${aiTopic}". 
CRITICAL GRAMMAR REQUIREMENT: Ensure at least 3 of the 10 generated words showcase classic Malaysian reduplication (Kata Ganda - such as Kata Ganda Penuh [e.g. anak-anak], Kata Ganda Separa [e.g. jejari, lelangit], or Kata Ganda Berentak [e.g. kuih-muih, gotong-royong]).
Return ONLY a valid raw JSON array of objects. Do not include markdown formatting or backticks. 
Each object MUST match this schema:
{"id": number, "category": string, "malay": string, "english": string, "pronunciation": string}
Ensure category is concise (e.g. 'AI: Kata Ganda' or 'AI: Dining') and pronunciation is an easy English phonetic guide.`;

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
        setXp(x => x + 50); // +50 XP bonus for expanding vocabulary!
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
      } else {
        throw new Error("AI returned invalid array structure.");
      }
    } catch (err) {
      console.error("AI Vocab Generation Error:", err);
      setAiError(err.message || "Could not summon words. Check your network or API Key and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const categoriesAvailable = ['ALL', ...new Set(vocabList.map(v => v.category))];
  const filteredVocab = selectedCategory === 'ALL' 
    ? vocabList 
    : vocabList.filter(v => v.category === selectedCategory);

  // Quiz generator helper
  const currentQuizItem = vocabList[quizIndex % vocabList.length];
  const [quizOptions, setQuizOptions] = useState([]);

  useEffect(() => {
    if (!currentQuizItem) return;
    const wrongPool = vocabList.filter(v => v.id !== currentQuizItem.id);
    const shuffledWrong = [...wrongPool].sort(() => 0.5 - Math.random()).slice(0, 3);
    const combined = [...shuffledWrong, currentQuizItem].sort(() => 0.5 - Math.random());
    setQuizOptions(combined);
    setSelectedAnswer(null);
  }, [quizIndex, vocabList]);

  const handleAnswerQuiz = (item) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(item.id);

    if (item.id === currentQuizItem.id) {
      setQuizScore(s => s + 1);
      setXp(x => x + 25);
      confetti({ particleCount: 45, spread: 65, origin: { y: 0.7 } });
    }
  };

  return (
    <div className="app-shell">
      {/* Header Banner */}
      <header className="header-banner">
        <div className="title-area">
          <h1>
            <span className="flag-badge">🇲🇾</span>
            <span>Bahasa Melayu Mastery Hub</span>
          </h1>
          <p style={{color: '#94a3b8', fontSize: '14px', marginTop: '6px'}}>
            Gamified Malaysian fluency suite. Active Library: <strong style={{color: '#38bdf8'}}>{vocabList.length} Words</strong>
          </p>
        </div>

        <div className="stats-bar">
          <div className="stat-chip">
            <Flame size={20} color="#f59e0b" />
            <div>
              <span style={{fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', display: 'block'}}>Day Streak</span>
              <span className="stat-num">{streak} Days</span>
            </div>
          </div>

          <div className="stat-chip">
            <Award size={20} color="#38bdf8" />
            <div>
              <span style={{fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', display: 'block'}}>Fluency XP</span>
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
          <span>📚 Kosa Kata (Flashcards)</span>
        </button>

        <button 
          onClick={() => setActiveTab('QUIZ')} 
          className={`tab-btn ${activeTab === 'QUIZ' ? 'active' : ''}`}
        >
          <Sparkles size={18} />
          <span>⚡ Ujian Pantas (Speed Quiz)</span>
        </button>

        <button 
          onClick={() => setActiveTab('DIALOGUE')} 
          className={`tab-btn ${activeTab === 'DIALOGUE' ? 'active' : ''}`}
        >
          <MessageCircle size={18} />
          <span>🗣️ Perbualan (Mamak Dialogues)</span>
        </button>

        <button 
          onClick={() => setActiveTab('GRAMMAR')} 
          className={`tab-btn ${activeTab === 'GRAMMAR' ? 'active' : ''}`}
        >
          <HelpCircle size={18} />
          <span>📖 Tatabahasa (Simple Rules)</span>
        </button>
      </nav>

      {/* --- TAB 1: VOCABULARY & FLASHCARDS --- */}
      {activeTab === 'VOCAB' && (
        <section>
          {/* AI Generator Action Banner (Pure Vanilla CSS) */}
          <div className="ai-action-card">
            <div className="ai-card-info">
              <Sparkles size={32} color="#14b8a6" />
              <div>
                <h3>
                  <span>✨ Expand Vocabulary with Gemini AI</span>
                  <span className="ai-tag">+10 Words</span>
                </h3>
                <p style={{color: '#cbd5e1', fontSize: '13px', marginTop: '4px'}}>Summon 10 commonly used Malaysian words tailored to any daily topic.</p>
              </div>
            </div>

            <button onClick={() => setIsAiModalOpen(true)} className="ai-btn">
              <Plus size={20} />
              <span>Generate 10 New Words</span>
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
                {cat === 'ALL' ? '🌟 All Words' : cat}
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
                  {/* Front Side */}
                  <div className="flip-card-front">
                    <button onClick={(e) => speakMalay(e, card.malay)} className="audio-btn" title="Listen pronunciation">
                      <Volume2 size={18} />
                    </button>
                    <span style={{fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>
                      {card.category}
                    </span>
                    <h2 className="word-malay">{card.malay}</h2>
                    <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '12px'}}>Click card to flip 🔄</p>
                  </div>

                  {/* Back Side */}
                  <div className="flip-card-back">
                    <button onClick={(e) => speakMalay(e, card.malay)} className="audio-btn" style={{background: 'rgba(0,0,0,0.3)'}}>
                      <Volume2 size={18} />
                    </button>
                    <h3 className="word-eng">{card.english}</h3>
                    <div className="word-pronounce">{card.pronunciation}</div>
                    <span style={{fontSize: '11px', color: '#f8fafc', fontWeight: 'bold'}}>🇲🇾 +5 Fluency XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* --- TAB 2: SPEED QUIZ CHALLENGE --- */}
      {activeTab === 'QUIZ' && (
        <section>
          <div className="quiz-card">
            <span style={{fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase', background: 'rgba(245,158,11,0.15)', padding: '6px 14px', borderRadius: '999px'}}>
              Question {quizIndex + 1}
            </span>
            <p style={{color: '#94a3b8', fontSize: '15px', marginTop: '12px'}}>What is the correct English translation for:</p>
            
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', margin: '20px 0'}}>
              <h2 className="quiz-question" style={{margin: 0}}>{currentQuizItem.malay}</h2>
              <button onClick={(e) => speakMalay(e, currentQuizItem.malay)} className="audio-btn" style={{position: 'static'}}>
                <Volume2 size={20} />
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
                <p style={{fontSize: '18px', fontWeight: 'bold', color: selectedAnswer === currentQuizItem.id ? '#10b981' : '#f43f5e', marginBottom: '16px'}}>
                  {selectedAnswer === currentQuizItem.id ? '🎉 Betul! (Correct! +25 XP)' : `❌ Salah! (Correct answer: ${currentQuizItem.english})`}
                </p>
                <button onClick={() => setQuizIndex(i => i + 1)} className="ai-btn" style={{margin: '0 auto'}}>
                  <span>Next Question</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* --- TAB 3: DAILY MAMAK DIALOGUES --- */}
      {activeTab === 'DIALOGUE' && (
        <section>
          {DIALOGUES.map((dlg, idx) => (
            <div key={idx} className="dialogue-box">
              <h3 style={{fontSize: '20px', fontWeight: 'bold', color: '#00a19c', marginBottom: '20px'}}>
                {dlg.title}
              </h3>

              <div>
                {dlg.lines.map((line, lIdx) => (
                  <div key={lIdx} className="dialogue-line">
                    <div className="speaker-avatar">{line.speaker.split(' ')[0]}</div>
                    <div className="dialogue-text">
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '4px'}}>
                        <span style={{fontSize: '12px', fontWeight: 'bold', color: '#f59e0b'}}>{line.speaker}</span>
                        <button onClick={(e) => speakMalay(e, line.malay)} style={{background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer'}}>
                          <Volume2 size={16} />
                        </button>
                      </div>
                      <p style={{fontSize: '16px', fontWeight: 'bold', color: '#fff'}}>{line.malay}</p>
                      <p style={{fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginTop: '2px'}}>{line.english}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* --- TAB 4: QUICK GRAMMAR RULES --- */}
      {activeTab === 'GRAMMAR' && (
        <section className="grammar-grid">
          <div className="grammar-rule-card">
            <h3>✨ 1. Zero Verb Conjugations</h3>
            <p style={{fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6'}}>
              Unlike European languages, Malay verbs <strong>never change form</strong> based on tense or person. <em>Makan</em> means eat, ate, eating, or will eat. You simply add time markers like <em>Sudah</em> (already) or <em>Akan</em> (will).
            </p>
          </div>

          <div className="grammar-rule-card">
            <h3>✨ 2. Kata Ganda (Reduplication)</h3>
            <p style={{fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6'}}>
              Malay uses reduplication (repeating words) for plurals, variety, and emphasis!
              <br/><br/>
              • <strong>Kata Ganda Penuh (Full):</strong> <em>Anak-anak</em> (Children), <em>Buku-buku</em> (Books)
              <br/>
              • <strong>Kata Ganda Separa (Partial):</strong> <em>Jejari</em> (Fingers - from Jari), <em>Lelangit</em> (Palate - from Langit), <em>Pepohon</em> (Trees)
              <br/>
              • <strong>Kata Ganda Berentak (Rhyming):</strong> <em>Kuih-muih</em> (Assorted cakes), <em>Gotong-royong</em> (Cooperation)
            </p>
          </div>

          <div className="grammar-rule-card">
            <h3>✨ 3. Adjective Placement</h3>
            <p style={{fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6'}}>
              In Malay, the noun comes <strong>before</strong> the adjective.
              <br/><br/>
              • <strong>Rumah</strong> (House) + <strong>Besar</strong> (Big) = <em>Rumah Besar</em> (Big House)
              <br/>
              • <strong>Teh</strong> (Tea) + <strong>Panas</strong> (Hot) = <em>Teh Panas</em> (Hot Tea)
            </p>
          </div>
        </section>
      )}

      {/* --- AI GENERATION OVERLAY MODAL (Pure Vanilla CSS) --- */}
      {isAiModalOpen && (
        <div className="ai-modal-backdrop">
          <div className="ai-modal-box">
            <Sparkles size={40} color="#14b8a6" style={{margin: '0 auto 12px'}} />
            <h2>Generate 10 Common Words</h2>
            <p style={{color: '#94a3b8', fontSize: '14px', marginBottom: '24px'}}>Gemini AI will summon 10 practical Malay words with phonetic pronunciation guides.</p>

            <div className="form-field">
              <label>Topic or Situation Focus</label>
              <input 
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g., At the Mamak stall, Malaysian slang, Grocery shopping..."
              />
              <div className="quick-topics">
                {['Kata Ganda Reduplication (Penuh & Separa)', 'Everyday Conversational Words', 'Ordering Food at Mamak', 'Malaysian Office Slang', 'Shopping at Night Market'].map(t => (
                  <button key={t} type="button" onClick={() => setAiTopic(t)} className="topic-chip">
                    + {t}
                  </button>
                ))}
              </div>
            </div>

            {aiError && (
              <p style={{color: '#f43f5e', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px'}}>
                ⚠️ {aiError}
              </p>
            )}

            <div className="modal-actions">
              <button disabled={isGenerating} onClick={() => setIsAiModalOpen(false)} className="cancel-btn">
                Cancel
              </button>
              
              <button disabled={isGenerating} onClick={handleGenerateAIWords} className="ai-btn" style={{flex: 2, justifyContent: 'center'}}>
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Curating 10 Words...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Summon Vocab</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
