import React from 'react';
import { TabuCard, GameMode } from '../types';

interface CardProps {
  data: TabuCard;
  mode: GameMode;
  isLoading: boolean;
  hideForbidden?: boolean;
}

const Card: React.FC<CardProps> = ({ data, mode, isLoading, hideForbidden }) => {
  if (isLoading) {
    return (
      <div className="w-full h-full max-h-[60vh] aspect-[3/4] bg-slate-800/50 backdrop-blur-md rounded-[2rem] p-6 border border-slate-700/50 animate-pulse flex flex-col items-center justify-center">
        <div className="h-8 w-1/2 bg-slate-700 rounded-full mb-8 opacity-50"></div>
        <div className="space-y-4 w-full px-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-full bg-slate-700 rounded-full opacity-30"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-white rounded-[2.5rem] shadow-2xl shadow-black/50 overflow-hidden transform transition-all duration-300 ring-4 ring-slate-900 ring-offset-2 ring-offset-slate-800">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-bl-full z-10 pointer-events-none opacity-50"></div>

      {/* HEADER: Target Word */}
      <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 pt-10 pb-8 px-6 text-center relative shrink-0">
        
        {/* Category Label */}
        {data.category && (
           <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/20 backdrop-blur-md rounded-full border border-white/10">
             <span className="text-[10px] font-bold tracking-[0.2em] text-white/90 uppercase block leading-none">
               {data.category}
             </span>
           </div>
        )}
       
        {/* The Word */}
        <h2 className="text-4xl xs:text-5xl font-black text-white drop-shadow-md tracking-tight break-words leading-[0.9] mt-2">
          {data.target}
        </h2>
      </div>

      {/* BODY: Content Area */}
      <div className="flex-1 bg-white relative flex flex-col px-6 py-4">
        
        {mode === GameMode.SILENT ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-80 animate-fade-in">
            <div className="text-7xl grayscale opacity-80">🤫</div>
            <div>
                <p className="text-xl font-black text-slate-800 uppercase tracking-widest">SESSİZLİK</p>
                <p className="text-sm font-medium text-slate-500 mt-1">Konuşma! Sadece hareket et.</p>
            </div>
          </div>
        ) : mode === GameMode.MARATHON ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 mb-2">
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div>
                 <p className="text-lg font-black text-slate-700 uppercase tracking-widest">MARATON MODU</p>
                 <p className="text-slate-500 text-sm px-4 mt-2 leading-tight">
                  Yasaklı kelime yok. Hızlıca anlat ve pas geçme!
                </p>
            </div>
          </div>
        ) : (
          /* CLASSIC MODE */
          <div className="flex-1 flex flex-col h-full animate-fade-in">
            <div className="text-center mb-4">
               {hideForbidden ? (
                   <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-black tracking-wider uppercase animate-bounce">
                       Yasaklar Kalktı!
                   </span>
               ) : (
                   <div className="w-full h-1 bg-slate-100 rounded-full my-2 flex items-center justify-center">
                       <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Yasaklılar</span>
                   </div>
               )}
            </div>
            
            {hideForbidden ? (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-4xl font-black text-slate-200 uppercase tracking-tighter">SERBEST</p>
                </div>
            ) : (
                <ul className="flex-1 flex flex-col justify-around py-2">
                {data.forbidden.map((word, index) => (
                    <li 
                    key={index} 
                    className="text-lg xs:text-xl font-bold text-slate-700 text-center border-b border-slate-100 last:border-0 pb-1"
                    >
                    {word}
                    </li>
                ))}
                </ul>
            )}
          </div>
        )}
      </div>
      
      {/* Footer Decoration */}
      <div className="h-3 flex w-full">
          <div className="flex-1 bg-pink-500"></div>
          <div className="flex-1 bg-purple-500"></div>
          <div className="flex-1 bg-indigo-500"></div>
      </div>
    </div>
  );
};

export default Card;