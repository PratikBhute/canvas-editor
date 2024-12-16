import { Injectable } from '@angular/core';
import { ElementType, ToolsType, PointType, Tools } from '../types/draw-types';
import { adjustElementCoordinates, nearPoint } from '../../utilities';
import { pointLineDistance } from '../../utilities/pointLineDistance';

@Injectable({
  providedIn: 'root',
})
export class DrawUtilitiesService {
  createElement(
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: ToolsType
  ): ElementType {
    // Implement createElement logic from original utilities
    return {
      id,
      x1,
      y1,
      x2,
      y2,
      type,
    };
  }

  getElementAtPosition = (x: number, y: number, elements: ElementType[]) => {
    return elements
      .map((element) => ({
        ...element,
        position: this.positionWithinElement(x, y, element),
      }))
      .find((element) => element.position !== null);
  };

  positionWithinElement = (x: number, y: number, element: ElementType) => {
    const { type, x1, x2, y1, y2 } = element;
    switch (type) {
      case Tools.line: {
        const on = this.onLine(x1, y1, x2, y2, x, y);
        const start = nearPoint(x, y, x1, y1, 'start');
        const end = nearPoint(x, y, x2, y2, 'end');
        return start || end || on;
      }
      case Tools.rectangle:
      case Tools.ImportImage: {
        const topLeft = nearPoint(x, y, x1, y1, 'topLeft');
        const topRight = nearPoint(x, y, x2, y1, 'topRight');
        const bottomLeft = nearPoint(x, y, x1, y2, 'bottomLeft');
        const bottomRight = nearPoint(x, y, x2, y2, 'bottomRight');
        const inside =
          x >= x1 && x <= x2 && y >= y1 && y <= y2 ? 'inside' : null;
        return topLeft || topRight || bottomLeft || bottomRight || inside;
      }
      case Tools.pencil: {
        const betweenAnyPoint = element.points!.some((point, index) => {
          const nextPoint = element.points![index + 1];
          if (!nextPoint) return false;
          return (
            this.onLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) !=
            null
          );
        });
        return betweenAnyPoint ? 'inside' : null;
      }
      case Tools.text: {
        const inside =
          x >= x1 && x <= x2 && y >= y1 && y <= y2 ? 'inside' : null;
        return inside;
      }
      default:
        throw new Error(`Type not recognised: ${type}`);
    }
  };

  onLine = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x: number,
    y: number,
    maxDistance: number = 1
  ): string | null => {
    const a: PointType = { x: x1, y: y1 };
    const b: PointType = { x: x2, y: y2 };
    const c: PointType = { x, y };
    const offset =
      this.distance(a, b) - (this.distance(a, c) + this.distance(b, c));
    return Math.abs(offset) < maxDistance ? 'inside' : null;
  };

  isPointInsideElement = (x: number, y: number, element: ElementType) => {
    if (element.type === 'rectangle') {
      const { x1, y1, x2, y2 } = adjustElementCoordinates(element);
      return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    } else if (element.type === 'line') {
      const { x1, y1, x2, y2 } = element;
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x, y };
      const dist = pointLineDistance(a, b, c);
      return dist < 5; // Tolerance for line proximity
    } else if (element.type === 'pencil' && element.points) {
      for (let i = 0; i < element.points.length - 1; i++) {
        const a = element.points[i];
        const b = element.points[i + 1];
        const c = { x, y };
        const dist = pointLineDistance(a, b, c);
        if (dist < 5) return true; // Tolerance for pencil proximity
      }
    }
    return false;
  };

  distance = (a: PointType, b: PointType) =>
    Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

  drawElement(
    roughCanvas: any,
    context: CanvasRenderingContext2D,
    element: ElementType
  ) {
    // Implement drawing logic for different element types
  }

  cursorForPosition(position: string): string {
    // Implement cursor type based on element position
    return 'default';
  }

  resizedCoordinates(
    clientX: number,
    clientY: number,
    position: string,
    coordinates: any
  ) {
    // Implement resize coordinate calculations
    return coordinates;
  }
}
