export enum Tools {
  selection = 'selection',
  rectangle = 'rectangle',
  line = 'line',
  pencil = 'pencil',
  erease = 'erease',
  text = 'text',
  boundingBox = 'boundingBox',
  pan = 'pan',
  ImportImage = 'ImportImage',
}

export interface BoundingBox {
  id: string;
  start: { x: number; y: number };
  end: { x: number; y: number };
  title: string;
  color?: string;
  deleteIconBounds?: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
}

export type ToolsType = Tools;
// export type ToolsType = keyof typeof Tools;

// Add a cursor mapping
// export const ToolCursors: Record<Tools, string> = {
//   selection: 'move',
//   pan: 'grab',
//   rectangle: 'crosshair',
//   line: 'crosshair',
//   pencil: 'crosshair',
//   erease: 'crosshair',
//   text: 'text',
//   boundingBox: 'crosshair',
//   ImportImage: 'default'
// };
export type ActionsType =
  | 'none'
  | 'drawing'
  | 'moving'
  | 'writing'
  | 'resizing'
  | 'panning'
  | 'multi_moving'
  | 'selection';

export interface PointType {
  x: number;
  y: number;
}

export interface ElementType {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  type: ToolsType;
  points?: PointType[];
  text?: string;
  position?: string;
}

export interface SelectedElementType extends ElementType {
  offsetX?: number;
  offsetY?: number;
  xOffsets?: number[];
  yOffsets?: number[];
}

export interface ExtendedElementType extends ElementType {
  xOffsets?: number[];
  yOffsets?: number[];
}
export interface DrawingElement {
  type:
    | 'pencil'
    | 'rectangle'
    | 'line'
    | 'erease'
    | 'image'
    | 'boundingBox'
    | 'text'
    | 'pan';
  data: {
    startPoint?: any;
    endPoint?: any;
    path?: PointType[];
    start?: PointType;
    end?: PointType;
    color?: string;
    lineWidth?: number;
    eraseRadius?: number;
    image?: HTMLImageElement;
    position?: PointType;
    size?: { width: number; height: number };
    text?: string;
    id?: string;
    font?: string;
  };
}
export interface TextElement {
  id: string;
  text: string;
  position: PointType;
  font: string;
  color: string;
  isSelected: boolean;
}
