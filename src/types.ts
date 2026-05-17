export interface Vector {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}

export interface Obstacle extends Rect {
  type: 'wall' | 'cone' | 'car';
  color: string;
}

export interface ParkingZone extends Rect {
  id: string;
}

export interface Level {
  id: number;
  name: string;
  width: number;
  height: number;
  startPos: { x: number; y: number; angle: number };
  parkingZone: ParkingZone;
  obstacles: Obstacle[];
  timeLimit: number; // in seconds
  scoreBonus: number;
}

export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'SUCCESS' | 'GAMEOVER';

export interface GameStats {
  score: number;
  timeRemaining: number;
  levelIndex: number;
  crashes: number;
}
