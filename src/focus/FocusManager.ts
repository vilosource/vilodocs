export interface Focusable {
  id: string;
  element: HTMLElement;
  group: string;
  order?: number;
}

export class FocusManager {
  private focusables: Map<string, Focusable> = new Map();
  private currentFocus: string | null = null;
  private focusHistory: string[] = [];
  private trapGroup: string | null = null;
  private maxHistorySize = 20;

  registerFocusable(id: string, element: HTMLElement, group: string, order?: number): void {
    this.focusables.set(id, { id, element, group, order });
  }

  unregisterFocusable(id: string): void {
    this.focusables.delete(id);
    
    // Remove from history
    this.focusHistory = this.focusHistory.filter(h => h !== id);
    
    // Update current focus if needed
    if (this.currentFocus === id) {
      this.currentFocus = null;
    }
  }

  getFocusableElement(id: string): HTMLElement | undefined {
    return this.focusables.get(id)?.element;
  }

  getFocusablesInGroup(group: string): Focusable[] {
    const focusables: Focusable[] = [];
    
    for (const focusable of this.focusables.values()) {
      if (focusable.group === group) {
        focusables.push(focusable);
      }
    }
    
    // Sort by order if specified
    return focusables.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  focus(id: string): boolean {
    const focusable = this.focusables.get(id);
    if (!focusable) return false;

    try {
      // Make sure element is focusable
      if (focusable.element.tabIndex < 0) {
        focusable.element.tabIndex = 0;
      }
      
      focusable.element.focus();
      this.currentFocus = id;
      this.addToHistory(id);
      return true;
    } catch (error) {
      console.error('Failed to focus element:', error);
      return false;
    }
  }

  focusNext(group?: string): boolean {
    const targetGroup = group || this.trapGroup;
    if (!targetGroup && !this.currentFocus) return false;

    const focusables = targetGroup 
      ? this.getFocusablesInGroup(targetGroup)
      : Array.from(this.focusables.values());

    if (focusables.length === 0) return false;

    let currentIndex = -1;
    if (this.currentFocus) {
      currentIndex = focusables.findIndex(f => f.id === this.currentFocus);
    }

    const nextIndex = (currentIndex + 1) % focusables.length;
    return this.focus(focusables[nextIndex].id);
  }

  focusPrevious(group?: string): boolean {
    const targetGroup = group || this.trapGroup;
    if (!targetGroup && !this.currentFocus) return false;

    const focusables = targetGroup 
      ? this.getFocusablesInGroup(targetGroup)
      : Array.from(this.focusables.values());

    if (focusables.length === 0) return false;

    let currentIndex = -1;
    if (this.currentFocus) {
      currentIndex = focusables.findIndex(f => f.id === this.currentFocus);
    }

    const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusables.length - 1;
    return this.focus(focusables[prevIndex].id);
  }

  focusLastActive(): boolean {
    // Find the last active element that still exists
    for (let i = this.focusHistory.length - 1; i >= 0; i--) {
      const id = this.focusHistory[i];
      if (id !== this.currentFocus && this.focusables.has(id)) {
        return this.focus(id);
      }
    }
    return false;
  }

  getCurrentFocus(): string | null {
    return this.currentFocus;
  }

  getFocusHistory(): string[] {
    return [...this.focusHistory];
  }

  trapFocus(group: string): void {
    this.trapGroup = group;
  }

  releaseTrap(): void {
    this.trapGroup = null;
  }

  isTrapped(): boolean {
    return this.trapGroup !== null;
  }

  private addToHistory(id: string): void {
    // Remove if already in history
    this.focusHistory = this.focusHistory.filter(h => h !== id);
    
    // Add to end
    this.focusHistory.push(id);
    
    // Trim if too long
    if (this.focusHistory.length > this.maxHistorySize) {
      this.focusHistory = this.focusHistory.slice(-this.maxHistorySize);
    }
  }

  // Utility method to handle focus on element removal
  handleElementRemoval(id: string): void {
    if (this.currentFocus === id) {
      // Try to focus last active
      if (!this.focusLastActive()) {
        // Try to focus next in same group
        const focusable = this.focusables.get(id);
        if (focusable) {
          const group = focusable.group;
          this.unregisterFocusable(id);
          const groupFocusables = this.getFocusablesInGroup(group);
          if (groupFocusables.length > 0) {
            this.focus(groupFocusables[0].id);
          }
        } else {
          this.unregisterFocusable(id);
        }
      } else {
        this.unregisterFocusable(id);
      }
    } else {
      this.unregisterFocusable(id);
    }
  }
}