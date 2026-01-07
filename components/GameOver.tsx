import React from 'react';
import { GameSession } from '../types';
import { RefreshCw, Home, Trophy, Award } from 'lucide-react';

interface GameOverProps {
  session: GameSession;
  onRestart: () => void;
  onHome: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ session, onRestart, onHome }) => {
  const winner = session.team1.score >= session.settings.targetScore ? 1 : 
                 session.team2.score >= session.settings.targetScore ? 2 : 
                 session.team1.score > session.team2.score ? 1 : 2;

  const winnerName = winner === 1 ? session.settings.team1Name : session.settings.team2Name;
  const isTeam1 = winner === 1;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 animate-fade-in py-8">
      
      {/* Trophy Icon */}
      <div className="relative mb-8">
          <div className={`absolute inset-0 blur-[60px] opacity-40 rounded-full animate-pulse ${isTeam1 ? 'bg-pink-500' : 'bg-purple-500'}`}></div>
          <div className="relative w-32 h-32 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-yellow-200">
              <Trophy size={64} className="text-yellow-900" />
          </div>
      </div>

      <div className="text-center space-y-2 mb-10">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em]">KAZANAN</span>
          <h1 className={`text-5xl xs:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r ${isTeam1 ? 'from-pink-300 to-pink-600' : 'from-purple-300 to-purple-600'}`}>
              {winnerName}
          </h1>
      </div>

      <div className="w-full max-w-sm bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-3xl p-2 mb-8 grid grid-cols-2 gap-2">
            <div className={`p-4 rounded-2xl flex flex-col items-center justify-center ${winner === 1 ? 'bg-slate-700/80 shadow-lg' : 'opacity-50'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{session.settings.team1Name}</div>
                <div className="text-3xl font-black text-white">{session.team1.score}</div>
                {winner === 1 && <Award size={16} className="text-yellow-400 mt-2" />}
            </div>
            <div className={`p-4 rounded-2xl flex flex-col items-center justify-center ${winner === 2 ? 'bg-slate-700/80 shadow-lg' : 'opacity-50'}`}>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{session.settings.team2Name}</div>
                <div className="text-3xl font-black text-white">{session.team2.score}</div>
                {winner === 2 && <Award size={16} className="text-yellow-400 mt-2" />}
            </div>
      </div>

      <div className="w-full max-w-sm space-y-3 mt-auto">
             <button
                onClick={onRestart}
                className="w-full py-4 bg-white text-slate-900 hover:bg-slate-200 rounded-2xl font-black flex items-center justify-center transition-colors shadow-lg shadow-white/10 active:scale-[0.98]"
             >
                <RefreshCw className="mr-2" size={20} />
                TEKRAR OYNA
             </button>
             <button
                onClick={onHome}
                className="w-full py-4 bg-transparent border-2 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-2xl font-bold flex items-center justify-center transition-colors active:scale-[0.98]"
             >
                <Home className="mr-2" size={20} />
                ANA MENÜ
             </button>
      </div>
    </div>
  );
};

export default GameOver;