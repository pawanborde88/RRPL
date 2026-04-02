import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appColumnResize]',
  standalone: true
})
export class ColumnResizeDirective {
  @Input() minWidth = 50;
  private startX!: number;
  private startWidth!: number;
  private column!: HTMLElement;
  private table!: HTMLElement;
  private resizing = false;
  private isOnBorder = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'default');
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const handleWidth = 5; // Match this with your CSS
    const isNearBorder = event.clientX > rect.right - handleWidth && 
                        event.clientX < rect.right + handleWidth;

    if (isNearBorder && !this.isOnBorder) {
      this.isOnBorder = true;
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'col-resize');
    } else if (!isNearBorder && this.isOnBorder && !this.resizing) {
      this.isOnBorder = false;
      this.renderer.setStyle(this.el.nativeElement, 'cursor', 'default');
    }
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const handleWidth = 5;
    const isOnBorder = event.clientX > rect.right - handleWidth && 
                       event.clientX < rect.right + handleWidth;

    if (!isOnBorder) return;

    event.preventDefault();
    this.startResize(event);
  }

  private startResize(event: MouseEvent): void {
    this.resizing = true;
    this.startX = event.pageX;
    this.column = this.el.nativeElement;
    this.startWidth = this.column.offsetWidth;
    this.table = this.findParentTable(this.column);

    this.renderer.addClass(document.body, 'resizing');
    this.renderer.setStyle(document.body, 'cursor', 'col-resize');
    this.renderer.setStyle(document.body, 'user-select', 'none');
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    if (!this.resizing) return;

    const newWidth = this.startWidth + (event.pageX - this.startX);
    const finalWidth = Math.max(this.minWidth, newWidth);
    
    this.renderer.setStyle(this.column, 'width', `${finalWidth}px`);
    this.renderer.setStyle(this.column, 'min-width', `${finalWidth}px`);
    this.renderer.setStyle(this.column, 'max-width', `${finalWidth}px`);
    
    this.renderer.setStyle(this.table, 'width', 'auto');
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.resizing) return;

    this.resizing = false;
    this.isOnBorder = false;
    this.renderer.removeClass(document.body, 'resizing');
    this.renderer.removeStyle(document.body, 'cursor');
    this.renderer.removeStyle(document.body, 'user-select');
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'default');
  }

  private findParentTable(element: HTMLElement): HTMLElement {
    let parent = element.parentElement;
    while (parent && !parent.classList.contains('mat-table')) {
      parent = parent.parentElement;
    }
    return parent || this.table;
  }
}
