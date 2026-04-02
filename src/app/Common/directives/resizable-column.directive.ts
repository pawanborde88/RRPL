import { Directive, ElementRef, Renderer2, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CdkColumnDef, CdkTable } from '@angular/cdk/table';


@Directive({
  selector: '[appResizableColumn]',
  standalone: true
})
export class ResizableColumnDirective {
  private resizer!: HTMLElement;
  private minWidth = 50;
  private initialWidth!: number;
  private initialX!: number;
  private isResizing = false;
  private currentWidth!: number;

  private mouseMoveListener?: () => void;
  private mouseUpListener?: () => void;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private columnDef: CdkColumnDef,
    private table: CdkTable<any>,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.resizer = this.el.nativeElement.querySelector('.column-resizer') as HTMLElement;

    if (this.resizer) {
      this.renderer.listen(this.resizer, 'mousedown', (event) => this.onMouseDown(event));
    }

    // Apply previously stored width
    this.table.renderRows();
    if (this.currentWidth) {
      this.applyColumnWidth(this.currentWidth);
    }
  }

  private onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing = true;
    this.initialWidth = this.el.nativeElement.offsetWidth;
    this.currentWidth = this.initialWidth;
    this.initialX = event.clientX;

    // Add resizing class for visual feedback
    this.renderer.addClass(this.el.nativeElement, 'resizing');

    this.mouseMoveListener = this.renderer.listen(document, 'mousemove', (e) => this.onMouseMove(e));
    this.mouseUpListener = this.renderer.listen(document, 'mouseup', () => this.onMouseUp());
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;

    const deltaX = event.clientX - this.initialX;
    const newWidth = this.initialWidth + deltaX;

    if (newWidth >= this.minWidth) {
      requestAnimationFrame(() => {
        this.currentWidth = newWidth;
        this.applyColumnWidth(newWidth);
        this.cd.markForCheck();
      });
    }
  }

  private applyColumnWidth(newWidth: number): void {
    // Apply styles to header cell
    this.setElementStyles(this.el.nativeElement, newWidth);

    // Apply styles to all data cells
    const columnSelector = `td.mat-column-${this.columnDef.name}`;
    const columnCells = this.el.nativeElement.closest('table')?.querySelectorAll<HTMLElement>(columnSelector) || [];

    columnCells.forEach((cell) => this.setElementStyles(cell, newWidth));
  }

  private setElementStyles(element: HTMLElement, width: number): void {
    this.renderer.setStyle(element, 'min-width', `${width}px`);
    this.renderer.setStyle(element, 'max-width', `${width}px`);
    this.renderer.setStyle(element, 'width', `${width}px`);
    this.renderer.setStyle(element, 'flex', `0 0 ${width}px`);
  }

  private onMouseUp(): void {
    if (!this.isResizing) return;

    this.isResizing = false;
    this.renderer.removeClass(this.el.nativeElement, 'resizing');

    // Cleanup event listeners
    this.mouseMoveListener?.();
    this.mouseUpListener?.();
    this.mouseMoveListener = undefined;
    this.mouseUpListener = undefined;
  }

  ngOnDestroy(): void {
    this.onMouseUp(); // Ensure cleanup
  }
}
