import { ElementType } from "types";

const isInsideRectangle = (x: number, y: number, element: ElementType): boolean => {
    // Implement your logic to check if point (x, y) is inside the rectangle defined by element
    // Example implementation:
    return (
      x >= element.x1 &&
      x <= element.x2 &&
      y >= element.y1 &&
      y <= element.y2
    );
  };
  