import { Injectable } from '@angular/core';
import { HistoryAction } from './util';
import { ElementType } from '../types/draw-types';


@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  elements(x: number, y: number, elements: any) {
    throw new Error('Method not implemented.');
  }
  setElements(updatedElements: any) {
    throw new Error('Method not implemented.');
  }
  initialize(selectedElements: ElementType[]) {
    throw new Error('Method not implemented.');
  }
  private history: HistoryAction[] = [];
  private currentIndex = -1;

  addAction(action: HistoryAction) {
    // Remove any actions after the current index
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add the new action
    this.history.push(action);
    
    // Update the current index
    this.currentIndex++;
  }

  undo(): HistoryAction | null {
    if (this.currentIndex >= 0) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  redo(): HistoryAction | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  // Optional: Clear history
  clearHistory() {
    this.history = [];
    this.currentIndex = -1;
  }

  // Optional: Get current history state
  getHistory() {
    return {
      actions: this.history,
      currentIndex: this.currentIndex
    };
  }
}