import { DecimalPipe } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-control-panel',
  templateUrl: './control-panel.component.html',
  styleUrls: ['./control-panel.component.css'],
  providers: [DecimalPipe],
  imports: [MatIconModule] 
})
export class ControlPanelComponent {
  @Input() scale: number = 0;
  
  @Output() undoAction = new EventEmitter<void>();
  @Output() redoAction = new EventEmitter<void>();
  @Output() zoomChange = new EventEmitter<number>();

  constructor(private decimalPipe: DecimalPipe) {}

  onZoomOut() {
    this.zoomChange.emit(-0.1);
  }

  onZoomIn() {
    this.zoomChange.emit(0.1);
  }

  resetScale() {
    this.zoomChange.emit(0);
  }

  undo() {
    this.undoAction.emit();
  }

  redo() {
    this.redoAction.emit();
  }
   // Custom method to format percentage
   formatScale(): string {
    return this.decimalPipe.transform((this.scale - 1) * 100, '1.0-0') + '%';
  }
}