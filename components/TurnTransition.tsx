import React, { useState } from 'react';
import { GameSession, GameMode } from '../types';
import { ArrowRight, Trophy, Zap, Map, Skull, Clock, Lock } from 'lucide-react';
import MapBoard from './MapBoard';

interface TurnTransitionProps {
  session: GameSession;
  onReady: () => void;
  onSabotage: (type: 'HALF_TIME' | 'NO_PASS') => void;
}

const TurnTransition: React.FC<TurnTransitionProps> = ({ session, onReady, onSabotage }) => {
  const currentTeamName = session.currentTeam === 1 ? session.settings.team1Name : session.settings.team2Name;
  const isTeam1 = session.currentTeam === 1;
  const { activeChallenge } = session;
  const isJourney = session.mode === GameMode.JOURNEY;

  // Sabotage Logic vars
  const [showSabotageModal, setShowSabotageModal] = useState(false);
  const opponentTeam = isTeam1 ? session.team2 : session.team1;
  const opponentName = isTeam1 ? session.settings.team2Name : session.settings.team1Name;
  
  // Can opponent use sabotage? (Must have enough points and unused right)
  const canAffordTime = opponentTeam.score >= 7;
  const canAffordLock = opponentTeam.score >= 10;
  const canSabotage = session.settings.enableSabotage && !opponentTeam.usedSabotage && (canAffordTime || canAffordLock);

  // Determine current node type for Journey mode
  let nextModeText = "";
  if (isJourney && session.mapState) {
      const pos = session.currentTeam === 1 ? session.mapState.team1Pos : session.mapState.team2Pos;
      const nodeIndex = Math.min(pos, session.mapState.nodes.length - 1);
      const nodeType = session.mapState.nodes[nodeIndex].type;
      nextModeText = nodeType;
  }

  return (
    <div className="flex flex-col h-full w-full py-6 relative">
      
      {/* Background Glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-sm rounded-full blur-[100px] opacity-20 pointer-events-none ${isTeam1 ? 'bg-pink-600' : 'bg-purple-600'}`}></div>

      {/* Challenge Alert */}
      {activeChallenge && (
          <div className="absolute top-4 left-4 right-4 z-30 animate-bounce-in">
              <div className={`p-5 rounded-2xl border-2 shadow-2xl bg-slate-900/90 backdrop-blur-xl ${activeChallenge.type === 'BONUS' ? 'border-yellow-500 text-yellow-500' : activeChallenge.type === 'PENALTY' ? 'border-red-500 text-red-500' : 'border-blue-500 text-blue-500'}`}>
                   <div className="flex items-start gap-4">
                       <div className="p-3 bg-white/10 rounded-xl">
                            <Zap size={24} fill="currentColor" />
                       </div>
                       <div>
                           <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">ŞANS KARTI</div>
                           <h2 className="text-xl font-black text-white mb-1">{activeChallenge.title}</h2>
                           <p className="text-sm font-medium opacity-90 leading-snug">{activeChallenge.description}</p>
                       </div>
                   </div>
              </div>
          </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 space-y-8">
          
          <div className="text-center space-y-2">
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">SIRADAKİ TAKIM</span>
            <h1 className={`text-6xl xs:text-7xl font-black tracking-tighter drop-shadow-2xl ${isTeam1 ? 'text-pink-400' : 'text-purple-400'}`}>
                {currentTeamName}
            </h1>
          </div>

          {/* Context Info (Map or Score) */}
          <div className="w-full px-4">
            {isJourney && session.mapState ? (
                <div className="bg-slate-800/60 backdrop-blur border border-slate-700 p-4 rounded-3xl">
                     <div className="flex items-center justify-center gap-2 mb-4">
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ROTADAKİ DURUM</span>
                     </div>
                     <MapBoard 
                        mapState={session.mapState} 
                        team1Name={session.team1.name} 
                        team2Name={session.team2.name} 
                        currentTeam={session.currentTeam}
                    />
                    <div className="mt-4 text-center">
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/30">
                            <Map size={16} /> Durak: {nextModeText}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                     <div className={`bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col items-center ${isTeam1 ? 'ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-900 bg-pink-500/10' : 'opacity-60'}`}>
                         <span className="text-[10px] font-bold text-slate-400 uppercase">{session.team1.name}</span>
                         <span className="text-4xl font-black text-white">{session.team1.score}</span>
                     </div>
                     <div className={`bg-slate-800/60 border border-slate-700 p-4 rounded-2xl flex flex-col items-center ${!isTeam1 ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-slate-900 bg-purple-500/10' : 'opacity-60'}`}>
                         <span className="text-[10px] font-bold text-slate-400 uppercase">{session.team2.name}</span>
                         <span className="text-4xl font-black text-white">{session.team2.score}</span>
                     </div>
                </div>
            )}
          </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 mt-auto space-y-3">
        {/* Sabotage Trigger Button */}
        {canSabotage && (
            <button 
                onClick={() => setShowSabotageModal(true)}
                className="w-full py-3 bg-red-500/10 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
            >
                <Skull size={18} />
                <span className="uppercase text-xs tracking-wider">{opponentName}: SABOTAJ YAP</span>
            </button>
        )}

        <button
            onClick={onReady}
            className="group w-full py-5 bg-white text-slate-900 rounded-[2rem] font-black text-2xl flex items-center justify-center gap-3 shadow-[0_0_50px_-10px_rgba(255,255,255,0.4)] active:scale-[0.98] transition-all"
        >
            <span>BAŞLA</span>
            <div className="bg-slate-900 text-white rounded-full p-2 group-hover:translate-x-1 transition-transform">
                <ArrowRight size={20} />
            </div>
        </button>
        <p className="text-center text-slate-500 text-xs font-bold mt-2 uppercase tracking-widest">
            {activeChallenge ? 'DİKKAT! ŞANS KARTI AKTİF' : 'HAZIR OLUNCA BASIN'}
        </p>
      </div>

      {/* Sabotage Modal */}
      {showSabotageModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex flex-col items-center justify-center animate-fade-in">
              <Skull size={48} className="text-red-500 mb-4 animate-pulse" />
              <h2 className="text-2xl font-black text-white text-center mb-2 uppercase">GALAKTİK SABOTAJ</h2>
              <p className="text-center text-slate-400 text-sm mb-6 max-w-xs">
                  Kendi puanından feda ederek rakibini zor duruma düşür! Sadece 1 hakkın var.
              </p>

              <div className="w-full space-y-3">
                  <button 
                    disabled={!canAffordTime}
                    onClick={() => { onSabotage('HALF_TIME'); setShowSabotageModal(false); }}
                    className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center gap-4 hover:border-red-500 transition-colors disabled:opacity-40 disabled:grayscale"
                  >
                      <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                          <Clock size={24} />
                      </div>
                      <div className="text-left flex-1">
                          <h3 className="font-bold text-white">Zaman Bükülmesi</h3>
                          <p className="text-xs text-slate-400">Süreyi yarıya indir.</p>
                      </div>
                      <div className="text-red-500 font-black">-7P</div>
                  </button>

                  <button 
                    disabled={!canAffordLock}
                    onClick={() => { onSabotage('NO_PASS'); setShowSabotageModal(false); }}
                    className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl flex items-center gap-4 hover:border-red-500 transition-colors disabled:opacity-40 disabled:grayscale"
                  >
                      <div className="p-3 bg-yellow-500/20 text-yellow-400 rounded-xl">
                          <Lock size={24} />
                      </div>
                      <div className="text-left flex-1">
                          <h3 className="font-bold text-white">Pas Kilidi</h3>
                          <p className="text-xs text-slate-400">Pas butonunu kilitle.</p>
                      </div>
                      <div className="text-red-500 font-black">-10P</div>
                  </button>
              </div>

              <button 
                onClick={() => setShowSabotageModal(false)}
                className="mt-6 text-slate-500 text-sm font-bold uppercase hover:text-white"
              >
                  Vazgeç
              </button>
          </div>
      )}

    </div>
  );
};

export default TurnTransition;