import React from 'react';
import { GameMode } from '../types';
import { BookOpen, MicOff, Zap, Map, Rocket } from 'lucide-react';

interface MenuProps {
  onSelectMode: (mode: GameMode) => void;
}

const Menu: React.FC<MenuProps> = ({ onSelectMode }) => {
  return (
    <div className="flex flex-col items-center justify-between min-h-full py-6 px-6 animate-fade-in w-full max-w-md mx-auto">
      
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full mt-8">
        <div className="relative">
          <div className="absolute inset-0 bg-purple-500 blur-[60px] opacity-20 rounded-full animate-pulse"></div>
          <div className="relative bg-slate-800/50 p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-sm transform rotate-3">
             <Rocket size={48} className="text-pink-500" />
          </div>
        </div>
        
        <div className="text-center space-y-1 z-10">
          <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-purple-200 to-purple-400 drop-shadow-sm">
            TABULAXY
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full mx-auto"></div>
          <p className="text-slate-400 text-sm font-medium tracking-wide pt-2">
            GALAKTİK KELİME OYUNU
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full space-y-3 mb-8 z-10">
        
        {/* HARİTA MODU (Primary) */}
        <button
          onClick={() => onSelectMode(GameMode.JOURNEY)}
          className="group relative w-full flex items-center p-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg shadow-indigo-900/40 active:scale-[0.98] transition-all"
        >
          <div className="bg-slate-900/40 w-full h-full rounded-xl p-5 flex items-center backdrop-blur-sm group-hover:bg-slate-900/20 transition-colors">
            <div className="p-3 rounded-full bg-white/10 text-white mr-4 ring-1 ring-white/20">
              <Map size={24} />
            </div>
            <div className="text-left flex-1">
              <h3 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                Büyük Tabu Turu
                <span className="bg-white text-indigo-600 text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-wider">YENİ</span>
              </h3>
              <p className="text-indigo-200 text-xs mt-0.5 opacity-80">Karışık modlarla harita macerası</p>
            </div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-3">
            <button
            onClick={() => onSelectMode(GameMode.CLASSIC)}
            className="flex flex-col items-center justify-center p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl active:bg-slate-800 transition-all hover:border-pink-500/50 group"
            >
            <BookOpen size={28} className="text-pink-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-200">Klasik</span>
            </button>

            <button
            onClick={() => onSelectMode(GameMode.SILENT)}
            className="flex flex-col items-center justify-center p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl active:bg-slate-800 transition-all hover:border-blue-500/50 group"
            >
            <MicOff size={28} className="text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-bold text-slate-200">Sessiz</span>
            </button>
        </div>

        <button
          onClick={() => onSelectMode(GameMode.MARATHON)}
          className="w-full flex items-center p-4 bg-slate-800/80 border border-slate-700/50 rounded-2xl active:bg-slate-800 transition-all hover:border-orange-500/50 group"
        >
          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 mr-4 group-hover:bg-orange-500 group-hover:text-white transition-colors">
            <Zap size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-200">15 Kelime Maratonu</h3>
            <p className="text-slate-500 text-[10px]">Zamana karşı en çok kelimeyi bil</p>
          </div>
        </button>
      </div>

      <div className="text-[10px] text-slate-600 font-medium tracking-widest opacity-50">
        VERSION 2.0 • TABULAXY
      </div>
    </div>
  );
};

export default Menu;