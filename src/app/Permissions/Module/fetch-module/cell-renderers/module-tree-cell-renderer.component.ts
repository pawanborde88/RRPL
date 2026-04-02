import { ChangeDetectorRef, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AngularMaterialModule } from '../../../../../angular-material.module';

/**
 * Custom tree cell renderer for the Module column: expand/collapse and module name.
 * Uses context.isExpanded and context.toggleExpand (no treeData – AG-Grid Community only).
 */
@Component({
  selector: 'app-module-tree-cell-renderer',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  template: `
    <div class="module-tree-cell" [style.padding-left.rem]="level * 1.25">
      <button
        *ngIf="hasChildren"
        mat-icon-button
        type="button"
        class="expand-btn"
        (click)="toggle($event)"
        [attr.aria-label]="expanded ? 'Collapse' : 'Expand'"
      >
        <mat-icon class="expand-icon">{{ expanded ? 'expand_more' : 'chevron_right' }}</mat-icon>
      </button>
      <span *ngIf="!hasChildren" class="expand-placeholder"></span>
      <span class="module-name">{{ moduleName }}</span>
    </div>
  `,
  styles: [`
    .module-tree-cell {
      display: flex;
      align-items: center;
      gap: 4px;
      min-height: 32px;
    }
    .expand-btn {
      width: 28px;
      height: 28px;
      line-height: 28px;
    }
    .expand-btn .expand-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
    .expand-placeholder {
      display: inline-block;
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }
    .module-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
})
export class ModuleTreeCellRendererComponent implements ICellRendererAngularComp {
  hasChildren = false;
  expanded = false;
  level = 0;
  moduleName = '';
  private params: ICellRendererParams | null = null;
  private toggleExpand: ((data: unknown) => void) | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.toggleExpand = (params.context as { toggleExpand?: (d: unknown) => void })?.toggleExpand ?? null;
    this.syncFromParams();
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.syncFromParams();
    this.cdr.markForCheck();
    return true;
  }

  toggle(event: Event): void {
    event.stopPropagation();
    if (this.params?.data != null && this.toggleExpand) {
      this.toggleExpand(this.params.data);
    }
  }

  private syncFromParams(): void {
    const p = this.params;
    const data = p?.data as { child?: unknown[]; module_name?: string; level?: number } | undefined;
    const ctx = p?.context as { isExpanded?: (d: unknown) => boolean } | undefined;
    this.hasChildren = (data?.child?.length ?? 0) > 0;
    this.expanded = ctx?.isExpanded?.(p?.data) ?? false;
    this.level = data?.level ?? 0;
    this.moduleName = data?.module_name ?? '';
  }
}
