import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { StrategyDepartmentGroup } from '../../../Service/common/common.service';

/**
 * Compact Tailwind multi-select for monthly strategy IDs (no mat-select).
 * Groups options by department; shows department header + strategy rows with checkboxes.
 */
@Component({
  selector: 'app-month-strategy-multiselect',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="relative w-full min-w-0">
      <button
        type="button"
        class="gf-ms-trigger flex h-10 w-full min-w-0 items-center justify-between gap-1 rounded-md border border-slate-200 bg-white px-3 text-left text-[13px] font-medium leading-none text-slate-800 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:border-teal-500 focus-visible:ring-1 focus-visible:ring-teal-400"
        [class.border-teal-400]="open()"
        [class.bg-teal-50/20]="open()"
        [attr.aria-expanded]="open()"
        aria-haspopup="listbox"
        [attr.title]="summaryTitle()"
        (click)="onTriggerClick($event)"
      >
        <span class="min-w-0 flex-1 truncate">{{ summaryText() }}</span>
        <span class="shrink-0 text-slate-400" aria-hidden="true">{{ open() ? '▴' : '▾' }}</span>
      </button>

      @if (open()) {
        <div
          class="gf-ms-panel absolute left-0 right-0 z-[60] mt-1.5 max-h-[12rem] min-w-[14rem] overflow-y-auto overflow-x-hidden rounded-lg border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5"
          role="listbox"
          [attr.aria-multiselectable]="true"
          (click)="$event.stopPropagation()"
        >
          @for (g of groups(); track $index) {
            <section class="border-b border-slate-100 last:border-b-0">
              <div
                class="gf-ms-dept sticky top-0 z-[1] border-b border-slate-200/50 bg-slate-50/95 backdrop-blur px-3 py-2 text-left text-[10px] font-bold uppercase leading-none tracking-widest text-slate-500"
              >
                {{ g.department_name }}
              </div>
              <div class="py-1">
                @for (s of g.strategies; track s.strategy_id) {
                  <label
                    class="gf-ms-row cursor-pointer px-3 py-2.5 hover:bg-teal-50/50"
                    [class.gf-ms-row--on]="isSelected(s.strategy_id)"
                    [attr.title]="s.strategy_name"
                  >
                    <input
                      type="checkbox"
                      class="gf-ms-cb accent-teal-600"
                      [checked]="isSelected(s.strategy_id)"
                      (change)="toggle(s.strategy_id, $any($event.target).checked)"
                    />
                    <span
                      class="min-w-0 break-words text-[12px] font-medium leading-tight text-slate-700"
                      >{{ s.strategy_name }}</span
                     >
                  </label>
                }
              </div>
            </section>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .gf-ms-row {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        column-gap: 0.75rem;
        align-items: center;
      }
      .gf-ms-cb {
        width: 16px;
        height: 16px;
        min-width: 16px;
        max-width: 16px;
        margin: 0;
        padding: 0;
        cursor: pointer;
      }
      .gf-ms-panel {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 #f8fafc;
      }
      .gf-ms-panel::-webkit-scrollbar {
        width: 6px;
      }
      .gf-ms-panel::-webkit-scrollbar-track {
        background: #f8fafc;
      }
      .gf-ms-panel::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 10px;
      }
      .gf-ms-row--on {
        background: #f0fdfa; /* Teal 50 */
        box-shadow: inset 3px 0 0 0 #0d9488; /* Teal 600 */
      }
      .gf-ms-dept {
        box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
      }
    `,
  ],
})
export class MonthStrategyMultiselectComponent {
  private readonly host = inject(ElementRef<HTMLElement>);

  /** Selected strategy IDs for this month */
  control = input.required<FormControl<number[]>>();
  /** API shape: departments with strategies */
  groups = input.required<StrategyDepartmentGroup[]>();

  open = signal(false);

  isSelected(id: number): boolean {
    const v = this.control().value;
    return Array.isArray(v) && v.includes(id);
  }

  summaryText(): string {
    const n = this.control().value?.length ?? 0;
    if (n === 0) return 'Strategy';
    return n === 1 ? '1 strategy' : `${n} strategies`;
  }

  summaryTitle(): string {
    const sel = this.control().value ?? [];
    if (!sel.length) return '';
    const map = this.nameByIdMap();
    const names = sel.map((id) => map.get(id)).filter((x): x is string => !!x);
    return names.join(' · ');
  }

  private nameByIdMap(): Map<number, string> {
    const m = new Map<number, string>();
    for (const g of this.groups()) {
      for (const s of g.strategies) {
        m.set(s.strategy_id, s.strategy_name);
      }
    }
    return m;
  }

  onTriggerClick(ev: MouseEvent): void {
    ev.stopPropagation();
    this.open.update((o) => !o);
  }

  toggle(id: number, checked: boolean): void {
    const c = this.control();
    const next = new Set(c.value ?? []);
    if (checked) next.add(id);
    else next.delete(id);
    c.setValue([...next]);
    c.markAsDirty();
    c.markAsTouched();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent): void {
    if (!this.open()) return;
    const t = ev.target as Node;
    if (this.host.nativeElement.contains(t)) return;
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.open.set(false);
  }
}
