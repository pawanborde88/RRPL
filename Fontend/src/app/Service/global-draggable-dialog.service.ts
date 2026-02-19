import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DragDrop, DragRef } from '@angular/cdk/drag-drop';

@Injectable({
    providedIn: 'root'
})
export class GlobalDraggableDialogService {
    private renderer: Renderer2;

    constructor(
        private dialog: MatDialog,
        private dragDrop: DragDrop,
        rendererFactory: RendererFactory2
    ) {
        this.renderer = rendererFactory.createRenderer(null, null);
        this.init();
    }

    private init() {
        this.dialog.afterOpened.subscribe((dialogRef) => {
            // Small delay to ensure the dialog is fully rendered in the DOM
            setTimeout(() => {
                const overlayPane = document.querySelector('.cdk-overlay-pane:last-child') as HTMLElement;
                if (!overlayPane) return;

                // Try to find a header or title to use as a handle
                // Angular Material uses mat-dialog-title or [mat-dialog-title]
                const header = overlayPane.querySelector('h2, [mat-dialog-title], .mat-mdc-dialog-title') as HTMLElement;

                if (header) {
                    this.makeDraggable(overlayPane, header);
                } else {
                    // If no title is found, make the whole content draggable (less ideal but still works)
                    this.makeDraggable(overlayPane, overlayPane);
                }
            }, 100);
        });
    }

    private makeDraggable(overlayPane: HTMLElement, handle: HTMLElement) {
        const dragRef: DragRef = this.dragDrop.createDrag(overlayPane);

        // Set the handle
        dragRef.withHandles([handle]);

        // Optional: Add a class to the handle to show a move cursor
        this.renderer.setStyle(handle, 'cursor', 'move');

        // Ensure the dialog stays within the viewport
        // dragRef.withBoundaryElement(document.body);
    }
}
