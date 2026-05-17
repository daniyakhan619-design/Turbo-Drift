import { Rect } from '../types';

export class Car {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  speed: number = 0;
  acceleration: number = 0.2;
  friction: number = 0.98;
  maxSpeed: number = 5;
  reverseMaxSpeed: number = -2;
  steering: number = 0.04;
  lateralSlip: number = 0; // For drift feel

  // Controls
  controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  constructor(x: number, y: number, angle: number = 0) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.width = 30; // scaled
    this.height = 60;
  }

  isDrifting: boolean = false;

  update() {
    this._move();
    // Simple drift detection: turning at speed
    this.isDrifting = Math.abs(this.speed) > 2 && (this.controls.left || this.controls.right);
  }

  private _move() {
    if (this.controls.forward) {
      this.speed += this.acceleration;
    }
    if (this.controls.backward) {
      this.speed -= this.acceleration;
    }

    if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
    if (this.speed < this.reverseMaxSpeed) this.speed = this.reverseMaxSpeed;

    if (this.speed !== 0) {
      const flip = this.speed > 0 ? 1 : -1;
      // Adjust steering sensitivity based on speed (simulating realistic handling)
      const currentSteering = this.steering * (Math.abs(this.speed) / this.maxSpeed + 0.5);
      
      if (this.controls.left) {
        this.angle -= currentSteering * flip;
      }
      if (this.controls.right) {
        this.angle += currentSteering * flip;
      }
    }

    this.speed *= this.friction;
    if (Math.abs(this.speed) < 0.01) this.speed = 0;

    this.x += Math.cos(this.angle - Math.PI / 2) * this.speed;
    this.y += Math.sin(this.angle - Math.PI / 2) * this.speed;
  }

  getBounds(): Rect {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      angle: this.angle,
    };
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-this.width / 2 + 3, -this.height / 2 + 3, this.width, this.height);

    // Car Body (Professional Polish Theme)
    ctx.fillStyle = '#facc15'; // Yellow-400
    ctx.strokeStyle = '#854d0e'; // Yellow-800
    ctx.lineWidth = 2;
    
    // Main Body
    this.roundRect(ctx, -this.width / 2, -this.height / 2, this.width, this.height, 4);
    ctx.fill();
    ctx.stroke();

    // Windshield (Sleek dark glass as in theme)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'; // Slate-900
    ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 8, this.width - 4, 12);
    
    // Roof/Back window
    ctx.fillRect(-this.width / 2 + 2, this.height / 10, this.width - 4, 20);

    // Headlights
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.beginPath();
    ctx.arc(-this.width / 2 + 6, -this.height / 2 + 2, 3, 0, Math.PI * 2);
    ctx.arc(this.width / 2 - 6, -this.height / 2 + 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Tail lights
    if (this.controls.backward || this.speed < 0) {
        ctx.fillStyle = '#ff0000';
    } else {
        ctx.fillStyle = '#800000';
    }
    ctx.fillRect(-this.width / 2 + 2, this.height / 2 - 5, 8, 3);
    ctx.fillRect(this.width / 2 - 10, this.height / 2 - 5, 8, 3);

    ctx.restore();
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
