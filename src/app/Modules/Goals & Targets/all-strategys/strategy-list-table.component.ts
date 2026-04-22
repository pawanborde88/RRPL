import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AngularMaterialModule } from '../../../../angular-material.module';
import type { StrategyItem } from './department-strategy.models';

@Component({
  selector: 'app-strategy-list-table',
  imports: [CommonModule, AngularMaterialModule, DatePipe],
  templateUrl: './strategy-list-table.component.html',
  styleUrl: './strategy-list-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrategyListTableComponent {
  readonly strategies = input.required<StrategyItem[]>();
  readonly editStrategy = output<StrategyItem>();
  readonly deleteStrategy = output<StrategyItem>();

  /** MatTable expects a DataSource instance; keep it in sync with the input. */
  readonly dataSource = new MatTableDataSource<StrategyItem>([]);

  readonly displayedColumns: readonly string[] = [
    'strategy_name',
    'created_at',
    'updated_at',
    'actions',
  ];

  constructor() {
    effect(() => {
      this.dataSource.data = this.strategies();
    });
  }

  readonly trackByStrategyId = (_index: number, row: StrategyItem) =>
    row.strategy_id;
}
