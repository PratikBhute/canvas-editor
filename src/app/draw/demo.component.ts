// import {
//     Component,
//     ElementRef,
//     HostListener,
//     OnInit,
//     ViewChild,
//   } from '@angular/core';
//   import { CommonModule } from '@angular/common';
//   import {
//     ActionsType,
//     DrawingElement,
//     ElementType,
//     PointType,
//     Tools,
//     ToolsType,
//   } from '../types/draw-types';
//   import { HistoryService } from '../services/history.service';
//   import { ControlPanelComponent } from '../control-panel/control-panel.component';
//   import { ActionBarComponent } from '../action-bar/action-bar.component';
  
//   @Component({
//     selector: 'app-draw',
//     standalone: true,
//     imports: [CommonModule, ControlPanelComponent, ActionBarComponent],
//     templateUrl: './draw.component.html',
//     styleUrls: ['./draw.component.css'],
//   })
//   export class AppDrawComponent implements OnInit {
//     currentScale: number | undefined;
//     selectedTool: any;
//     onImageUpload: any;
  
//     @ViewChild('canvas', { static: true })
//     canvasRef!: ElementRef<HTMLCanvasElement>;
//     @ViewChild('textArea', { static: false })
    
//     textAreaRef!: ElementRef<HTMLTextAreaElement>;
//     // Panning properties
//     isPanning = false;
//     selectedImageElement: DrawingElement | null = null;
//     tool: ToolsType = Tools.selection;
//     isDrawing = false;
//     drawPath: PointType[] = [];
//     pencilColor = '#000000'; // Default black
//     pencilLineWidth = 2;
//     eraseRadius = 20;
//     // Rectangle drawing properties
//     startPoint: PointType | null = null;
  
//     // Line drawing properties
//     lineStartPoint: PointType | null = null;
//     private drawingElements: DrawingElement[] = [];
//     private previewCtx: CanvasRenderingContext2D | null = null;
//     private ctx: CanvasRenderingContext2D | null = null;
//     selectedImage: string | null = null;
//     initialTool: ToolsType = Tools.selection;
//     panOffset = { x: 0, y: 0 };
//     startPanMousePosition = { x: 0, y: 0 };
//     action: ActionsType = 'none';
//     selectedElement: ElementType | null = null;
//     scale = 1;
//     selectedElements: ElementType[] = [];
//     multiSelectedElements: ElementType[] = [];
//     // multiSelectAction: ActionsType = '';
//     startMultiSelectPanMousePosition: PointType = { x: 0, y: 0 };
//     uploadedImage: HTMLImageElement | null = null;
//     uploadedImagePosition: PointType = { x: 50, y: 0 };
//     uploadedImageSize = { width: 800, height: 550 };
//     // boundingBoxes: BoundingBox[] = [];
//     // currentBox: Partial<BoundingBox> | null = null;
//     isDragging = false;
//     editingImage: HTMLImageElement | null = null;
  
//     // History management
//     private actionHistory: DrawingElement[][] = [];
//     private currentHistoryIndex = -1;
  
//     constructor(private historyService: HistoryService) {
//       this.tool = this.initialTool;
//     }
  
//     ngOnInit() {
//       this.setupCanvas();
//       this.setupUndoRedoListener();
//       this.setupEventListeners();
//     }
//     private setupEventListeners() {
//       // Remove previous listener and replace with more comprehensive one
//       window.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
//     }
  
//     private setupCanvas() {
//       const previewCanvas = document.createElement('canvas');
//       const canvas = this.canvasRef.nativeElement;
//       this.ctx = canvas.getContext('2d')!;
//       canvas.width = window.innerWidth;
//       canvas.height = window.innerHeight;
//       this.previewCtx = previewCanvas.getContext('2d')!;
//     }
  
//     private setupUndoRedoListener() {
//       window.addEventListener('keydown', this.handleUndoRedo);
//     }
  
//     private clearPreview() {
//       if (!this.previewCtx) return;
//       this.previewCtx.clearRect(
//         0,
//         0,
//         this.previewCtx.canvas.width,
//         this.previewCtx.canvas.height
//       );
//     }
  
//     private drawAllElements() {
//       if (!this.ctx) return;
  
//       // Clear the canvas
//       this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
//       // Apply scaling and drawing logic
//       this.ctx.save();
//       this.ctx.scale(this.scale, this.scale);
//       // Redraw all saved elements
//       this.drawingElements.forEach((element) => {
//         this.ctx!.beginPath();
//         this.ctx!.strokeStyle = element.data.color || '#000000';
//         this.ctx!.lineWidth = element.data.lineWidth || 2;
//         this.ctx!.lineCap = 'round';
//         this.ctx!.lineJoin = 'round';
  
//         switch (element.type) {
//           case 'pencil':
//             if (element.data.path && element.data.path.length > 1) {
//               this.ctx!.moveTo(element.data.path[0].x, element.data.path[0].y);
//               element.data.path.slice(1).forEach((point) => {
//                 this.ctx!.lineTo(point.x, point.y);
//               });
//               this.ctx!.stroke();
//             }
//             break;
//           case 'rectangle':
//             if (element.data.start && element.data.end) {
//               const width = element.data.end.x - element.data.start.x;
//               const height = element.data.end.y - element.data.start.y;
//               this.ctx!.strokeRect(
//                 element.data.start.x,
//                 element.data.start.y,
//                 width,
//                 height
//               );
//             }
//             break;
//           case 'line':
//             if (element.data.start && element.data.end) {
//               this.ctx!.moveTo(element.data.start.x, element.data.start.y);
//               this.ctx!.lineTo(element.data.end.x, element.data.end.y);
//               this.ctx!.stroke();
//             }
//             break;
//           case 'erease':
//             if (element.data.path) {
//               this.ctx!.globalCompositeOperation = 'destination-out';
//               this.ctx!.beginPath();
//               element.data.path.forEach((point, index) => {
//                 if (index === 0) {
//                   this.ctx!.moveTo(point.x, point.y);
//                 } else {
//                   this.ctx!.lineTo(point.x, point.y);
//                 }
//                 this.ctx!.lineWidth = (element.data.eraseRadius || 10) * 2;
//                 this.ctx!.lineCap = 'round';
//                 this.ctx!.lineJoin = 'round';
//               });
//               this.ctx!.stroke();
//               this.ctx!.globalCompositeOperation = 'source-over';
//             }
//             break;
//           case 'image':
//             this.drawImageElement(element);
//             break;
//         }
//       });
//       this.ctx.restore();
//     }
  
//     private handleUndoRedo = (event: KeyboardEvent) => {
//       if (event.ctrlKey || event.metaKey) {
//         if (event.key === 'z') {
//           event.shiftKey ? this.redo() : this.undo();
//         } else if (event.key === 'y') {
//           this.redo();
//         }
//       }
//     };
  
//     // Most of the methods from the React component will be converted similarly
//     // I'll show a few key methods to illustrate the conversion
  
    // getMouseCoordinates(event: MouseEvent) {
    //   const canvas = this.canvasRef.nativeElement;
    //   const rect = canvas.getBoundingClientRect();
    //   const scaleX = canvas.width / rect.width;
    //   const scaleY = canvas.height / rect.height;
  
    //   const mouseX = (event.clientX - rect.left) * scaleX;
    //   const mouseY = (event.clientY - rect.top) * scaleY;
  
    //   const adjustedX = (mouseX - this.panOffset.x) / this.scale;
    //   const adjustedY = (mouseY - this.panOffset.y) / this.scale;
  
    //   return { clientX: adjustedX, clientY: adjustedY };
    // }
  
//     private drawImageElement(element: DrawingElement) {
//       if (!this.ctx || !element.data.image || !element.data.position) return;
  
//       const { image, position, size } = element.data;
//       this.ctx.drawImage(
//         image,
//         position.x,
//         position.y,
//         size?.width || image.width,
//         size?.height || image.height
//       );
//     }
  
//     handleImageUpload(file: File) {
//       const reader = new FileReader();
//       reader.onload = (e: any) => {
//         const uploadedImage = new Image();
//         uploadedImage.onload = () => {
//           // Create a new image drawing element
//           const imageElement: DrawingElement = {
//             type: 'image',
//             data: {
//               image: uploadedImage,
//               position: { x: 50, y: 50 }, // Default position
//               size: {
//                 width: Math.min(uploadedImage.width, this.ctx!.canvas.width / 2),
//                 height: Math.min(
//                   uploadedImage.height,
//                   this.ctx!.canvas.height / 2
//                 ),
//               },
//             },
//           };
  
//           // Add to drawing elements
//           this.drawingElements.push(imageElement);
  
//           // Redraw canvas
//           this.drawAllElements();
  
//           // Save to history
//           this.finishDrawing();
//         };
//         uploadedImage.src = e.target.result as string;
//       };
//       reader.readAsDataURL(file);
//     }
  
//     // Restore state from history
//     private restoreHistoryState() {
//       if (
//         this.currentHistoryIndex >= 0 &&
//         this.currentHistoryIndex < this.actionHistory.length
//       ) {
//         // Restore the drawing elements from history
//         this.drawingElements = JSON.parse(
//           JSON.stringify(this.actionHistory[this.currentHistoryIndex])
//         );
  
//         // Redraw all elements
//         this.drawAllElements();
//       }
//     }
//     // Save current state to history
//     private saveToHistory() {
//       // Remove any redo states if we're adding a new action
//       this.actionHistory = this.actionHistory.slice(
//         0,
//         this.currentHistoryIndex + 1
//       );
  
//       // Deep clone the current drawing elements
//       const currentState = JSON.parse(JSON.stringify(this.drawingElements));
  
//       this.actionHistory.push(currentState);
//       this.currentHistoryIndex++;
//     }
  
//     private handleGlobalKeydown(event: KeyboardEvent) {
//       // Undo: Ctrl+Z
//       if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
//         event.preventDefault();
//         this.undo();
//       }
  
//       // Redo: Ctrl+Y or Ctrl+Shift+Z
//       if (
//         (event.ctrlKey || event.metaKey) &&
//         (event.key === 'y' || (event.key === 'z' && event.shiftKey))
//       ) {
//         event.preventDefault();
//         this.redo();
//       }
//     }
//     private finishDrawing() {
//       // Call this method after completing any drawing action
//       this.saveToHistory();
//     }
  
//     private startErasing(x: number, y: number) {
//       this.isDrawing = true;
//       this.drawPath = [{ x, y }];
  
//       if (!this.ctx) return;
//       this.ctx.beginPath();
//       this.ctx.globalCompositeOperation = 'destination-out';
//       this.ctx.lineWidth = this.eraseRadius * 2;
//       this.ctx.lineCap = 'round';
//       this.ctx.lineJoin = 'round';
//       this.ctx.moveTo(x, y);
//     }
  
//     private startPencilDrawing(x: number, y: number) {
//       this.isDrawing = true;
//       this.drawPath = [{ x, y }];
  
//       if (!this.ctx) return;
//       this.ctx.beginPath();
//       this.ctx.moveTo(x, y);
//       this.ctx.strokeStyle = this.pencilColor;
//       this.ctx.lineWidth = this.pencilLineWidth;
//       this.ctx.lineCap = 'round';
//       this.ctx.lineJoin = 'round';
//     }
//     private startRectangleDrawing(x: number, y: number) {
//       this.isDrawing = true;
//       this.startPoint = { x, y };
//     }
//     private startLineDrawing(x: number, y: number) {
//       this.isDrawing = true;
//       this.drawPath = [{ x, y }];
//       this.lineStartPoint = { x, y };
//       this.drawPath.push({ x, y });
//     }
  
//     private continuePencilDrawing(x: number, y: number) {
//       if (!this.ctx || !this.isDrawing) return;
  
//       this.drawPath.push({ x, y });
//       this.ctx.lineTo(x, y);
//       this.ctx.stroke();
//     }
  
//     private drawRectanglePreview(x: number, y: number) {
//       if (!this.ctx || !this.startPoint) return;
//       // Clear previous preview
//       this.clearPreview();
//       // Redraw all existing elements on preview canvas
//       this.drawAllElements();
//       const width = x - this.startPoint.x;
//       const height = y - this.startPoint.y;
//       this.ctx.strokeStyle = this.pencilColor;
//       this.ctx.lineWidth = this.pencilLineWidth;
//       this.ctx.strokeRect(this.startPoint.x, this.startPoint.y, width, height);
//     }
//     private drawLinePreview(x: number, y: number) {
//       if (!this.ctx || !this.lineStartPoint) return;
//       // Redraw all existing elements on preview canvas
//       this.drawAllElements();
//       // Draw preview line
//       this.ctx.beginPath();
//       this.ctx.moveTo(this.lineStartPoint.x, this.lineStartPoint.y);
//       this.ctx.lineTo(x, y);
//       this.ctx.strokeStyle = this.pencilColor;
//       this.ctx.lineWidth = this.pencilLineWidth;
//       this.ctx.stroke();
//     }
//     private finishPencilDrawing(x: number, y: number) {
//       if (!this.ctx) return;
//       this.drawPath.push({ x, y });
//       this.ctx.lineTo(x, y);
//       this.ctx.stroke();
//       // this.ctx.closePath();
//       // Save the drawing element
//       this.drawingElements.push({
//         type: 'pencil',
//         data: {
//           path: this.drawPath,
//           color: this.pencilColor,
//           lineWidth: this.pencilLineWidth,
//         },
//       });
//       // Add to history
//       this.historyService.addAction({
//         type: 'pencil',
//         data: {
//           path: this.drawPath,
//           color: this.pencilColor,
//           lineWidth: this.pencilLineWidth,
//         },
//       });
//       this.drawAllElements();
//       // Save to history after drawing
//       this.finishDrawing();
//     }
  
//     private finishRectangleDrawing(x: number, y: number) {
//       if (!this.ctx || !this.startPoint) return;
  
//       const width = x - this.startPoint.x;
//       const height = y - this.startPoint.y;
  
//       this.ctx.strokeStyle = this.pencilColor;
//       this.ctx.lineWidth = this.pencilLineWidth;
//       this.ctx.strokeRect(this.startPoint.x, this.startPoint.y, width, height);
  
//       // Save the drawing element
//       this.drawingElements.push({
//         type: 'rectangle',
//         data: {
//           start: this.startPoint,
//           end: { x, y },
//           color: this.pencilColor,
//           lineWidth: this.pencilLineWidth,
//         },
//       });
//       // Add to history
//       this.historyService.addAction({
//         type: 'rectangle',
//         data: {
//           start: this.startPoint,
//           end: { x, y },
//           color: this.pencilColor,
//           lineWidth: this.pencilLineWidth,
//         },
//       });
  
//       // Redraw all elements to ensure persistence
//       this.drawAllElements();
//       // Save to history after drawing
//       this.finishDrawing();
//     }
//     private finishLineDrawing(x: number, y: number) {
//       if (!this.ctx || !this.lineStartPoint) return;
//       this.clearPreview();
//       // Redraw all existing elements
//       this.drawAllElements();
//       this.ctx.beginPath();
//       this.ctx.moveTo(this.lineStartPoint.x, this.lineStartPoint.y);
//       this.ctx.lineTo(x, y);
//       this.ctx.strokeStyle = this.pencilColor;
//       this.ctx.lineWidth = this.pencilLineWidth;
//       // this.ctx.stroke();
  
//       // Save the drawing element
//       this.drawingElements.push({
//         type: 'line',
//         data: {
//           start: this.lineStartPoint,
//           end: { x, y },
//           color: this.pencilColor,
//           lineWidth: this.pencilLineWidth,
//         },
//       });
  
//       // Add to history
//       this.historyService.addAction({
//         type: 'line',
//         data: {
//           start: this.lineStartPoint,
//           end: { x, y },
//           color: this.pencilColor,
//           lineWidth: this.pencilLineWidth,
//         },
//       });
  
//       // Redraw all elements to ensure persistence
//       this.drawAllElements();
//       // Save to history after drawing
//       this.finishDrawing();
//     }
//     // Enhanced zoom methods
//     handleZoom(zoomDelta: number) {
//       if (zoomDelta === 0) {
//         // Reset to 100%
//         this.scale = 1;
//       } else {
//         // Adjust scale with limits
//         this.scale = Math.min(Math.max(this.scale + zoomDelta, 0.1), 20);
//       }
  
//       // Redraw canvas with new scale
//       this.drawAllElements();
//     }
  
//     onControlPanelZoom(zoomDelta: number) {
//       this.handleZoom(zoomDelta);
//     }
  
//     setPencilColor(color: string) {
//       this.pencilColor = color;
//     }
//     private continueErasing(x: number, y: number) {
//       if (!this.ctx || !this.isDrawing) return;
  
//       this.drawPath.push({ x, y });
//       this.ctx.lineTo(x, y);
//       this.ctx.stroke();
//     }
  
//     private finishErasing(x: number, y: number) {
//       if (!this.ctx) return;
  
//       this.drawPath.push({ x, y });
//       this.ctx.lineTo(x, y);
//       this.ctx.stroke();
//       this.ctx.globalCompositeOperation = 'source-over';
  
//       // Add erase action to drawing elements and history
//       this.drawingElements.push({
//         type: 'erease',
//         data: {
//           path: this.drawPath,
//           eraseRadius: this.eraseRadius,
//         },
//       });
  
//       this.historyService.addAction({
//         type: 'erase',
//         data: {
//           path: this.drawPath,
//           eraseRadius: this.eraseRadius,
//         },
//       });
  
//       // Redraw all elements to apply the erase action
//       this.drawAllElements();
//     }
//     // Method to set pencil line width
//     setPencilLineWidth(width: number) {
//       this.pencilLineWidth = width;
//     }
  
    // setTool(tool: Tools) {
    //   this.tool = tool;
    // }
  
//     handleMouseDown(event: MouseEvent) {
//       if (!this.ctx) return;
  
//       const { clientX, clientY } = this.getMouseCoordinates(event);
  
//       switch (this.tool) {
//         case Tools.pencil:
//           this.startPencilDrawing(clientX, clientY);
//           break;
//         case Tools.rectangle:
//           this.startRectangleDrawing(clientX, clientY);
//           break;
//         case Tools.line:
//           this.startLineDrawing(clientX, clientY);
//           break;
//         case Tools.erease:
//           this.startErasing(clientX, clientY);
//           break;
//         // Add cases for other tools as needed
//       }
//     }
  
//     handleMouseMove(event: MouseEvent) {
//       if (!this.ctx || !this.isDrawing) return;
  
//       const { clientX, clientY } = this.getMouseCoordinates(event);
  
//       switch (this.tool) {
//         case Tools.pencil:
//           this.continuePencilDrawing(clientX, clientY);
//           break;
//         case Tools.rectangle:
//           this.drawRectanglePreview(clientX, clientY);
//           break;
//         case Tools.line:
//           this.drawLinePreview(clientX, clientY);
//           break;
//         case Tools.erease:
//           this.continueErasing(clientX, clientY);
//           break;
//       }
//     }
  
//     handleMouseUp(event: MouseEvent) {
//       if (!this.ctx) return;
  
//       const { clientX, clientY } = this.getMouseCoordinates(event);
  
//       switch (this.tool) {
//         case Tools.pencil:
//           this.finishPencilDrawing(clientX, clientY);
//           break;
//         case Tools.rectangle:
//           this.finishRectangleDrawing(clientX, clientY);
//           break;
//         case Tools.line:
//           this.finishLineDrawing(clientX, clientY);
//           break;
//         case Tools.erease:
//           this.finishErasing(clientX, clientY);
//           break;
//       }
  
//       // Reset drawing state
//       this.isDrawing = false;
//       this.startPoint = null;
//       this.lineStartPoint = null;
//     }
  
//     // Utility methods
//     undo() {
//       if (this.currentHistoryIndex > 0) {
//         this.currentHistoryIndex--;
//         this.restoreHistoryState();
//       }
//     }
  
//     redo() {
//       if (this.currentHistoryIndex < this.actionHistory.length - 1) {
//         this.currentHistoryIndex++;
//         this.restoreHistoryState();
//       }
//     }
  
//     setEraseRadius(radius: number) {
//       this.eraseRadius = radius;
//     }
  
//     onZoom(delta: number) {
//       this.scale = Math.min(Math.max(this.scale + delta, 0.1), 20);
//     }
  
//     @HostListener('window:keydown', ['$event'])
//     handleKeyboardZoom(event: KeyboardEvent) {
//       if (event.shiftKey) {
//         if (event.key === '+' || event.key === '=') {
//           event.preventDefault();
//           this.handleZoom(0.1);
//         } else if (event.key === '-' || event.key === '_') {
//           event.preventDefault();
//           this.handleZoom(-0.1);
//         }
//       }
//     }
  
//     @HostListener('window:wheel', ['$event'])
//     handleMouseWheelZoom(event: WheelEvent) {
//       if (event.shiftKey) {
//         event.preventDefault();
  
//         // Determine zoom direction and amount
//         const zoomFactor = event.deltaY > 0 ? -0.1 : 0.1;
  
//         // Apply zoom
//         this.handleZoom(zoomFactor);
//       }
//     }
//   }