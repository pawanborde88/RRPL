import { Directive, ElementRef, Renderer2, OnInit, OnDestroy, Optional } from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { NgControl } from '@angular/forms';
import { merge, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: 'mat-select',
  standalone: true
})
export class MatSelectClearDirective implements OnInit, OnDestroy {
  private clearBtn!: HTMLElement;
  private destroy$ = new Subject<void>();

  constructor(
    private matSelect: MatSelect,
    private el: ElementRef,
    private renderer: Renderer2,
    @Optional() private ngControl: NgControl
  ) { }

  ngOnInit(): void {
    // Wait for view initialization
    setTimeout(() => this.createClearButton(), 0);
  }

  private createClearButton(): void {
    // 1. Find the trigger container (where the arrow lives)
    const trigger = this.el.nativeElement.querySelector('.mat-mdc-select-trigger');
    if (!trigger) return;

    // 2. Create the "X" button
    this.clearBtn = this.renderer.createElement('span');
    this.clearBtn.innerHTML = '&#10005;'; // Thin Unicode multiplication X

    // Add CSS Class for styling (see CSS section below)
    this.renderer.addClass(this.clearBtn, 'custom-clear-icon');

    // 3. Insert it into the trigger
    this.renderer.appendChild(trigger, this.clearBtn);

    // 4. Click Handler
    this.renderer.listen(this.clearBtn, 'click', (event: MouseEvent) => {
      event.stopPropagation(); // Prevent opening the dropdown
      this.clearValue();
    });

    // 5. Visibility Logic
    merge(this.matSelect.valueChange, this.ngControl?.valueChanges || new Subject())
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => this.toggleVisibility(value));

    this.toggleVisibility(this.matSelect.value);
  }

  private clearValue(): void {
    this.ngControl?.control?.setValue(null);
    this.matSelect.value = null;
    this.matSelect.stateChanges.next(); // Refresh UI
  }

  private toggleVisibility(value: any): void {
    const hasValue = value !== null && value !== undefined && value !== '';
    this.renderer.setStyle(this.clearBtn, 'display', hasValue ? 'inline-block' : 'none');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}