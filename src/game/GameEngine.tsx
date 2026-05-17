import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Car } from './Car';
import { Physics } from './Physics';
import { LEVELS } from './Levels';
import { GameState, GameStats, Level } from '../types';

interface GameEngineProps {
  onStateChange: (state: GameState, stats: GameStats) => void;
  gameState: GameState;
  levelIndex: number;
}

export const GameEngine: React.FC<GameEngineProps> = ({ 
  onStateChange, 
  gameState, 
  levelIndex 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<{
    car: Car | null;
    level: Level | null;
    animationFrame: number;
    lastTime: number;
    particles: Array<{x: number, y: number, vx: number, vy: number, life: number, color: string}>;
    score: number;
    timeRemaining: number;
    crashes: number;
    parkingProgress: number;
  }>({
    car: null,
    level: null,
    animationFrame: 0,
    lastTime: 0,
    particles: [],
    score: 0,
    timeRemaining: 0,
    crashes: 0,
    parkingProgress: 0,
  });

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Initialize dimensions and level
  useEffect(() => {
    const level = LEVELS[levelIndex % LEVELS.length];
    setDimensions({ width: level.width, height: level.height });

    if (gameState === 'PLAYING') {
      const car = new Car(level.startPos.x, level.startPos.y, level.startPos.angle);
      
      engineRef.current.car = car;
      engineRef.current.level = level;
      engineRef.current.timeRemaining = level.timeLimit;
      engineRef.current.particles = [];
      engineRef.current.parkingProgress = 0;
      engineRef.current.lastTime = performance.now();
    }
    
    // Initial draw
    requestAnimationFrame(() => draw());
  }, [gameState, levelIndex]);

  // Handle Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const car = engineRef.current.car;
      if (!car) return;
      switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w': car.controls.forward = true; break;
        case 'arrowdown': case 's': car.controls.backward = true; break;
        case 'arrowleft': case 'a': car.controls.left = true; break;
        case 'arrowright': case 'd': car.controls.right = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const car = engineRef.current.car;
      if (!car) return;
      switch (e.key.toLowerCase()) {
        case 'arrowup': case 'w': car.controls.forward = false; break;
        case 'arrowdown': case 's': car.controls.backward = false; break;
        case 'arrowleft': case 'a': car.controls.left = false; break;
        case 'arrowright': case 'd': car.controls.right = false; break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const createParticles = (x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      engineRef.current.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color
      });
    }
  };

  const update = useCallback((time: number) => {
    if (gameState !== 'PLAYING') return;

    const dt = (time - engineRef.current.lastTime) / 1000;
    engineRef.current.lastTime = time;

    const { car, level } = engineRef.current;
    if (!car || !level) return;

    // Timer
    engineRef.current.timeRemaining -= dt;
    if (engineRef.current.timeRemaining <= 0) {
      onStateChange('GAMEOVER', getStats());
      return;
    }

    // Update Car
    car.update();

    // Spawn Smoke if drifting
    if (car.isDrifting) {
        createParticles(car.x, car.y, 'rgba(255,255,255,0.2)', 1);
    }

    // Boundary Check
    if (car.x < 0 || car.x > level.width || car.y < 0 || car.y > level.height) {
        handleCrash(car.x, car.y);
    }

    // Collision Check
    for (const obstacle of level.obstacles) {
      if (Physics.checkCollision(car.getBounds(), obstacle)) {
        handleCrash(car.x, car.y);
        break;
      }
    }

    // Parking Check
    const overlap = Physics.getOverlapArea(car.getBounds(), level.parkingZone);
    const isStationary = Math.abs(car.speed) < 0.1;
    
    if (overlap > 0.85 && isStationary) {
      engineRef.current.parkingProgress += dt;
      if (engineRef.current.parkingProgress > 1.5) { // Needs to stay 1.5s
        const bonus = Math.floor(engineRef.current.timeRemaining * 100);
        engineRef.current.score += level.scoreBonus + bonus;
        onStateChange('SUCCESS', getStats());
      }
    } else {
      engineRef.current.parkingProgress = 0;
    }

    // Update Particles
    engineRef.current.particles = engineRef.current.particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      return p.life > 0;
    });

    // Draw
    draw();

    engineRef.current.animationFrame = requestAnimationFrame(update);
  }, [gameState, onStateChange]);

  const [shake, setShake] = useState(0);

  const handleCrash = (x: number, y: number) => {
    createParticles(x, y, '#ff0055', 20);
    setShake(10);
    engineRef.current.crashes++;
    engineRef.current.score = Math.max(0, engineRef.current.score - 500);
    
    // Reset Car
    const level = engineRef.current.level!;
    engineRef.current.car = new Car(level.startPos.x, level.startPos.y, level.startPos.angle);

    // Decay shake
    const decay = () => {
        setShake(s => {
            if (s <= 1) return 0;
            requestAnimationFrame(decay);
            return s * 0.9;
        });
    };
    decay();
  };

  const getStats = (): GameStats => ({
    score: engineRef.current.score,
    timeRemaining: Math.ceil(engineRef.current.timeRemaining),
    levelIndex,
    crashes: engineRef.current.crashes
  });

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { car, level, particles, parkingProgress } = engineRef.current;
    if (!level) return;

    // Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
    ctx.fillStyle = '#0f172a'; // Theme Slate 950
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Screen Shake
    if (shake > 0) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }

    // Grid (Professional Polish style)
    ctx.strokeStyle = 'rgba(71, 85, 105, 0.2)'; // slate-600
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    // Parking Zone
    ctx.save();
    ctx.translate(level.parkingZone.x, level.parkingZone.y);
    ctx.rotate(level.parkingZone.angle);
    ctx.strokeStyle = parkingProgress > 0 ? '#4ade80' : '#3b82f6'; // green-400 / blue-500
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.strokeRect(-level.parkingZone.width / 2, -level.parkingZone.height / 2, level.parkingZone.width, level.parkingZone.height);
    
    // Fill if progress
    if (parkingProgress > 0) {
        ctx.fillStyle = `rgba(59, 130, 246, ${Math.min(0.2, parkingProgress / 1.5)})`;
        ctx.fillRect(-level.parkingZone.width / 2, -level.parkingZone.height / 2, level.parkingZone.width, level.parkingZone.height);
    }
    ctx.restore();

    // Obstacles
    for (const obs of level.obstacles) {
      ctx.save();
      ctx.translate(obs.x, obs.y);
      ctx.rotate(obs.angle);
      
      if (obs.type === 'car') {
          ctx.fillStyle = '#1e293b'; // slate-800
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
      } else {
          ctx.fillStyle = obs.color;
          ctx.shadowBlur = 5;
          ctx.shadowColor = obs.color;
      }
      
      if (obs.type === 'cone') {
          ctx.beginPath();
          ctx.moveTo(0, -obs.height/2);
          ctx.lineTo(obs.width/2, obs.height/2);
          ctx.lineTo(-obs.width/2, obs.height/2);
          ctx.closePath();
          ctx.fill();
      } else {
          ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
          // Highlight for walls/cars
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      }
      ctx.restore();
    }

    // Car
    if (car) car.draw(ctx);

    // Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
      engineRef.current.animationFrame = requestAnimationFrame(update);
    } else {
      cancelAnimationFrame(engineRef.current.animationFrame);
    }
    return () => cancelAnimationFrame(engineRef.current.animationFrame);
  }, [gameState, update]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden select-none">
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height}
        className="max-w-full max-h-full border-4 border-cyan-500 shadow-[0_0_20px_rgba(0,242,255,0.5)]"
      />
      
      {/* HUD Overlay inside Canvas container */}
      {gameState === 'PLAYING' && (
        <header className="absolute top-0 left-0 right-0 h-20 bg-slate-900/80 border-b border-slate-700 flex items-center justify-between px-8 z-10 pointer-events-none">
          <div className="flex items-center gap-12">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold italic">Current Level</span>
              <span className="text-2xl font-black text-white">
                {String(levelIndex + 1).padStart(2, '0')} <span className="text-blue-400">/</span> {LEVELS.length}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold italic">Accumulated Score</span>
              <span className="text-2xl font-black text-yellow-400 tabular-nums">
                {engineRef.current.score.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 px-4 py-2 rounded border border-slate-700 flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${engineRef.current.timeRemaining < 10 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-green-500'}`}></div>
              <span className="font-mono text-xl font-bold tracking-tighter text-white">
                00:{String(Math.max(0, Math.ceil(engineRef.current.timeRemaining))).padStart(2, '0')}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Control Status Aside */}
      {gameState === 'PLAYING' && (
        <aside className="absolute left-6 top-24 bottom-6 w-56 flex flex-col gap-4 pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-700/50 flex flex-col gap-4 shadow-2xl">
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hull Integrity</span>
                <span className={`text-xs font-bold ${engineRef.current.crashes === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {Math.max(0, 100 - engineRef.current.crashes * 20)}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-green-500 transition-all duration-300" 
                    style={{ width: `${Math.max(0, 100 - engineRef.current.crashes * 20)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-auto bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-700/50 shadow-2xl">
            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3 text-center">Telemetry</h3>
            <div className="grid grid-cols-3 gap-2 opacity-50">
              <div className="col-start-2 w-10 h-10 border border-slate-700 rounded bg-slate-800 flex items-center justify-center text-xs font-bold">W</div>
              <div className="col-start-1 w-10 h-10 border border-slate-700 rounded bg-slate-800 flex items-center justify-center text-xs font-bold">A</div>
              <div className="col-start-2 w-10 h-10 border border-slate-700 rounded bg-slate-800 flex items-center justify-center text-xs font-bold">S</div>
              <div className="col-start-3 w-10 h-10 border border-slate-700 rounded bg-slate-800 flex items-center justify-center text-xs font-bold">D</div>
            </div>
          </div>
        </aside>
      )}

      {/* Objective Overlay */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
          <div className="bg-blue-600 px-6 py-2 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center gap-3 animate-pulse">
            <span className="text-sm font-black uppercase tracking-tighter text-white">Objective: Reach Parking Zone</span>
            <div className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
