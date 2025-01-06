import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActionBarComponent } from '../action-bar/action-bar.component';
import { ControlPanelComponent } from '../control-panel/control-panel.component';
import { HistoryService } from '../services/history.service';
import {
  BoundingBox,
  DrawingElement,
  PointType,
  // ToolCursors,
  Tools,
  ToolsType
} from '../types/draw-types';

@Component({
  selector: 'app-draw',
  standalone: true,
  imports: [CommonModule, ControlPanelComponent, ActionBarComponent],
  templateUrl: './draw.component.html',
  styleUrls: ['./draw.component.css'],
})
export class AppDrawComponent implements OnInit {
  currentScale: number | undefined;
  selectedTool: any;
  onImageUpload: any;

  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  tool: ToolsType = Tools.selection;
  private isDrawing = false;
  private pencilColor = '#000000'; // Default black
  private pencilLineWidth = 3;
  private eraseRadius = 20;
  private startPoint: PointType | null = null;
  private drawPath: PointType[] = [];
  private lineStartPoint: PointType | null = null;
  private drawingElements: DrawingElement[] = [];
  private previewCtx: CanvasRenderingContext2D | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private initialTool: ToolsType = Tools.selection;
  private panOffset = { x: 0, y: 0 };
  // action: ActionsType = 'none';
  scale = 1;
  // History management
  private actionHistory: DrawingElement[][] = [];
  private currentHistoryIndex = -1;
  // Bounding Box specific properties
  private boundingBoxes: BoundingBox[] = [];
  private currentBoundingBox: BoundingBox | null = null;
  private boundingBoxColor = 'blue'; // Default red color
  //Paning Property
  private isPanning = false;
  private lastPanPosition: { x: number; y: number } | null = null;
  //  private setlastPanPosition: { x: number; y: number; };

  constructor(private historyService: HistoryService) {
    this.tool = this.initialTool;
  }

  ngOnInit() {
    this.setupCanvas();
    this.setupUndoRedoListener();
    this.setupEventListeners();
  }
  private setupEventListeners() {
    window.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
  }

  private setupCanvas() {
    const previewCanvas = document.createElement('canvas');
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.previewCtx = previewCanvas.getContext('2d')!;
  }

  private setupUndoRedoListener() {
    window.addEventListener('keydown', this.handleUndoRedo);
  }

  private smoothPath(path: PointType[], smoothingFactor: number = 0.3): PointType[] {
    if (path.length < 3) return path; // No smoothing needed for less than 3 points
  
    const smoothedPath: PointType[] = [];
    smoothedPath.push(path[0]); // Keep the first point
  
    for (let i = 1; i < path.length - 1; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const next = path[i + 1];
  
      // Calculate control points
      const controlPoint1 = {
        x: curr.x + smoothingFactor * (next.x - prev.x),
        y: curr.y + smoothingFactor * (next.y - prev.y),
      };
  
      const controlPoint2 = {
        x: next.x - smoothingFactor * (next.x - prev.x),
        y: next.y - smoothingFactor * (next.y - prev.y),
      };
  
      // Add a smoothed curve
      smoothedPath.push(controlPoint1, controlPoint2, next);
    }
  
    return smoothedPath;
  }
  

  private drawAllElements() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
   
    this.ctx.save();
    // Apply scale first, then translation
    this.ctx.translate(this.panOffset.x, this.panOffset.y);
    this.ctx.scale(this.scale, this.scale);
    // Redraw all saved elements
    this.drawingElements.forEach((element) => {
      this.ctx!.beginPath();
      this.ctx!.strokeStyle = element.data.color || '#000000';
      this.ctx!.lineWidth = element.data.lineWidth || 2;
      this.ctx!.lineCap = 'round';
      this.ctx!.lineJoin = 'round';

      switch (element.type) {
        case 'pencil':
          if (element.data.path && element.data.path.length > 1) {
            this.ctx!.moveTo(element.data.path[0].x, element.data.path[0].y);
            element.data.path.slice(1).forEach((point) => {
              this.ctx!.lineTo(point.x, point.y);
            });
            this.ctx!.stroke();
          }
          break;
        case 'rectangle':
          if (element.data.start && element.data.end) {
            const width = element.data.end.x - element.data.start.x;
            const height = element.data.end.y - element.data.start.y;
            this.ctx!.strokeRect(
              element.data.start.x,
              element.data.start.y,
              width,
              height
            );
          }
          break;
        case 'line':
          if (element.data.start && element.data.end) {
            this.ctx!.moveTo(element.data.start.x, element.data.start.y);
            this.ctx!.lineTo(element.data.end.x, element.data.end.y);
            this.ctx!.stroke();
          }
          break;
        case 'erease':
          if (element.data.path) {
            this.ctx!.globalCompositeOperation = 'destination-out';
            this.ctx!.beginPath();
            element.data.path.forEach((point, index) => {
              if (index === 0) {
                this.ctx!.moveTo(point.x, point.y);
              } else {
                this.ctx!.lineTo(point.x, point.y);
              }
              this.ctx!.lineWidth = (element.data.eraseRadius || 10) * 2;
              this.ctx!.lineCap = 'round';
              this.ctx!.lineJoin = 'round';
            });
            this.ctx!.stroke();
            this.ctx!.globalCompositeOperation = 'source-over';
          }
          break;
        case 'image':
          this.drawImageElement(element);
          break;
        case 'boundingBox':
          this.drawBoundingBox(element.data as BoundingBox);
          break;
      }
    });

    // Draw additional bounding boxes
    this.boundingBoxes.forEach((bbox) => {
      this.drawBoundingBox(bbox);
    });
    this.ctx.restore();
  }

  // Optional: Methods to manage bounding boxes
  deleteBoundingBox(id: string) {
    const index = this.boundingBoxes.findIndex((bbox) => bbox.id === id);
    if (index !== -1) {
      this.boundingBoxes.splice(index, 1);
      this.drawAllElements();
      this.finishDrawing();
    }
  }
  getBoundingBoxes() {
    return this.boundingBoxes;
  }

  private handleUndoRedo = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      if (event.key === 'z') {
        event.shiftKey ? this.redo() : this.undo();
      } else if (event.key === 'y') {
        this.redo();
      }
    }
  };

  getMouseCoordinates(event: MouseEvent) {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Calculate the scaling factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Raw mouse position on canvas (without scaling)
    const rawMouseX = (event.clientX - rect.left) * scaleX;
    const rawMouseY = (event.clientY - rect.top) * scaleY;

    // Adjust for pan and scale
    // const adjustedX = (rawMouseX - this.panOffset.x) / this.scale;
    // const adjustedY = (rawMouseY - this.panOffset.y) / this.scale;

    // Adjust for both pan and zoom
    const adjustedX = rawMouseX / this.scale - this.panOffset.x / this.scale;
    const adjustedY = rawMouseY / this.scale - this.panOffset.y / this.scale;

    // console.log('Mouse Coordinates Diagnostic:', {
    //   clientX: event.clientX,
    //   clientY: event.clientY,
    //   rectLeft: rect.left,
    //   rectTop: rect.top,
    //   scaleX: scaleX,
    //   scaleY: scaleY,
    //   rawMouseX: rawMouseX,
    //   rawMouseY: rawMouseY,
    //   panOffsetX: this.panOffset.x,
    //   panOffsetY: this.panOffset.y,
    //   currentScale: this.scale,
    //   adjustedX: adjustedX,
    //   adjustedY: adjustedY,
    // });

    return { clientX: adjustedX, clientY: adjustedY };
  }

  private drawImageElement(element: DrawingElement) {
    if (!this.ctx || !element.data.image || !element.data.position) return;

    const { image, position, size } = element.data;
    this.ctx.drawImage(
      image,
      position.x,
      position.y,
      size?.width || image.width,
      size?.height || image.height
    );
  }

  // Restore state from history
  private restoreHistoryState() {
    if (
      this.currentHistoryIndex >= 0 &&
      this.currentHistoryIndex < this.actionHistory.length
    ) {
      // Restore the drawing elements from history
      this.drawingElements = JSON.parse(
        JSON.stringify(this.actionHistory[this.currentHistoryIndex])
      );

      // Redraw all elements
      this.drawAllElements();
    }
  }
  // Save current state to history
  private saveToHistory() {
    // Remove any redo states if we're adding a new action
    this.actionHistory = this.actionHistory.slice(
      0,
      this.currentHistoryIndex + 1
    );
    // Deep clone the current drawing elements
    const currentState = JSON.parse(JSON.stringify(this.drawingElements));
    this.actionHistory.push(currentState);
    this.currentHistoryIndex++;
  }

  private handleGlobalKeydown(event: KeyboardEvent) {
  
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
      event.preventDefault();
      this.undo();
    }

    // Redo: Ctrl+Y or Ctrl+Shift+Z
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === 'y' || (event.key === 'z' && event.shiftKey))
    ) {
      event.preventDefault();
      this.redo();
    }
  }

  // Call saving method
  private finishDrawing() {
    // Call this method after completing any drawing action
    this.saveToHistory();
  }

  private startErasing(x: number, y: number) {
    this.isDrawing = true;
    this.drawPath = [{ x, y }];

    if (!this.ctx) return;
    // Save the context and apply transformations
    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(
      this.panOffset.x / this.scale,
      this.panOffset.y / this.scale
    );
    if (!this.ctx) return;
    this.ctx.beginPath();
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.lineWidth = (this.eraseRadius * 2) / this.scale;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.moveTo(x, y);
  }

  //  Start Continue and finish Method for Line
  private startLineDrawing(x: number, y: number) {
    this.isDrawing = true;
    this.lineStartPoint = { x, y };

    if (!this.ctx) return;

    // Don't apply transformations here since coordinates are already adjusted
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.pencilColor;
    this.ctx.lineWidth = this.pencilLineWidth / this.scale;
    this.ctx.lineCap = 'round';
  }
  //Continue
  private drawLinePreview(x: number, y: number) {
    if (!this.ctx || !this.lineStartPoint) return;

    this.drawAllElements();

    this.ctx.save();

    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(
      this.panOffset.x / this.scale,
      this.panOffset.y / this.scale
    );
    this.ctx.beginPath();
    this.ctx.moveTo(this.lineStartPoint.x, this.lineStartPoint.y);
    this.ctx.lineTo(x, y);
    this.ctx.strokeStyle = this.pencilColor;
    this.ctx.lineWidth = this.pencilLineWidth / this.scale;
    this.ctx.lineCap = 'round';
    this.ctx.stroke();

    // Restore context state
    this.ctx.restore();
  }
  // Finish
  private finishLineDrawing(x: number, y: number) {
    if (!this.ctx || !this.lineStartPoint) return;

    // Add the line to drawing elements
    this.drawingElements.push({
      type: 'line',
      data: {
        start: this.lineStartPoint,
        end: { x, y },
        color: this.pencilColor,
        lineWidth: this.pencilLineWidth,
      },
    });

    // Add to history
    this.historyService.addAction({
      type: 'line',
      data: {
        start: this.lineStartPoint,
        end: { x, y },
        color: this.pencilColor,
        lineWidth: this.pencilLineWidth,
      },
    });

    // Redraw all elements
    this.drawAllElements();

    // Save to history
    this.finishDrawing();
  }
 //  Start Continue and Finish Method for Pencil Sketch
  private startPencilDrawing(x: number, y: number) {
    this.isDrawing = true;
    this.drawPath = [{ x, y }];

    if (!this.ctx) return;
    // Draw directly in the scaled and panned context
    this.ctx.save();
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(
      this.panOffset.x / this.scale,
      this.panOffset.y / this.scale
    );
    //
    this.ctx.beginPath();
    // this.ctx.moveTo(x, y);
    // this.ctx.strokeStyle = this.pencilColor;
    // this.ctx.lineWidth = this.pencilLineWidth / this.scale;
    // this.ctx.lineCap = 'square';
    // this.ctx.lineJoin = 'round';
  }
  private continuePencilDrawing(x: number, y: number) {
    if (!this.ctx || !this.isDrawing) return;

    this.drawPath.push({ x, y });
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }
  
  private finishPencilDrawing(x: number, y: number) {
    if (!this.ctx) return;
    this.drawPath.push({ x, y });
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.restore();
    // this.ctx.closePath();
    // Save the drawing element
    this.drawingElements.push({
      type: 'pencil',
      data: {
        path: this.drawPath,
        color: this.pencilColor,
        lineWidth: this.pencilLineWidth,
      },
    });
    // Add to history
    this.historyService.addAction({
      type: 'pencil',
      data: {
        path: this.drawPath,
        color: this.pencilColor,
        lineWidth: this.pencilLineWidth,
      },
    });
    this.drawAllElements();
    // Save to history after drawing
    this.finishDrawing();
  }

   //  Start Continue and finish Method for Rectangle
  private startRectangleDrawing(x: number, y: number) {
    this.isDrawing = true;
    this.startPoint = { x, y };

    if (!this.ctx) return;
    // Don't apply transformations here since coordinates are already adjusted
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.pencilColor;
    this.ctx.lineWidth = this.pencilLineWidth / this.scale;
  }
  private drawRectanglePreview(x: number, y: number) {
    if (!this.ctx || !this.startPoint) return;

    // Clear and redraw existing elements
    this.drawAllElements();

    // Save current context state
    this.ctx.save();

    // Apply transformations
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(
      this.panOffset.x / this.scale,
      this.panOffset.y / this.scale
    );

    const width = x - this.startPoint.x;
    const height = y - this.startPoint.y;

    this.ctx.strokeStyle = this.pencilColor;
    this.ctx.lineWidth = this.pencilLineWidth / this.scale;
    this.ctx.strokeRect(this.startPoint.x, this.startPoint.y, width, height);

    // Restore context state
    this.ctx.restore();
  }
  private finishRectangleDrawing(x: number, y: number) {
    if (!this.ctx || !this.startPoint) return;

    // Add the rectangle to drawing elements
    this.drawingElements.push({
      type: 'rectangle',
      data: {
        start: this.startPoint,
        end: { x, y },
        color: this.pencilColor,
        lineWidth: this.pencilLineWidth,
      },
    });

    // Redraw all elements to ensure persistence
    this.drawAllElements();

    // Save to history after drawing
    this.finishDrawing();
  }
  //  Start Continue and finish Method for Line Bounding Box
  private startBoundingBoxDrawing(x: number, y: number) {
    this.isDrawing = true;
    this.currentBoundingBox = {
      id: `bbox-${Date.now()}`,
      start: { x, y },
      end: { x, y },
      title: '',
    };

    if (!this.ctx) return;
    // Don't apply transformations here since coordinates are already adjusted
    this.ctx.beginPath();
    this.ctx.strokeStyle = this.boundingBoxColor;
    this.ctx.lineWidth = 2 / this.scale;
  }

  private drawBoundingBox(bbox: BoundingBox) {
    if (!this.ctx) return;

    const width = bbox.end.x - bbox.start.x;
    const height = bbox.end.y - bbox.start.y;

    // Draw rectangle
    this.ctx.strokeStyle = bbox.color || this.boundingBoxColor;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(bbox.start.x, bbox.start.y, width, height);

    // Draw title
    this.ctx.fillStyle = bbox.color || this.boundingBoxColor;
    this.ctx.font = '23px Arial';
    this.ctx.fillText(bbox.title, bbox.start.x, bbox.start.y - 8);
    // Draw delete cross icon
    const crossSize = 15;
    const padding = 8;
    const circleRadius = 9;
    const crossX = bbox.end.x - circleRadius + padding;
    const crossY = bbox.start.y - circleRadius;

    // Draw circular background
    this.ctx.beginPath();
    this.ctx.fillStyle = 'red'; // Light red background
    this.ctx.arc(crossX, crossY, circleRadius, 0, 2 * Math.PI);
    this.ctx.fill();

    // Draw cross lines
    this.ctx.beginPath();
    this.ctx.fillStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.fillText('X', crossX - padding, crossY + padding);
    this.ctx.stroke();

    // Store cross icon coordinates for click detection
    bbox.deleteIconBounds = {
      x1: crossX - circleRadius,
      y1: crossY - circleRadius,
      x2: crossX + circleRadius,
      y2: crossY + circleRadius,
    };
  }

  private drawBoundingBoxPreview(x: number, y: number) {
    if (!this.ctx || !this.currentBoundingBox) return;

    // Clear and redraw existing elements
    this.drawAllElements();

    // Save current context state
    this.ctx.save();

    // Apply transformations
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(
      this.panOffset.x / this.scale,
      this.panOffset.y / this.scale
    );

    const width = x - this.currentBoundingBox.start.x;
    const height = y - this.currentBoundingBox.start.y;

    // Draw bounding box preview
    this.ctx.strokeStyle = this.boundingBoxColor;
    this.ctx.lineWidth = 2 / this.scale;
    this.ctx.strokeRect(
      this.currentBoundingBox.start.x,
      this.currentBoundingBox.start.y,
      width,
      height
    );

    // Restore context state
    this.ctx.restore();
  }

  private finishBoundingBoxDrawing(x: number, y: number) {
    if (!this.ctx || !this.currentBoundingBox) return;

    // Ensure end point is set
    this.currentBoundingBox.end = { x, y };

    // Prompt for title with a default
    const title =
      prompt('Enter bounding box title:') ||
      `Bounding Box ${this.boundingBoxes.length + 1}`;

    // Update the current bounding box with title
    this.currentBoundingBox.title = title;

    // Add to bounding boxes array
    this.boundingBoxes.push(this.currentBoundingBox);

    // Add to drawing elements for history
    this.drawingElements.push({
      type: 'boundingBox',
      data: this.currentBoundingBox,
    });

    // Redraw all elements
    this.drawAllElements();

    // Save to history
    this.finishDrawing();

    // Reset current bounding box
    this.currentBoundingBox = null;
    this.isDrawing = false;
  }

  // Method to check if a point is inside the bounding box delete icon
  private isClickOnDeleteIcon(
    bbox: BoundingBox,
    x: number,
    y: number
  ): boolean {
    if (!bbox.deleteIconBounds) return false;

    // Calculate distance from click point to circle center
    const circleX = (bbox.deleteIconBounds.x1 + bbox.deleteIconBounds.x2) / 2;
    const circleY = (bbox.deleteIconBounds.y1 + bbox.deleteIconBounds.y2) / 2;
    const radius = (bbox.deleteIconBounds.x2 - bbox.deleteIconBounds.x1) / 2;

    const distance = Math.sqrt(
      Math.pow(x - circleX, 2) + Math.pow(y - circleY, 2)
    );

    return distance <= radius;
  }
  private continueErasing(x: number, y: number) {
    if (!this.ctx || !this.isDrawing) return;
    this.drawPath.push({ x, y });
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
  }

  private finishErasing(x: number, y: number) {
    if (!this.ctx) return;

    this.drawPath.push({ x, y });
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    this.ctx.restore();
    this.ctx.globalCompositeOperation = 'source-over';

    this.drawingElements.push({
      type: 'erease',
      data: {
        path: this.drawPath,
        eraseRadius: this.eraseRadius,
      },
    });

    this.historyService.addAction({
      type: 'erase',
      data: {
        path: this.drawPath,
        eraseRadius: this.eraseRadius,
      },
    });

    // Redraw all elements to apply the erase action
    this.drawAllElements();
  }

  handleMouseDown(event: MouseEvent) {
    if (!this.ctx) return;
    const { clientX, clientY } = this.getMouseCoordinates(event);

    if (this.tool === Tools.pan || event.shiftKey) {
      // event.preventDefault();
      this.canvasRef.nativeElement.style.cursor = 'grabbing';
      this.isPanning = true;
      this.lastPanPosition = { x: clientX, y: clientY };
      return;
    }

    // Rest of the existing mouse down logic
    for (const bbox of this.boundingBoxes) {
      if (this.isClickOnDeleteIcon(bbox, clientX, clientY)) {
        this.boundingBoxes = this.boundingBoxes.filter((b) => b.id !== bbox.id);
        this.drawingElements = this.drawingElements.filter(
          (el) =>
            el.type !== 'boundingBox' || (el.data as BoundingBox).id !== bbox.id
        );
        this.drawAllElements();
        this.finishDrawing();
        return;
      }
    }

    switch (this.tool) {
      case Tools.pencil:
        this.canvasRef.nativeElement.style.cursor = 'crosshair';
        this.startPencilDrawing(clientX, clientY);
        break;
      case Tools.rectangle:
        this.canvasRef.nativeElement.style.cursor = 'crosshair';
        this.startRectangleDrawing(clientX, clientY);
        break;
      case Tools.line:
        this.canvasRef.nativeElement.style.cursor = 'crosshair';
        this.startLineDrawing(clientX, clientY);
        break;
      case Tools.erease:
        this.canvasRef.nativeElement.style.cursor = 'grab';
        this.startErasing(clientX, clientY);
        break;

      case Tools.boundingBox:
        this.canvasRef.nativeElement.style.cursor = 'crosshair';
        this.startBoundingBoxDrawing(clientX, clientY);
        break;
      default:
        this.canvasRef.nativeElement.style.cursor = 'pointer';

      // Add cases for other tools as needed
    }
  }

  handleMouseMove(event: MouseEvent) {
    if (!this.ctx) return;

    // Check if panning is active
    const isPanningActivated = this.tool === Tools.pan || event.shiftKey;

    if (isPanningActivated && this.isPanning && this.lastPanPosition) {
      // Prevent default to stop any other interactions
      event.preventDefault();

      // Get the original mouse coordinates without scaling
      const rect = this.canvasRef.nativeElement.getBoundingClientRect();
      const rawX = event.clientX - rect.left;
      const rawY = event.clientY - rect.top;

      console.log('Panning Position Moving', rawX, rawY);

      // Calculate the delta movement
      const deltaX = rawX - this.lastPanPosition.x;
      const deltaY = rawY - this.lastPanPosition.y;

      // Update pan offset
      this.panOffset.x += deltaX;
      this.panOffset.y += deltaY;

      // Update last pan position
      this.lastPanPosition = { x: rawX, y: rawY };

      // Redraw all elements with new pan offset
      this.drawAllElements();

      return;
    }

    if (!this.isDrawing) return;

    const { clientX, clientY } = this.getMouseCoordinates(event);

    // Panning functionality
    if (
      (this.tool === Tools.pan || event.shiftKey) &&
      this.isPanning &&
      this.lastPanPosition
    ) {
      // Calculate pan delta
      const deltaX = clientX - this.lastPanPosition.x;
      const deltaY = clientY - this.lastPanPosition.y;

      // Update pan offset
      this.panOffset.x + deltaX;
      this.panOffset.y + deltaY;

      // Update last pan position
      this.lastPanPosition = { x: clientX, y: clientY };

      // Redraw all elements with new pan offset
      this.drawAllElements();
      return;
    }

    switch (this.tool) {
      case Tools.pencil:
        this.continuePencilDrawing(clientX, clientY);
        break;
      case Tools.rectangle:
        this.drawRectanglePreview(clientX, clientY);
        break;
      case Tools.line:
        this.drawLinePreview(clientX, clientY);
        break;
      case Tools.erease:
        this.continueErasing(clientX, clientY);
        break;
      case Tools.boundingBox:
        this.drawBoundingBoxPreview(clientX, clientY);
        break;
    }
  }

  handleMouseUp(event: MouseEvent) {
    if (!this.ctx) return;

    // Reset panning state
    if (this.isPanning) {
      this.isPanning = false;
      this.lastPanPosition = null;
      this.canvasRef.nativeElement.style.cursor = 'grab';
      return;
    }

    const { clientX, clientY } = this.getMouseCoordinates(event);

    switch (this.tool) {
      case Tools.pencil:
        this.finishPencilDrawing(clientX, clientY);
        break;
      case Tools.rectangle:
        this.finishRectangleDrawing(clientX, clientY);
        break;
      case Tools.line:
        this.finishLineDrawing(clientX, clientY);
        break;
      case Tools.erease:
        this.finishErasing(clientX, clientY);
        break;
      case Tools.boundingBox:
        this.finishBoundingBoxDrawing(clientX, clientY);
        break;
    }
    // this.resetPan()

    // Reset drawing state
    this.isDrawing = false;
    this.startPoint = null;
    this.lineStartPoint = null;

    this.updateCanvasCursor();
  }
  private updateCanvasCursor() {
    if (!this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;

    switch (this.tool) {
      case Tools.pencil:
      case Tools.rectangle:
      case Tools.line:
      case Tools.boundingBox:
        canvas.style.cursor = 'crosshair';
        break;
      case Tools.erease:
        canvas.style.cursor = 'grab';
        break;
      case Tools.pan:
        canvas.style.cursor = 'grab';
        break;
      default:
        canvas.style.cursor = 'default';
    }
  }

  setPencilColor(color: string) {
    this.pencilColor = color;
  }
  setPencilLineWidth(width: number) {
    this.pencilLineWidth = width;
  }
  // Utility methods
  undo() {
    if (this.currentHistoryIndex > 0) {
      this.currentHistoryIndex--;
      this.restoreHistoryState();
    }
  }

  resetPan() {
    this.panOffset = { x: 0, y: 0 };
    this.drawAllElements();
  }
  redo() {
    if (this.currentHistoryIndex < this.actionHistory.length - 1) {
      this.currentHistoryIndex++;
      this.restoreHistoryState();
    }
  }

  setEraseRadius(radius: number) {
    this.eraseRadius = radius;
  }

  // Enhanced zoom methods
  handleZoom(zoomDelta: number) {
    if (zoomDelta === 0) {
      // Reset to 100%
      this.scale = 1;
    } else {
      // Calculate new scale with limits
      const newScale = Math.min(Math.max(this.scale + zoomDelta, 0.1), 2);
      
      // Update scale
      this.scale = newScale;
    }
  
    // Force redraw with new scale
    this.drawAllElements();
  }

  onControlPanelZoom(zoomDelta: number) {
    this.handleZoom(zoomDelta);
  }

  onZoom(delta: number) {
    this.scale = Math.min(Math.max(this.scale + delta, 0.1), 2);
  }
  setTool(tool: Tools) {
    this.tool = tool;
  }

  // Call this method whenever the tool changes
  onToolChange(newTool: Tools) {
    this.tool = newTool;
    this.updateCanvasCursor();
  }

  handleImageUpload(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const uploadedImage = new Image();
      uploadedImage.onload = () => {
        // Create a new image drawing element
        const imageElement: DrawingElement = {
          type: 'image',
          data: {
            image: uploadedImage,
            position: { x: 50, y: 50 }, // Default position
            size: {
              width: Math.min(uploadedImage.width, this.ctx!.canvas.width / 2),
              height: Math.min(
                uploadedImage.height,
                this.ctx!.canvas.height / 2
              ),
            },
          },
        };

        // Add to drawing elements
        this.drawingElements.push(imageElement);

        // Redraw canvas
        this.drawAllElements();

        // Save to history
        this.finishDrawing();
      };
      uploadedImage.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardZoom(event: KeyboardEvent) {
    if (event.altKey) {
      if (event.key === '+' || event.key === '=') {
        // event.preventDefault();
        this.handleZoom(0.1);
      } else if (event.key === '-' || event.key === '_') {
        // event.preventDefault();
        this.handleZoom(-0.1);
      }
    }
  }

  @HostListener('window:wheel', ['$event'])
  handleMouseWheelZoom(event: WheelEvent) {
    if (event.shiftKey) {
      event.preventDefault();
      const { deltaY } = event;
      const zoomFactor = 0.001; // Adjust zoom factor
      const newScale = this.scale * (1 - deltaY * zoomFactor);
      this.handleZoom(newScale - this.scale);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardPan(event: KeyboardEvent) {
    if (event.key === 'p' || event.key === 'P' || event.key === '5') {
      this.setTool(Tools.pan);
    }
    if (event.key === 'l' || event.key === 'L' || event.key === '4') {
      this.setTool(Tools.line);
    }
    if (event.key === 's' || event.key === 'S' || event.key === '6') {
      this.setTool(Tools.pencil);
    }
    if (event.key === 'e' || event.key === 'E' || event.key === '3') {
      this.setTool(Tools.erease);
    }
    if (event.key === 'i' || event.key === 'I' || event.key === '1') {
      this.setTool(Tools.ImportImage);
    }
    if (event.key === 'b' || event.key === 'B' || event.key === '2') {
      this.setTool(Tools.boundingBox);
    }
    if (event.key === 'r' || event.key === 'R' || event.key === '7') {
      this.setTool(Tools.rectangle);
    }
    if (event.key === 't' || event.key === 'T' || event.key === '9') {
      this.setTool(Tools.text);
    }
    // ??i want to used esc kye here
    if (event.key === 'Escape' || event.key === '8') {
      this.setTool(Tools.selection);
    }
    9;
  }
}
