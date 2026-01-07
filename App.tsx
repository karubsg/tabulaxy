import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GameMode, GameState, TabuCard, GameSession, GameSettings, JokerType, Challenge, MapState, MapNode } from './types';
import { fetchTabuCards } from './services/geminiService';
import { soundManager } from './utils/soundManager';
import Menu from './components/Menu';
import GameSetup from './components/GameSetup';
import TurnTransition from './components/TurnTransition';
import Card from './components/Card';
import GameOver from './components/GameOver';
import MapBoard from './components/MapBoard';
import { Check, SkipForward, AlertOctagon, Loader2, Timer, Minus, Users, XCircle, FastForward, Zap, EyeOff, Clock, PauseCircle, Lock } from 'lucide-react';

const INITIAL_BATCH_SIZE = 12;
const REFILL_THRESHOLD = 5;
const REFILL_BATCH_SIZE = 15;

const CHALLENGES: Challenge[] = [
  {
    id: 'double_score',
    title: 'Çifte Puan!',
    description: 'Bu tur kazanılan her puan 2 katı sayılır!',
    type: 'BONUS',
    effect: (s) => ({ activeModifiers: { ...s.activeModifiers, scoreMultiplier: 2 } })
  },
  {
    id: 'half_time',
    title: 'Kısa Devre',
    description: 'Dikkat! Bu tur sürenin yarısı kadar.',
    type: 'PENALTY',
    effect: (s) => ({ timeLeft: Math.floor(s.timeLeft / 2) })
  },
  {
    id: 'extra_pass',
    title: 'Pas Şenliği',
    description: 'Bu tur için pas hakkın 5 oldu.',
    type: 'BONUS',
    effect: (s) => ({ passBudget: 5 })
  },
  {
    id: 'blind_mode',
    title: 'Kör Atış',
    description: 'Süre bitimine kadar kartları görmeden (arkadaşın anlatırken) sadece dinle!',
    type: 'NEUTRAL',
    effect: (s) => ({}) 
  }
];

// --- MAP HELPER ---
const generateMap = (length: number): MapState => {
    const nodes: MapNode[] = [];
    for (let i = 0; i < length; i++) {
        const rand = Math.random();
        let type = GameMode.CLASSIC;
        if (rand < 0.5) type = GameMode.CLASSIC;
        else if (rand < 0.8) type = GameMode.SILENT;
        else type = GameMode.MARATHON;
        
        nodes.push({ id: i, type });
    }
    return {
        nodes,
        team1Pos: 0,
        team2Pos: 0,
        totalLength: length
    };
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedMode, setSelectedMode] = useState<GameMode>(GameMode.CLASSIC);
  const [session, setSession] = useState<GameSession>({
    mode: GameMode.CLASSIC,
    settings: { team1Name: '', team2Name: '', targetScore: 50, turnDuration: 120, enableJokers: true, enableChallenges: true, enableSabotage: true },
    currentTeam: 1,
    team1: { name: '', score: 0, jokers: { [JokerType.TIME_FREEZE]: 1, [JokerType.REMOVE_FORBIDDEN]: 1, [JokerType.EXTRA_PASS]: 1 }, usedSabotage: false },
    team2: { name: '', score: 0, jokers: { [JokerType.TIME_FREEZE]: 1, [JokerType.REMOVE_FORBIDDEN]: 1, [JokerType.EXTRA_PASS]: 1 }, usedSabotage: false },
    timeLeft: 0,
    wordBudget: 15,
    passBudget: 3,
    activeChallenge: null,
    activeModifiers: { forbiddenWordsHidden: false, scoreMultiplier: 1 },
    history: []
  });
  
  const [cardQueue, setCardQueue] = useState<TabuCard[]>([]);
  const [currentCard, setCurrentCard] = useState<TabuCard | null>(null);
  const [activeTurnMode, setActiveTurnMode] = useState<GameMode>(GameMode.CLASSIC);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [usedWords, setUsedWords] = useState<string[]>([]);
  
  const isFetchingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // --- LOGIC ---
  const handleTurnEnd = useCallback((currentSession: GameSession) => {
     let isGameOver = false;
     
     if (currentSession.mode === GameMode.JOURNEY && currentSession.mapState) {
         if (currentSession.mapState.team1Pos >= currentSession.mapState.totalLength || 
             currentSession.mapState.team2Pos >= currentSession.mapState.totalLength) {
             isGameOver = true;
         }
     } else {
         const t1Score = currentSession.team1.score;
         const t2Score = currentSession.team2.score;
         const target = currentSession.settings.targetScore;
         if (t1Score >= target || t2Score >= target) {
             isGameOver = true;
         }
     }

     if (isGameOver) {
         soundManager.playGameOver();
         setGameState(GameState.GAME_OVER);
     } else {
         soundManager.playTimeUp();
         const nextTeam = currentSession.currentTeam === 1 ? 2 : 1;
         
         const randomChance = Math.random();
         let nextChallenge: Challenge | null = null;
         
         // Only generate challenge if enabled in settings
         if (currentSession.settings.enableChallenges && randomChance < 0.30) {
            const randomIdx = Math.floor(Math.random() * CHALLENGES.length);
            nextChallenge = CHALLENGES[randomIdx];
            soundManager.playChallenge();
         }

         setTimeout(() => {
            setSession(prev => ({
                ...prev,
                currentTeam: nextTeam,
                timeLeft: prev.settings.turnDuration,
                activeChallenge: nextChallenge,
                activeModifiers: { forbiddenWordsHidden: false, scoreMultiplier: 1, sabotageEffect: undefined } 
             }));
             setCurrentCard(null); 
             setGameState(GameState.TRANSITION);
         }, 0);
     }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (gameState === GameState.PLAYING && session.timeLeft > 0) {
        timerRef.current = window.setInterval(() => {
            setSession(prev => {
                if (prev.timeLeft <= 5 && prev.timeLeft > 0) soundManager.playTick(); 
                if (prev.timeLeft <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    handleTurnEnd(prev);
                    return { ...prev, timeLeft: 0 };
                }
                return { ...prev, timeLeft: prev.timeLeft - 1 };
            });
        }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gameState, handleTurnEnd]);

  const handleSelectMode = (mode: GameMode) => {
      setSelectedMode(mode);
      setGameState(GameState.SETUP);
  };

  const handleStartGame = async (settings: GameSettings) => {
    const initialTeamStats = { 
        score: 0, 
        jokers: { [JokerType.TIME_FREEZE]: 1, [JokerType.REMOVE_FORBIDDEN]: 1, [JokerType.EXTRA_PASS]: 1 },
        usedSabotage: false
    };

    let mapState: MapState | undefined = undefined;
    if (selectedMode === GameMode.JOURNEY) {
        mapState = generateMap(settings.targetScore);
    }

    const initialSession: GameSession = {
        mode: selectedMode,
        settings,
        currentTeam: 1,
        team1: { ...initialTeamStats, name: settings.team1Name },
        team2: { ...initialTeamStats, name: settings.team2Name },
        timeLeft: settings.turnDuration,
        wordBudget: selectedMode === GameMode.MARATHON ? 15 : undefined,
        passBudget: 3,
        history: [],
        activeChallenge: null,
        activeModifiers: { forbiddenWordsHidden: false, scoreMultiplier: 1 },
        mapState
    };

    setSession(initialSession);
    setUsedWords([]);
    setCardQueue([]);
    setGameState(GameState.TRANSITION);

    if (selectedMode !== GameMode.JOURNEY) {
        setIsLoading(true);
        setActiveTurnMode(selectedMode);
        const cards = await fetchTabuCards(selectedMode, [], INITIAL_BATCH_SIZE);
        if (cards.length > 0) {
            setCardQueue(cards);
            setUsedWords(cards.map(c => c.target));
        }
        setIsLoading(false);
    }
  };

  const handleApplySabotage = (type: 'HALF_TIME' | 'NO_PASS') => {
      setSession(prev => {
          const cost = type === 'HALF_TIME' ? 7 : 10;
          const opponentTeam = prev.currentTeam === 1 ? 'team2' : 'team1';
          
          return {
              ...prev,
              [opponentTeam]: {
                  ...prev[opponentTeam],
                  score: Math.max(0, prev[opponentTeam].score - cost),
                  usedSabotage: true
              },
              activeModifiers: {
                  ...prev.activeModifiers,
                  sabotageEffect: type
              }
          };
      });
  };

  const handleBeginTurn = async () => {
      setGameState(GameState.PLAYING);
      let currentModeForTurn = session.mode;
      let duration = session.settings.turnDuration;

      if (session.mode === GameMode.JOURNEY && session.mapState) {
          const pos = session.currentTeam === 1 ? session.mapState.team1Pos : session.mapState.team2Pos;
          const nodeIndex = Math.min(pos, session.mapState.nodes.length - 1);
          const nodeType = session.mapState.nodes[nodeIndex].type;
          currentModeForTurn = nodeType;
          if (nodeType === GameMode.CLASSIC) duration = 90;
          else if (nodeType === GameMode.SILENT) duration = 120;
          else if (nodeType === GameMode.MARATHON) duration = 120;
      }

      // Apply Sabotage (Time Warp)
      if (session.activeModifiers.sabotageEffect === 'HALF_TIME') {
          duration = Math.floor(duration / 2);
      }

      setActiveTurnMode(currentModeForTurn);
      
      if (session.mode === GameMode.JOURNEY) {
          setCardQueue([]);
      }

      let challengeEffects = {};
      if (session.activeChallenge) {
          challengeEffects = session.activeChallenge.effect(session);
      }

      // Apply Sabotage (No Pass)
      let passBudget = 3;
      if (session.activeModifiers.sabotageEffect === 'NO_PASS') {
          passBudget = 0;
      }

      setSession(prev => ({
          ...prev,
          timeLeft: duration,
          wordBudget: currentModeForTurn === GameMode.MARATHON ? 15 : undefined,
          passBudget: passBudget,
          ...challengeEffects
      }));
      
      await loadNextCard(currentModeForTurn);
  };

  const useJoker = (type: JokerType) => {
      const currentTeam = session.currentTeam === 1 ? 'team1' : 'team2';
      const available = session[currentTeam].jokers[type];

      if (available > 0) {
          soundManager.playPowerUp();
          setSession(prev => {
              const newState = { ...prev };
              newState[currentTeam] = {
                  ...newState[currentTeam],
                  jokers: { ...newState[currentTeam].jokers, [type]: available - 1 }
              };
              if (type === JokerType.TIME_FREEZE) newState.timeLeft += 15;
              else if (type === JokerType.EXTRA_PASS) newState.passBudget = 5; 
              else if (type === JokerType.REMOVE_FORBIDDEN) newState.activeModifiers = { ...newState.activeModifiers, forbiddenWordsHidden: true };
              return newState;
          });
      }
  };

  const refillQueueIfNeeded = useCallback(async (currentQueueLength: number, mode: GameMode, currentUsedWords: string[]) => {
    if (currentQueueLength <= REFILL_THRESHOLD && !isFetchingRef.current) {
        isFetchingRef.current = true;
        setIsRefilling(true);
        try {
            const newCards = await fetchTabuCards(mode, currentUsedWords, REFILL_BATCH_SIZE);
            setCardQueue(prev => [...prev, ...newCards]);
            setUsedWords(prev => [...prev, ...newCards.map(c => c.target)]);
        } catch (e) {
            console.error("BG fetch failed", e);
        } finally {
            isFetchingRef.current = false;
            setIsRefilling(false);
        }
    }
  }, []);

  const loadNextCard = async (overrideMode?: GameMode) => {
      const modeToUse = overrideMode || activeTurnMode;

      if (cardQueue.length > 0) {
          const nextCard = cardQueue[0];
          const newQueue = cardQueue.slice(1);
          setCurrentCard(nextCard);
          setCardQueue(newQueue);
          refillQueueIfNeeded(newQueue.length, modeToUse, usedWords);
      } else {
          setIsLoading(true);
          const newCards = await fetchTabuCards(modeToUse, usedWords, 5);
          if (newCards.length > 0) {
              setCurrentCard(newCards[0]);
              setCardQueue(newCards.slice(1));
              setUsedWords(prev => [...prev, ...newCards.map(c => c.target)]);
          }
          setIsLoading(false);
      }
  };

  const handleAction = async (action: 'CORRECT' | 'TABOO' | 'PASS') => {
    if (isLoading || !currentCard) return;

    if (action === 'PASS') {
        if (session.passBudget <= 0) return;
        soundManager.playPass();
    } else if (action === 'CORRECT') {
        soundManager.playCorrect();
    } else if (action === 'TABOO') {
        soundManager.playTaboo();
    }

    let points = 0;
    const multiplier = session.activeModifiers.scoreMultiplier;
    if (action === 'CORRECT') points = 1 * multiplier;
    if (action === 'TABOO') points = -1 * multiplier;

    setSession(prev => {
        const isTeam1 = prev.currentTeam === 1;
        const newTeam1Score = isTeam1 ? prev.team1.score + points : prev.team1.score;
        const newTeam2Score = !isTeam1 ? prev.team2.score + points : prev.team2.score;
        let newMapState = prev.mapState;
        if (prev.mode === GameMode.JOURNEY && prev.mapState) {
            newMapState = { ...prev.mapState };
            if (points > 0) {
                if (isTeam1) newMapState.team1Pos = Math.min(newMapState.team1Pos + points, newMapState.totalLength);
                else newMapState.team2Pos = Math.min(newMapState.team2Pos + points, newMapState.totalLength);
            }
        }
        let gameOver = false;
        if (prev.mode === GameMode.JOURNEY && newMapState) {
            if (newMapState.team1Pos >= newMapState.totalLength || newMapState.team2Pos >= newMapState.totalLength) gameOver = true;
        } else {
            if (newTeam1Score >= prev.settings.targetScore || newTeam2Score >= prev.settings.targetScore) gameOver = true;
        }
        
        if (gameOver) {
            soundManager.playGameOver();
            setGameState(GameState.GAME_OVER);
        }

        return {
            ...prev,
            team1: { ...prev.team1, score: newTeam1Score },
            team2: { ...prev.team2, score: newTeam2Score },
            history: [...prev.history, { team: prev.currentTeam, word: currentCard.target, result: action }],
            passBudget: action === 'PASS' ? prev.passBudget - 1 : prev.passBudget,
            mapState: newMapState
        };
    });

    if (gameState !== GameState.GAME_OVER) {
        await loadNextCard();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const currentJokers = session.currentTeam === 1 ? session.team1.jokers : session.team2.jokers;
  const isPassLocked = session.activeModifiers.sabotageEffect === 'NO_PASS';
  const isTimeWarped = session.activeModifiers.sabotageEffect === 'HALF_TIME';

  // Render Logic
  return (
    // min-h-dvh handles mobile browser height correctly
    <div className="h-dvh w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black text-slate-100 flex flex-col overflow-hidden font-outfit relative">
      
      {/* Background Stars (Static simple dots) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

      {/* --- HEADER --- */}
      {gameState === GameState.PLAYING && (
        <header className="px-4 py-2 pt-safe flex flex-col gap-2 bg-slate-900/60 backdrop-blur-lg border-b border-white/5 z-20 shrink-0">
           {/* Top Row: Timer & Mode */}
           <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                        {session.mode === GameMode.JOURNEY ? activeTurnMode : session.mode}
                    </div>
                    {session.activeModifiers.scoreMultiplier > 1 && (
                        <span className="text-yellow-400 text-xs font-black animate-pulse">2X PUAN</span>
                    )}
                    {isTimeWarped && (
                        <span className="text-red-400 text-xs font-black animate-pulse flex items-center gap-1"><Clock size={10} /> SABOTAJ</span>
                    )}
                </div>
                
                <div className={`flex items-center gap-1.5 font-mono font-bold text-2xl tracking-tight ${session.timeLeft < 10 || isTimeWarped ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    <Timer size={18} strokeWidth={2.5} />
                    {formatTime(session.timeLeft)}
                </div>

                <div className="flex items-center gap-1">
                     <button onClick={() => handleTurnEnd(session)} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white border border-slate-700">
                        <FastForward size={14} />
                    </button>
                    <button onClick={() => setGameState(GameState.GAME_OVER)} className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-red-400 border border-slate-700">
                        <PauseCircle size={14} />
                    </button>
                </div>
           </div>

           {/* Middle Row: Score/Map */}
           <div className="w-full">
               {session.mode === GameMode.JOURNEY && session.mapState ? (
                   <div className="bg-black/30 p-1.5 rounded-xl border border-white/5">
                       <MapBoard 
                            mapState={session.mapState} 
                            team1Name={session.team1.name} 
                            team2Name={session.team2.name} 
                            currentTeam={session.currentTeam}
                       />
                   </div>
               ) : (
                    <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5">
                            <div className={`flex-1 flex justify-between items-center px-3 py-1.5 rounded-lg ${session.currentTeam === 1 ? 'bg-pink-500/20 border border-pink-500/30' : 'opacity-40 grayscale'}`}>
                                <span className="text-[10px] font-bold uppercase text-pink-200">{session.team1.name}</span>
                                <span className="text-lg font-black text-white">{session.team1.score}</span>
                            </div>
                            <div className={`flex-1 flex justify-between items-center px-3 py-1.5 rounded-lg ${session.currentTeam === 2 ? 'bg-purple-500/20 border border-purple-500/30' : 'opacity-40 grayscale'}`}>
                                <span className="text-[10px] font-bold uppercase text-purple-200">{session.team2.name}</span>
                                <span className="text-lg font-black text-white">{session.team2.score}</span>
                            </div>
                    </div>
               )}
           </div>
        </header>
      )}

      {/* --- MAIN CONTENT AREA --- */}
      {/* flex-1 ensures it takes available space. min-h-0 allows nested scrolling if needed (though we want to avoid scrolling on card) */}
      <main className="flex-1 min-h-0 w-full max-w-lg mx-auto p-4 flex flex-col items-center justify-center relative">
        
        {gameState === GameState.MENU && <Menu onSelectMode={handleSelectMode} />}
        
        {gameState === GameState.SETUP && (
            <GameSetup mode={selectedMode} onStart={handleStartGame} onBack={() => setGameState(GameState.MENU)} />
        )}

        {gameState === GameState.TRANSITION && (
            <TurnTransition session={session} onReady={handleBeginTurn} onSabotage={handleApplySabotage} />
        )}

        {gameState === GameState.PLAYING && currentCard && (
          <div className="w-full h-full flex flex-col relative animate-zoom-in">
             {/* Joker Bar Overlay - Positioned slightly above card if possible, or top of main */}
             {session.settings.enableJokers && (
                <div className="flex justify-between px-2 mb-2 gap-2">
                    {/* Left Joker */}
                    <button 
                        disabled={currentJokers[JokerType.TIME_FREEZE] === 0}
                        onClick={() => useJoker(JokerType.TIME_FREEZE)}
                        className="flex-1 bg-blue-500/10 border border-blue-500/20 active:bg-blue-500 text-blue-300 active:text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 disabled:opacity-20 transition-all"
                    >
                        <Clock size={12} /> +15sn ({currentJokers[JokerType.TIME_FREEZE]})
                    </button>
                    {/* Middle Joker */}
                    <button 
                        disabled={currentJokers[JokerType.REMOVE_FORBIDDEN] === 0 || session.activeModifiers.forbiddenWordsHidden}
                        onClick={() => useJoker(JokerType.REMOVE_FORBIDDEN)}
                        className="flex-1 bg-purple-500/10 border border-purple-500/20 active:bg-purple-500 text-purple-300 active:text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 disabled:opacity-20 transition-all"
                    >
                        <EyeOff size={12} /> Yasak Yok ({currentJokers[JokerType.REMOVE_FORBIDDEN]})
                    </button>
                    {/* Right Joker */}
                    <button 
                        disabled={currentJokers[JokerType.EXTRA_PASS] === 0 || isPassLocked}
                        onClick={() => useJoker(JokerType.EXTRA_PASS)}
                        className="flex-1 bg-green-500/10 border border-green-500/20 active:bg-green-500 text-green-300 active:text-white text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 disabled:opacity-20 transition-all"
                    >
                        {isPassLocked ? <Lock size={12} /> : <Zap size={12} />} {isPassLocked ? 'KİLİTLİ' : `Pas Doldur (${currentJokers[JokerType.EXTRA_PASS]})`}
                    </button>
                </div>
             )}

             {/* The Card - flex-1 to fill remaining space */}
             <div className="flex-1 min-h-0 relative">
                 <Card 
                    data={currentCard} 
                    mode={activeTurnMode} 
                    isLoading={isLoading} 
                    hideForbidden={session.activeModifiers.forbiddenWordsHidden} 
                />
             </div>
          </div>
        )}

        {gameState === GameState.GAME_OVER && (
          <GameOver session={session} onRestart={() => handleStartGame(session.settings)} onHome={() => setGameState(GameState.MENU)} />
        )}
      </main>

      {/* --- FOOTER CONTROLS --- */}
      {/* pb-safe ensures buttons don't overlap with iOS home indicator */}
      {gameState === GameState.PLAYING && (
        <div className="w-full bg-slate-900/80 backdrop-blur-xl border-t border-white/5 z-30 pb-safe pt-3 px-4 shrink-0">
            <div className="max-w-lg mx-auto">
                {activeTurnMode === GameMode.MARATHON ? (
                    <div className="flex flex-col gap-2">
                         {/* Marathon Word Counter */}
                         <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2 px-4 mb-1">
                             <div className="text-xs font-bold text-slate-400">KALAN KELİME</div>
                             <div className="text-xl font-black text-white">{session.wordBudget}</div>
                             <button onClick={() => session.wordBudget! > 0 && setSession(p => ({...p, wordBudget: (p.wordBudget||0)-1}))} className="bg-slate-700 px-2 rounded text-white">-</button>
                         </div>
                        <div className="grid grid-cols-3 gap-3">
                             <button disabled={isLoading} onClick={() => handleAction('TABOO')} className="h-14 rounded-2xl bg-red-500/10 border border-red-500/50 text-red-500 active:bg-red-500 active:text-white font-black text-lg transition-all">TABU</button>
                            <button 
                                disabled={isLoading || (session.passBudget || 0) <= 0 || isPassLocked} 
                                onClick={() => handleAction('PASS')} 
                                className={`h-14 rounded-2xl border font-black text-lg transition-all disabled:opacity-50 disabled:grayscale ${isPassLocked ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 active:bg-yellow-500 active:text-white'}`}
                            >
                                {isPassLocked ? <Lock size={20} className="mx-auto" /> : `PAS (${session.passBudget})`}
                            </button>
                            <button disabled={isLoading} onClick={() => handleAction('CORRECT')} className="h-14 rounded-2xl bg-green-500/10 border border-green-500/50 text-green-500 active:bg-green-500 active:text-white font-black text-lg transition-all">DOĞRU</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        <button disabled={isLoading} onClick={() => handleAction('TABOO')} className="h-20 flex flex-col items-center justify-center rounded-2xl bg-red-500 shadow-lg shadow-red-500/30 active:scale-95 transition-all">
                            <AlertOctagon className="text-white mb-1" size={24} />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Tabu</span>
                        </button>
                        <button 
                            disabled={isLoading || session.passBudget <= 0 || isPassLocked} 
                            onClick={() => handleAction('PASS')} 
                            className={`h-20 flex flex-col items-center justify-center rounded-2xl shadow-lg transition-all disabled:opacity-50 disabled:grayscale ${isPassLocked ? 'bg-slate-800 shadow-none border border-slate-700' : 'bg-yellow-500 shadow-yellow-500/30 active:scale-95'}`}
                        >
                            {isPassLocked ? <Lock className="text-slate-500 mb-1" size={24} /> : <SkipForward className="text-white mb-1" size={24} />}
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isPassLocked ? 'text-slate-500' : 'text-white'}`}>
                                {isPassLocked ? 'KİLİTLİ' : `Pas (${session.passBudget})`}
                            </span>
                        </button>
                        <button disabled={isLoading} onClick={() => handleAction('CORRECT')} className="h-20 flex flex-col items-center justify-center rounded-2xl bg-green-500 shadow-lg shadow-green-500/30 active:scale-95 transition-all">
                            <Check className="text-white mb-1" size={24} />
                            <span className="text-[10px] font-black text-white uppercase tracking-wider">Doğru</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default App;