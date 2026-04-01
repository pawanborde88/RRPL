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

    // Add CSS Class for styling (from styles.scss)
    this.renderer.addClass(this.clearBtn, 'mat-select-clear-btn');

    // 3. Insert it into the trigger
    this.renderer.appendChild(trigger, this.clearBtn);

    // 4. Click Handler
    this.renderer.listen(this.clearBtn, 'click', (event: MouseEvent) => {
      event.stopPropagation(); // Prevent opening the dropdown
      this.clearValue();
    });

    // 5. Visibility Logic
    // We listen to both value changes and stateChanges (which includes empty state transitions)
    merge(
      this.matSelect.valueChange,
      this.matSelect.stateChanges,
      this.ngControl?.valueChanges || new Subject()
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateVisibility());

    // Initial check
    this.updateVisibility();
  }

  private clearValue(): void {
    if (this.ngControl?.control) {
      this.ngControl.control.setValue(null);
    } else {
      this.matSelect.value = null;
    }
    this.matSelect.stateChanges.next(); // Refresh UI
  }

  private updateVisibility(): void {
    // matSelect.empty handles null, undefined, and empty arrays correctly
    const show = !this.matSelect.empty;
    this.renderer.setStyle(this.clearBtn, 'display', show ? 'flex' : 'none');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}