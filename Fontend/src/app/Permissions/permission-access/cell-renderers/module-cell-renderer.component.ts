import { Component, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { HighlightPipe } from '../../../Pipes/highlight.pipe';

interface PermissionRow {
  module_id: number;
  module_name: string;
  permission_id?: number;
  isExpanded?: boolean;
  isChild?: boolean;
  level?: number;
  rowType?: 'module' | 'permission';
  [key: string]: any;
}

interface ModuleCellContext {
  isExpanded?: (d: PermissionRow) => boolean;
  toggleExpand?: (d: PermissionRow) => void;
  hasChildren?: (moduleId: number) => boolean;
  searchQuery?: () => string;
}

@Component({
  selector: 'app-module-cell-renderer',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, HighlightPipe],
  template: `
    <div class="module-tree-cell" [style.padding-left.rem]="getPaddingLeftRem()">
      <button
        *ngIf="isModuleRow() && hasChildren()"
        mat-icon-button
        type="button"
        class="expand-btn"
        (click)="toggleExpand($event)"
        [attr.aria-label]="isExpanded() ? 'Collapse' : 'Expand'"
      >
        <mat-icon class="expand-icon">{{ isExpanded() ? 'expand_more' : 'chevron_right' }}</mat-icon>
      </button>
      <span *ngIf="!isModuleRow() || !hasChildren()" class="expand-placeholder"></span>
      <span class="module-name" [innerHTML]="getModuleName() | highlight: searchQuery()"></span>
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
      color: #3b82f6;
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleCellRendererComponent implements ICellRendererAngularComp {
  params!: ICellRendererParams;

  private readonly cdr = inject(ChangeDetectorRef);

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  refresh(params: ICellRendererParams): boolean {
    this.params = params;
    this.cdr.markForCheck();
    return true;
  }

  getRowData(): PermissionRow | null {
    return (this.params?.data as PermissionRow) || null;
  }

  isModuleRow(): boolean {
    return this.getRowData()?.rowType === 'module';
  }

  hasChildren(): boolean {
    const row = this.getRowData();
    if (!row) return false;
    const ctx = this.params?.context as ModuleCellContext | undefined;
    const byCtx = ctx?.hasChildren?.(row.module_id);
    if (byCtx !== undefined) return byCtx;
    const byParams = (this.params as any).hasChildren?.(row.module_id);
    return !!byParams;
  }

  isExpanded(): boolean {
    const row = this.getRowData();
    if (!row) return false;
    const ctx = this.params?.context as ModuleCellContext | undefined;
    const byCtx = ctx?.isExpanded?.(row);
    if (byCtx !== undefined) return byCtx;
    const byParams = (this.params as any).isExpanded?.(row.module_id);
    return !!byParams;
  }

  searchQuery(): string {
    const ctx = this.params?.context as ModuleCellContext | undefined;
    const byCtx = ctx?.searchQuery?.();
    if (byCtx !== undefined) return byCtx;
    return (this.params as any).searchQuery?.() ?? '';
  }

  /** Same rem-based indent as FetchModule’s ModuleTreeCellRenderer; extra 1.25rem for permission rows. */
  getPaddingLeftRem(): number {
    const row = this.getRowData();
    if (!row) return 0;
    const level = row.level ?? 0;
    const base = level * 1.25;
    return row.rowType === 'permission' ? base + 1.25 : base;
  }

  getModuleName(): string {
    return this.getRowData()?.module_name ?? '';
  }

  toggleExpand(event: Event): void {
    event.stopPropagation();
    const row = this.getRowData();
    if (!row) return;
    const ctx = this.params?.context as ModuleCellContext | undefined;
    ctx?.toggleExpand?.(row) ?? (this.params as any).onToggleExpand?.(row);
  }
}
