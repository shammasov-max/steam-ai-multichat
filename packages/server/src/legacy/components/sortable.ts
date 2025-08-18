// Type definitions
type DragEvent = globalThis.DragEvent;
type HTMLElement = globalThis.HTMLElement;

type SortableConfig = {
  readonly container: HTMLElement;
  readonly draggedItem: HTMLElement | null;
  readonly element: HTMLElement | null;
  readonly lastTargetToChange: HTMLElement | null;
};

type DragPosition = {
  readonly isAbove: boolean;
  readonly targetElement: HTMLElement;
};

// Sortable class for drag and drop functionality
export default class Sortable {
  private readonly container: HTMLElement;
  private draggedItem: HTMLElement | null;
  private element: HTMLElement | null;
  private lastTargetToChange: HTMLElement | null;

  constructor(selector: string) {
    const containerElement = document.querySelector(selector);
    if (!containerElement) {
      throw new Error(`Container element not found: ${selector}`);
    }
    
    this.container = containerElement as HTMLElement;
    this.draggedItem = null;
    this.element = null;
    this.lastTargetToChange = null;
    
    this.initializeEventListeners();
  }

  private initializeEventListeners = (): void => {
    this.container.ondragover = this.onDragOver;
    this.container.ondrop = this.onDrop;
    this.container.ondragend = this.onDragEnd;
  };

  public onDragStart = (event: DragEvent, selector: string): void => {
    const draggedElement = document.querySelector(selector);
    if (draggedElement) {
      this.draggedItem = draggedElement as HTMLElement;
    }
    
    const friendsModal = document.getElementById("friendsModal");
    if (friendsModal) {
      friendsModal.classList.add("no_scroll");
    }
  };

  private onDragOver = (event: DragEvent): void => {
    event.preventDefault();
    
    const targetElement = this.getValidTargetElement(event.target as HTMLElement);
    if (!targetElement || !this.draggedItem) {
      return;
    }

    const dragPosition = this.calculateDragPosition(event, targetElement);
    this.updateElementOrder(dragPosition);
  };

  private getValidTargetElement = (target: HTMLElement): HTMLElement | null => {
    if (target.classList.contains('lastMessages')) {
      return null;
    }
    
    if (!target.classList.contains("row_user")) {
      return target.offsetParent as HTMLElement;
    }
    
    return target;
  };

  private calculateDragPosition = (event: DragEvent, targetElement: HTMLElement): DragPosition => {
    const boundingRect = targetElement.getBoundingClientRect();
    const isAbove = event.clientY < boundingRect.top + boundingRect.height / 2;
    
    return {
      isAbove,
      targetElement
    };
  };

  private updateElementOrder = (dragPosition: DragPosition): void => {
    const { isAbove, targetElement } = dragPosition;
    const targetToChange = isAbove ? targetElement : targetElement.nextSibling as HTMLElement;
    
    if (!targetToChange?.style || this.lastTargetToChange === targetToChange) {
      return;
    }

    this.lastTargetToChange = targetToChange;
    this.swapElementOrders(targetToChange);
  };

  private swapElementOrders = (targetElement: HTMLElement): void => {
    if (!this.draggedItem) return;

    const draggedItemOrder = this.draggedItem.style.order;
    const targetElementOrder = targetElement.style.order;

    // Update dragged item
    this.draggedItem.style.order = targetElementOrder;
    this.draggedItem.classList.remove(`order_${draggedItemOrder}`);
    this.draggedItem.classList.add(`order_${targetElementOrder}`);

    // Update target element
    targetElement.style.order = draggedItemOrder;
    targetElement.classList.remove(`order_${targetElementOrder}`);
    targetElement.classList.add(`order_${draggedItemOrder}`);
  };

  private onDrop = (event: DragEvent): void => {
    const friendsModal = document.getElementById("friendsModal");
    if (friendsModal) {
      friendsModal.classList.remove('no_scroll');
    }
  };

  private onDragEnd = (event: DragEvent): void => {
    const friendsModal = document.getElementById("friendsModal");
    if (friendsModal) {
      friendsModal.classList.remove("no_scroll");
    }
  };
}

export type {
  SortableConfig,
  DragPosition
};