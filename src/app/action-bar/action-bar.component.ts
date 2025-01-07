import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Tools, ToolsType } from '../types/draw-types';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.css'],
  standalone: true,
  imports: [MatIconModule, CommonModule],
})
export class ActionBarComponent {
  @Input() tool: ToolsType = Tools.selection;
  @Output() toolChange = new EventEmitter<ToolsType>();
  @Output() imageUpload = new EventEmitter<File>();
  @Output() downloadRequest = new EventEmitter<void>();
  toolsEnum = Tools;
  // downloadRequest: any;
  // el: any;

  // ngOnChanges(selectedTool: ToolsType) {
  //   // Emit the selected tool to the parent component
  //   // this.updateCursor();
  //   this.toolChange.emit(selectedTool);
  // }

  setTool(selectedTool: ToolsType) {
    if (selectedTool === Tools.download) {
      this.downloadRequest.emit();
    } else {
      this.toolChange.emit(selectedTool);
    }
  }

  handleImageButtonClick() {
    const fileInput = document.getElementById(
      'imageUploadInput'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.imageUpload.emit(input.files[0]);
    }
  }
  // ngOnChanges() {
  //   this.updateCursor();
  // }
  // private updateCursor() {
  //   if (this.tool) {
  //     this.el.nativeElement.style.cursor = ToolCursors[this.tool] || 'default';
  //   }
  // }
}
