export interface HistoryAction {
    type: string;
    data: any;
  }
  import { PointType } from '../types/draw-types';
  
  export interface BaseHistoryAction {
    type: string;
    data: any;
  }
  
  export interface PencilDrawAction extends BaseHistoryAction {
    type: 'pencil';
    data: {
      path: PointType[];
      color: string;
      lineWidth: number;
    };
  }
  
  export interface ImageUploadAction extends BaseHistoryAction {
    type: 'imageUpload';
    data: {
      image: HTMLImageElement;
      position: { x: number; y: number };
      size: { width: number; height: number };
    };
  }