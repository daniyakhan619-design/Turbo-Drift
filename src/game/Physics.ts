import { Rect, Vector } from '../types';

export class Physics {
  static checkCollision(rect1: Rect, rect2: Rect): boolean {
    const polygons = [this.getVertices(rect1), this.getVertices(rect2)];
    
    for (let i = 0; i < polygons.length; i++) {
        const polygon = polygons[i];
        for (let j = 0; j < polygon.length; j++) {
            const p1 = polygon[j];
            const p2 = polygon[(j + 1) % polygon.length];
            const normal = { x: -(p2.y - p1.y), y: p2.x - p1.x };
            
            const [minA, maxA] = this.project(polygons[0], normal);
            const [minB, maxB] = this.project(polygons[1], normal);
            
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }
    return true;
  }

  private static getVertices(rect: Rect): Vector[] {
    const { x, y, width, height, angle } = rect;
    const hw = width / 2;
    const hh = height / 2;
    
    // Unrotated vertices relative to center
    const points = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
    ];

    // Rotate and translate
    return points.map(p => ({
        x: x + p.x * Math.cos(angle) - p.y * Math.sin(angle),
        y: y + p.x * Math.sin(angle) + p.y * Math.cos(angle)
    }));
  }

  private static project(vertices: Vector[], axis: Vector): [number, number] {
    let min = Infinity;
    let max = -Infinity;
    for (const v of vertices) {
        const dot = v.x * axis.x + v.y * axis.y;
        if (dot < min) min = dot;
        if (dot > max) max = dot;
    }
    return [min, max];
  }

  static isPointInRect(px: number, py: number, rect: Rect): boolean {
    // Coordinate transformation to rect space
    const dx = px - rect.x;
    const dy = py - rect.y;
    const cos = Math.cos(-rect.angle);
    const sin = Math.sin(-rect.angle);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;
    
    return Math.abs(localX) <= rect.width / 2 && Math.abs(localY) <= rect.height / 2;
  }

  static getOverlapArea(rect1: Rect, rect2: Rect): number {
    // Simplified overlap check for parking accuracy
    if (!this.checkCollision(rect1, rect2)) return 0;
    
    // Check points of rect1 inside rect2
    const points = this.getVertices(rect1);
    let count = 0;
    for (const p of points) {
        if (this.isPointInRect(p.x, p.y, rect2)) count++;
    }
    return count / 4; // Returns 0 to 1
  }
}
