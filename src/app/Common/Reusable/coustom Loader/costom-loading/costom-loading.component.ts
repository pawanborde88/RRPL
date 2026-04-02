import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { animate, style, transition, trigger } from '@angular/animations';
import { ThemePalette } from '@angular/material/core';

@Component({
  selector: 'app-costom-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './costom-loading.component.html',
  styleUrl: './costom-loading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('150ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('100ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ],
})
export class CostomLoadingComponent {
  // ==================== SIGNAL-BASED INPUTS (HIGH-PERFORMANCE) ====================
  /**
   * Whether the loader is visible.
   * Uses a transform to coerce any truthy / falsy value to a strict boolean.
   */
  readonly loading = input<boolean, boolean | null | undefined>(false, {
    transform: (value) => !!value,
  });

  /** Whether to show the loader as a full-screen overlay. */
  readonly isFullScreen = input<boolean, boolean | null | undefined>(false, {
    transform: (value) => !!value,
  });

  /** Optional loading text shown below the spinner. */
  readonly text = input<string>('');

  // Spinner customization inputs
  readonly diameter = input<number>(56);
  readonly strokeWidth = input<number>(4);
  readonly spinnerColor = input<ThemePalette>('accent');

  /** Accessible label derived from the provided text. */
  readonly ariaLabel = computed<string>(() => this.text() || 'Loading data');
}
