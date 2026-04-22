import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, finalize, of } from 'rxjs';

import { AngularMaterialModule } from '../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { environment } from '../../../../environments/environment';
import {
  ConfirmDialogComponent,
  type ConfirmDialogResult,
} from '../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddEditStrategyDialogComponent } from './add-edit-strategy-dialog/add-edit-strategy-dialog.component';
import {
  DepartmentStrategiesGroup,
  StrategyItem,
} from './department-strategy.models';
import { StrategyListTableComponent } from './strategy-list-table.component';

export type { DepartmentStrategiesGroup, StrategyItem } from './department-strategy.models';

interface FetchAllStrategyResponse {
  status: boolean;
  message?: string;
  data: DepartmentStrategiesGroup[];
}

interface DeleteStrategyResponse {
  status: boolean;
  message?: string;
}

@Component({
  selector: 'app-all-strategys',
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    StrategyListTableComponent,
  ],
  templateUrl: './all-strategys.html',
  styleUrl: './all-strategys.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllStrategys implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;

  readonly deptDataSource = new MatTableDataSource<DepartmentStrategiesGroup>([]);
  readonly loading = signal(false);

  /** Main table: department rows + one expandable detail row per department. */
  readonly displayedColumns: readonly string[] = [
    'expand',
    'department_name',
    'strategy_count',
  ];

  readonly expandedDept = signal<DepartmentStrategiesGroup | null>(null);

  ngOnInit(): void {
    this.loadStrategies();
  }

  loadStrategies(): void {
    this.loading.set(true);
    this.expandedDept.set(null);
    this.http
      .get<FetchAllStrategyResponse>(`${this.baseUrl}/fetch_all_strategy`)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.snackBar.open('Could not load strategies.', 'Close', {
            duration: 4000,
            panelClass: ['snackbar-error'],
          });
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((res) => {
        const rows = res?.status && Array.isArray(res.data) ? res.data : [];
        this.deptDataSource.data = rows;
      });
  }

  toggleDept(row: DepartmentStrategiesGroup, event?: Event): void {
    event?.stopPropagation();
    this.expandedDept.update((cur) => (cur === row ? null : row));
  }

  isExpanded(row: DepartmentStrategiesGroup): boolean {
    return this.expandedDept() === row;
  }

  strategyCount(dept: DepartmentStrategiesGroup): number {
    return dept.strategies?.length ?? 0;
  }

  openAddStrategy(): void {
    this.dialog
      .open(AddEditStrategyDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        panelClass: 'dialog-medium',
        data: {},
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) {
          this.loadStrategies();
        }
      });
  }

  openEditStrategy(strategy: StrategyItem): void {
    this.dialog
      .open(AddEditStrategyDialogComponent, {
        width: '480px',
        maxWidth: '95vw',
        panelClass: 'dialog-medium',
        data: { editData: strategy },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (saved) {
          this.loadStrategies();
        }
      });
  }

 


  confirmDeleteStrategy(companyGoalSetupId: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete that strategy ?' },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          const reason = result.reason; // Get the reason from the dialog response

          let requestPayload = {
            strategy_id: companyGoalSetupId.strategy_id,
            reason: reason, // Set the reason from the dialog
          };

          this.http
            .post(`${this.baseUrl}/delete_strategy`, requestPayload)
            .pipe(
              takeUntilDestroyed(this.destroyRef),
              catchError((err) => {
                return of(null);
              })
            )
            .subscribe({
              next: (data: any) => {
                if (data) {
                  this.loadStrategies();
                }
              },
            });
        }
      });
  }
}
