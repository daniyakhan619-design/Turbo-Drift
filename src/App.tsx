import React, { useState, useEffect, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { AppUI } from './components/AppUI';
import { GameState, GameStats } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [levelIndex, setLevelIndex] = useState(0);
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    timeRemaining: 0,
    levelIndex: 0,
    crashes: 0
  });
  const [highScore, setHighScore] = useState(0);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('turbo_drift_highscore');
    if (saved) setHighScore(parseInt(saved));
  }, []);

  const handleStateChange = useCallback((newState: GameState, currentStats: GameStats) => {
    setGameState(newState);
    setStats(currentStats);

    if (newState === 'SUCCESS' || newState === 'GAMEOVER') {
        if (currentStats.score > highScore) {
            setHighScore(currentStats.score);
            localStorage.setItem('turbo_drift_highscore', currentStats.score.toString());
        }
    }
  }, [highScore]);

  const handleStart = () => {
    setLevelIndex(0);
    setGameState('PLAYING');
    setStats({ score: 0, timeRemaining: 0, levelIndex: 0, crashes: 0 });
  };

  const handleRestart = () => {
    setGameState('PLAYING');
    // Keep score or reset? Let's reset level but maybe keep some penalty
    setStats(prev => ({ ...prev, crashes: 0 }));
  };

  const handleNextLevel = () => {
    setLevelIndex(prev => prev + 1);
    setGameState('PLAYING');
  };

  return (
    <div className="relative w-screen h-screen bg-[#0a0f1d] flex items-center justify-center font-sans overflow-hidden">
      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <GameEngine 
          gameState={gameState} 
          levelIndex={levelIndex} 
          onStateChange={handleStateChange} 
        />
        
        <AppUI 
          gameState={gameState}
          stats={stats}
          highScore={highScore}
          onStart={handleStart}
          onRestart={handleRestart}
          onNextLevel={handleNextLevel}
        />
      </div>

      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[#0a0f1d]" />
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900/50 via-transparent to-slate-950" />
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-slate-400/5 blur-[150px] rounded-full" />
      </div>
    </div>
  );
}
