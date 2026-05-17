import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Info, RotateCcw, ChevronRight, Trophy, AlertTriangle, Car as CarIcon, Volume2, VolumeX } from 'lucide-react';
import { GameState, GameStats } from '../types';
import { LEVELS } from '../game/Levels';

interface UIProps {
  gameState: GameState;
  stats: GameStats;
  onStart: () => void;
  onRestart: () => void;
  onNextLevel: () => void;
  highScore: number;
}

export const AppUI: React.FC<UIProps> = ({ 
  gameState, 
  stats, 
  onStart, 
  onRestart, 
  onNextLevel,
  highScore
}) => {
  return (
    <AnimatePresence>
      {gameState === 'MENU' && (
        <motion.div 
          key="menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a] p-8"
        >
          {/* Animated Background Grid */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <div className="w-[200%] h-[200%] rotate-12 -translate-x-1/4 -translate-y-1/4"
                 style={{ backgroundImage: 'linear-gradient(#facc15 1px, transparent 1px), linear-gradient(90deg, #facc15 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
            </div>
          </div>

          <motion.div 
            initial={{ y: -50, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="relative mb-12 text-center"
          >
            <h1 className="text-7xl md:text-9xl font-black italic text-white tracking-tight uppercase leading-none">
              TURBO<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-yellow-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">DRIFT</span>
            </h1>
            <div className="mt-4 text-slate-400 font-bold tracking-[0.5em] text-sm md:text-lg italic">PRECISION DRIVING SIMULATOR</div>
          </motion.div>

          <div className="flex flex-col gap-4 w-full max-w-xs relative z-10">
            <UIButton onClick={onStart} icon={<Play size={20} />}>
              Initiate Session
            </UIButton>
            
            <div className="grid grid-cols-2 gap-4">
               <UIButton variant="secondary" icon={<Info size={16} />}>Manual</UIButton>
               <UIButton variant="secondary" icon={<Volume2 size={16} />}>Audio</UIButton>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1 }}
            className="mt-16 flex items-center gap-4 text-slate-500"
          >
            <Trophy size={16} />
            <span className="font-bold text-xs tracking-widest uppercase">Global Record: {highScore}</span>
          </motion.div>
        </motion.div>
      )}

      {gameState === 'SUCCESS' && (
        <motion.div 
          key="success"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a]/95 backdrop-blur-md p-8"
        >
          <div className="text-center space-y-2 mb-8">
            <motion.div 
                initial={{ rotate: -10 }} 
                animate={{ rotate: 10 }} 
                transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.5 }}
                className="text-blue-500 inline-block"
            >
                <Trophy size={64} />
            </motion.div>
            <h2 className="text-5xl font-black italic text-white uppercase">Mission Success</h2>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Sector {stats.levelIndex + 1} Secured</p>
          </div>

          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-sm mb-8 space-y-4 shadow-2xl">
             <div className="flex justify-between items-center text-slate-100">
                <span className="opacity-50 uppercase text-[10px] font-bold tracking-widest italic">Temporal Bonus</span>
                <span className="font-mono text-xl text-yellow-500">+{stats.timeRemaining * 100}</span>
             </div>
             <div className="h-px bg-slate-800" />
             <div className="flex justify-between items-center text-white">
                <span className="opacity-50 uppercase text-[10px] font-bold tracking-widest italic">Total Score</span>
                <span className="font-black text-3xl text-blue-500 tabular-nums">{stats.score.toLocaleString()}</span>
             </div>
          </div>

          <UIButton onClick={onNextLevel} icon={<ChevronRight size={20} />}>
            Proceed to Next
          </UIButton>
        </motion.div>
      )}

      {gameState === 'GAMEOVER' && (
        <motion.div 
          key="gameover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-8"
        >
          <div className="text-center mb-8">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-6xl font-black text-red-500 uppercase italic">Crashed!</h2>
            <p className="text-white/50 font-mono tracking-widest">You ran out of time or wrecked</p>
          </div>

          <div className="text-center space-y-1 mb-8">
             <div className="text-xs text-white/30 uppercase tracking-[0.3em]">Final Score</div>
             <div className="text-6xl font-mono text-white">{stats.score}</div>
          </div>

          <UIButton onClick={onRestart} icon={<RotateCcw size={20} />}>
            Retry Gear
          </UIButton>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const UIButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
}> = ({ children, onClick, variant = 'primary', icon }) => {
  const base = "flex items-center justify-center gap-3 px-8 py-4 rounded font-bold uppercase tracking-widest transition-all active:scale-95 group relative overflow-hidden";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20",
    secondary: "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
  };

  return (
    <button className={`${base} ${variants[variant]}`} onClick={onClick}>
      <span className="relative z-10">{children}</span>
      {icon && <span className="relative z-10 group-hover:translate-x-1 transition-transform">{icon}</span>}
      {variant === 'primary' && (
          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
      )}
    </button>
  );
};
