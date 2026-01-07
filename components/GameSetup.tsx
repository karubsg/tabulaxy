import React, { useState } from 'react';
import { GameMode, GameSettings } from '../types';
import { Users, Trophy, Timer, Play, Map, ChevronLeft, Dices, Sparkles, Check, X, Skull } from 'lucide-react';

interface GameSetupProps {
  mode: GameMode;
  onStart: (settings: GameSettings) => void;
  onBack: () => void;
}

const GameSetup: React.FC<GameSetupProps> = ({ mode, onStart, onBack }) => {
  const [team1Name, setTeam1Name] = useState('Takım A');
  const [team2Name, setTeam2Name] = useState('Takım B');
  const [targetScore, setTargetScore] = useState(mode === GameMode.JOURNEY ? 30 : 50);
  const [turnDuration, setTurnDuration] = useState(mode === GameMode.MARATHON ? 120 : 90);
  
  // New Settings
  const [enableJokers, setEnableJokers] = useState(true);
  const [enableChallenges, setEnableChallenges] = useState(true);
  const [enableSabotage, setEnableSabotage] = useState(true);

  const handleStart = () => {
    onStart({
      team1Name: team1Name || 'Takım A',
      team2Name: team2Name || 'Takım B',
      targetScore,
      turnDuration,
      enableJokers,
      enableChallenges,
      enableSabotage
    });
  };

  const isJourney = mode === GameMode.JOURNEY;

  return (
    <div className="w-full h-full flex flex-col animate-fade-in pb-8">
      
      {/* Header */}
      <div className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
              <ChevronLeft size={32} />
          </button>
          <div className="ml-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight">{mode}</h2>
            <p className="text-slate-400 text-sm">Oyun Ayarları</p>
          </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide px-1">
        {/* Teams */}
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider">
            <Users size={14} /> Takım İsimleri
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-800/50 p-1 rounded-2xl border border-slate-700 focus-within:border-pink-500 transition-colors">
              <input
                type="text"
                value={team1Name}
                onChange={(e) => setTeam1Name(e.target.value)}
                className="w-full bg-transparent border-none text-center py-3 text-white font-bold focus:outline-none placeholder:text-slate-600"
                placeholder="Takım A"
              />
            </div>
            <div className="bg-slate-800/50 p-1 rounded-2xl border border-slate-700 focus-within:border-purple-500 transition-colors">
              <input
                type="text"
                value={team2Name}
                onChange={(e) => setTeam2Name(e.target.value)}
                className="w-full bg-transparent border-none text-center py-3 text-white font-bold focus:outline-none placeholder:text-slate-600"
                placeholder="Takım B"
              />
            </div>
          </div>
        </div>

        {/* Target Score Slider */}
        <div className="space-y-4">
          <label className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-wider">
            {isJourney ? <Map size={14} /> : <Trophy size={14} />} 
            {isJourney ? ' Harita Uzunluğu' : ' Hedef Puan'}
          </label>
          
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
              <div className="flex justify-between items-end mb-4">
                  <span className="text-4xl font-black text-yellow-400">{targetScore}<span className="text-lg text-slate-500 ml-1">puan</span></span>
              </div>
              <input
                type="range"
                min="25"
                max="500"
                step="5"
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-yellow-500"
              />
              <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold uppercase">
                  <span>25</span>
                  <span>500</span>
              </div>
          </div>
        </div>

        {/* Dynamic Settings (Jokers, Challenges, Sabotage) */}
        <div className="space-y-3">
           <label className="flex items-center gap-2 text-green-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles size={14} /> Oyun Dinamikleri
           </label>
           <div className="grid grid-cols-3 gap-2">
               {/* Jokers Toggle */}
               <button 
                  onClick={() => setEnableJokers(!enableJokers)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${enableJokers ? 'bg-indigo-500/20 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
               >
                   <div className={`p-2 rounded-full ${enableJokers ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                       <Sparkles size={16} fill={enableJokers ? "currentColor" : "none"} />
                   </div>
                   <span className="font-bold text-[10px] text-center">Jokerler</span>
                   <div className="absolute top-1 right-1">
                       {enableJokers ? <Check size={12} className="text-indigo-400" /> : <X size={12} />}
                   </div>
               </button>

               {/* Challenges Toggle */}
               <button 
                  onClick={() => setEnableChallenges(!enableChallenges)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${enableChallenges ? 'bg-orange-500/20 border-orange-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
               >
                   <div className={`p-2 rounded-full ${enableChallenges ? 'bg-orange-500' : 'bg-slate-700'}`}>
                       <Dices size={16} />
                   </div>
                   <span className="font-bold text-[10px] text-center">Şans Kartı</span>
                   <div className="absolute top-1 right-1">
                       {enableChallenges ? <Check size={12} className="text-orange-400" /> : <X size={12} />}
                   </div>
               </button>

               {/* Sabotage Toggle */}
               <button 
                  onClick={() => setEnableSabotage(!enableSabotage)}
                  className={`p-3 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden ${enableSabotage ? 'bg-red-500/20 border-red-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
               >
                   <div className={`p-2 rounded-full ${enableSabotage ? 'bg-red-500' : 'bg-slate-700'}`}>
                       <Skull size={16} />
                   </div>
                   <span className="font-bold text-[10px] text-center">Sabotaj</span>
                   <div className="absolute top-1 right-1">
                       {enableSabotage ? <Check size={12} className="text-red-400" /> : <X size={12} />}
                   </div>
               </button>
           </div>
        </div>

        {/* Turn Duration */}
        {!isJourney && (
          <div className="space-y-4">
              <label className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
               <Timer size={14} /> Tur Süresi
              </label>
              
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                  <div className="flex justify-between items-end mb-4">
                      <span className="text-4xl font-black text-blue-400">{turnDuration}<span className="text-lg text-slate-500 ml-1">sn</span></span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="180"
                    step="10"
                    value={turnDuration}
                    onChange={(e) => setTurnDuration(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold uppercase">
                      <span>30sn</span>
                      <span>180sn</span>
                  </div>
              </div>
          </div>
        )}
        
        {isJourney && (
             <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                 <p className="text-xs text-blue-200 leading-relaxed text-center">
                     <span className="font-bold">Bilgi:</span> Harita modunda süre, geldiğiniz durağın türüne göre (Klasik, Sessiz vb.) otomatik ayarlanır.
                 </p>
             </div>
        )}
      </div>

      <button
        onClick={handleStart}
        className="w-full py-5 bg-gradient-to-r from-pink-600 to-purple-600 rounded-2xl font-black text-xl text-white shadow-xl shadow-purple-900/40 flex items-center justify-center gap-3 active:scale-[0.98] transition-all mt-4"
      >
        <Play size={24} fill="currentColor" />
        OYUNU BAŞLAT
      </button>
    </div>
  );
};

export default GameSetup;