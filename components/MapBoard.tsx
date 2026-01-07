import React, { useRef, useEffect } from 'react';
import { GameMode, MapState, MapNode } from '../types';
import { BookOpen, MicOff, Zap, Flag, GripHorizontal } from 'lucide-react';

interface MapBoardProps {
  mapState: MapState;
  team1Name: string;
  team2Name: string;
  currentTeam: 1 | 2;
}

const MapBoard: React.FC<MapBoardProps> = ({ mapState, team1Name, team2Name, currentTeam }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to current team's position
  useEffect(() => {
    if (scrollRef.current) {
        const activePos = currentTeam === 1 ? mapState.team1Pos : mapState.team2Pos;
        // Estimate width of a node (~80px + gap)
        const scrollPos = Math.max(0, (activePos * 90) - (scrollRef.current.clientWidth / 2) + 45);
        scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [mapState.team1Pos, mapState.team2Pos, currentTeam]);

  const getNodeIcon = (type: GameMode) => {
      switch (type) {
          case GameMode.CLASSIC: return <BookOpen size={16} />;
          case GameMode.SILENT: return <MicOff size={16} />;
          case GameMode.MARATHON: return <Zap size={16} />;
          default: return <BookOpen size={16} />;
      }
  };

  const getNodeColor = (type: GameMode) => {
      switch (type) {
          case GameMode.CLASSIC: return 'bg-purple-500 text-purple-100 border-purple-400';
          case GameMode.SILENT: return 'bg-blue-500 text-blue-100 border-blue-400';
          case GameMode.MARATHON: return 'bg-orange-500 text-orange-100 border-orange-400';
          default: return 'bg-slate-700';
      }
  };

  return (
    <div className="w-full bg-slate-900/50 rounded-2xl border border-slate-700 overflow-hidden mb-6 relative group">
        
        {/* Teams Legend */}
        <div className="absolute top-2 left-2 z-10 flex gap-2">
            <div className="bg-pink-500 text-white text-[10px] px-2 py-0.5 rounded shadow-lg font-bold">
                {team1Name.substring(0, 3)}..
            </div>
            <div className="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded shadow-lg font-bold">
                {team2Name.substring(0, 3)}..
            </div>
        </div>

        <div 
            ref={scrollRef}
            className="flex items-center gap-4 p-8 overflow-x-auto scrollbar-hide snap-x"
            style={{ scrollBehavior: 'smooth' }}
        >
            {/* Start Line */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center">
                 <div className="w-1 h-12 bg-slate-700 rounded-full mb-2"></div>
                 <span className="text-[10px] text-slate-500 font-bold uppercase">BAŞLA</span>
            </div>

            {mapState.nodes.map((node, index) => {
                const isT1Here = mapState.team1Pos === index;
                const isT2Here = mapState.team2Pos === index;
                
                return (
                    <div key={node.id} className="relative flex-shrink-0 flex flex-col items-center group/node snap-center">
                        {/* Connecting Line */}
                        {index < mapState.nodes.length - 1 && (
                            <div className="absolute top-1/2 left-full w-4 h-1 bg-slate-700 -translate-y-1/2 z-0"></div>
                        )}

                        {/* Node Circle */}
                        <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center relative z-10 shadow-lg transition-transform ${getNodeColor(node.type)} ${isT1Here || isT2Here ? 'scale-110 ring-2 ring-white' : 'opacity-70 grayscale group-hover/node:grayscale-0'}`}>
                            {getNodeIcon(node.type)}
                            
                            {/* Node Number */}
                            <span className="absolute -bottom-6 text-[10px] text-slate-500 font-mono">
                                {index + 1}
                            </span>
                        </div>

                        {/* Avatars */}
                        <div className="absolute -top-4 w-full flex justify-center gap-1">
                             {isT1Here && (
                                 <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-white shadow-lg flex items-center justify-center z-20 animate-bounce">
                                     <span className="text-[8px] font-bold text-white">1</span>
                                 </div>
                             )}
                             {isT2Here && (
                                 <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white shadow-lg flex items-center justify-center z-20 animate-bounce" style={{ animationDelay: '0.1s' }}>
                                     <span className="text-[8px] font-bold text-white">2</span>
                                 </div>
                             )}
                        </div>
                    </div>
                );
            })}

            {/* Finish Line */}
             <div className="flex-shrink-0 flex flex-col items-center justify-center ml-2">
                 <div className="w-12 h-12 rounded-full bg-yellow-500 border-4 border-yellow-300 flex items-center justify-center shadow-lg animate-pulse">
                     <Flag size={20} className="text-yellow-900" fill="currentColor" />
                 </div>
                 <span className="text-[10px] text-yellow-500 font-bold uppercase mt-2">BİTİŞ</span>
            </div>
        </div>
        
        {/* Fade Edges */}
        <div className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 h-full w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default MapBoard;
