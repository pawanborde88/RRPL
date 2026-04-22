import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Inject, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, of } from 'rxjs';

import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import type { StrategyItem } from '../department-strategy.models';

export interface AddEditStrategyDialogData {
  editData?: StrategyItem;
}

export interface DepartmentOption {
  department_id: number;
  department_name: string;
}

@Component({
  selector: 'app-add-edit-strategy-dialog',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, ReactiveFormsModule],
  templateUrl: './add-edit-strategy-dialog.component.html',
  styleUrl: './add-edit-strategy-dialog.component.scss',
})
export class AddEditStrategyDialogComponent implements OnInit {
  strategyForm!: FormGroup;
  isEditMode = false;
  loading = false;
  /** Signal so MatDialog + async HTTP reliably refresh the template (plain bool can stick on the spinner). */
  readonly departmentsLoading = signal(true);

  readonly departments = signal<DepartmentOption[]>([]);

  private readonly baseUrl = environment.API_URL;
  private readonly userId = Number(sessionStorage.getItem('session_id'));
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly fb: FormBuilder,
    public dialogRef: MatDialogRef<AddEditStrategyDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditStrategyDialogData
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.editData?.strategy_id;
    this.initForm();
    this.loadDepartments();
  }

  private initForm(): void {
    const edit = this.data?.editData;
    const rawDeptId = edit?.department_id;
    const parsedDeptId =
      rawDeptId === null || rawDeptId === undefined
        ? null
        : Number(rawDeptId);
    const departmentId =
      parsedDeptId != null && !Number.isNaN(parsedDeptId) ? parsedDeptId : null;
    this.strategyForm = this.fb.group({
      strategy_name: [edit?.strategy_name ?? '', [Validators.required, Validators.maxLength(500)]],
      department_id: [departmentId, Validators.required],
    });
  }

  /** Matches mat-option values when the control or API uses string vs number ids. */
  compareDeptId(
    a: number | string | null | undefined,
    b: number | string | null | undefined
  ): boolean {
    if (a == null && b == null) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    return Number(a) === Number(b);
  }

  private loadDepartments(): void {
    this.departmentsLoading.set(true);
    const url = `${this.baseUrl}/fetch_department_setup`;
    // Laravel route only allows GET (not POST) — use a single GET so the Network tab shows one call.
    this.http
      .get<unknown>(url)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.showSnackBar('Unable to load departments.', 'error');
          return of(null);
        }),
        finalize(() => this.departmentsLoading.set(false))
      )
      .subscribe((res) => {
        this.departmentsLoading.set(false);
        const list = this.normalizeDepartmentList(res);
        this.departments.set(list);
        const edit = this.data?.editData;
        if (edit?.department_id != null) {
          const id = Number(edit.department_id);
          if (!Number.isNaN(id)) {
            this.strategyForm.patchValue({ department_id: id });
          }
        }
      });
  }

  /**
   * API: `{ "status": true, "message": "...", "data": [ { "department_id", "department_name", ... } ] }`
   * Also accepts a raw array or `{ data: [...] }` without `status`.
   */
  private normalizeDepartmentList(res: unknown): DepartmentOption[] {
    if (res == null) {
      return [];
    }

    let raw: unknown[] = [];
    if (Array.isArray(res)) {
      raw = res;
    } else if (typeof res === 'object') {
      const o = res as Record<string, unknown>;
      const d = o['data'];
      if (Array.isArray(d)) {
        raw = d;
      }
    }

    return raw
      .map((x: unknown) => {
        const row = x as Record<string, unknown>;
        const id = Number(row['department_id'] ?? row['id']);
        const name = String(
          row['department_name'] ??
            row['Department_Name'] ??
            row['name'] ??
            row['department'] ??
            ''
        ).trim();
        return { department_id: id, department_name: name };
      })
      .filter(
        (d) => !Number.isNaN(d.department_id) && d.department_name.length > 0
      );
  }

  onSubmit(): void {
    if (this.strategyForm.invalid) {
      this.strategyForm.markAllAsTouched();
      return;
    }

    const { strategy_name, department_id } = this.strategyForm.getRawValue() as {
      strategy_name: string;
      department_id: number;
    };

    this.loading = true;

    if (this.isEditMode) {
      const payload = {
        strategy_id: this.data.editData!.strategy_id,
        strategy_name: strategy_name.trim(),
        department_id,
        updated_by: this.userId,
      };
      this.http
        .post(`${this.baseUrl}/update_strategy`, payload)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => (this.loading = false))
        )
        .subscribe({
          next: (res: unknown) => {
            if (this.isApiFailure(res)) {
              this.showSnackBar(this.apiMessage(res) ?? 'Update failed.', 'error');
              return;
            }
            this.showSnackBar('Strategy updated successfully');
            this.dialogRef.close(true);
          },
          error: () => this.showSnackBar('Error updating strategy', 'error'),
        });
    } else {
      const payload = {
        strategy_name: strategy_name.trim(),
        department_id,
        created_by: this.userId,
      };
      this.http
        .post(`${this.baseUrl}/add_strategy`, payload)
        .pipe(
          takeUntilDestroyed(this.destroyRef),
          finalize(() => (this.loading = false))
        )
        .subscribe({
          next: (res: unknown) => {
            if (this.isApiFailure(res)) {
              this.showSnackBar(this.apiMessage(res) ?? 'Could not add strategy.', 'error');
              return;
            }
            this.showSnackBar('Strategy added successfully');
            this.dialogRef.close(true);
          },
          error: () => this.showSnackBar('Error adding strategy', 'error'),
        });
    }
  }

  private isApiFailure(res: unknown): boolean {
    if (res && typeof res === 'object' && 'status' in res) {
      return (res as { status: boolean }).status === false;
    }
    return false;
  }

  private apiMessage(res: unknown): string | undefined {
    if (res && typeof res === 'object' && 'message' in res) {
      const m = (res as { message: unknown }).message;
      return typeof m === 'string' ? m : undefined;
    }
    return undefined;
  }

  private showSnackBar(
    message: string,
    kind: 'default' | 'error' = 'default'
  ): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: kind === 'error' ? ['snackbar-error'] : undefined,
    });
  }
}
