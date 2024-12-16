import { ElementType } from "types";
import { adjustElementCoordinates } from "./adjust-element-coordinates";
import { pointLineDistance } from "./pointLineDistance";

export const isPointInsideElement = (x: number, y: number, element: ElementType) => {
    if (element.type === "rectangle") {
      const { x1, y1, x2, y2 } = adjustElementCoordinates(element);
      return x >= x1 && x <= x2 && y >= y1 && y <= y2;
    } else if (element.type === "line") {
      const { x1, y1, x2, y2 } = element;
      const a = { x: x1, y: y1 };
      const b = { x: x2, y: y2 };
      const c = { x, y };
      const dist = pointLineDistance(a, b, c);
      return dist < 5; // Tolerance for line proximity
    } else if (element.type === "pencil" && element.points) {
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