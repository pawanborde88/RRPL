import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of, finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { CommonService } from '../../../../Service/common/common.service';

// --- Interfaces ---------------------------------------------------------------

interface ProjectOption {
  project_id: number;
  property_name: string;
}

interface SourceOption {
  source_id: number;
  source: string;
}

interface BudgetDialogData {
  editData?: {
    project_budget_setup_id: number;
    source_id: number;
    project_id: number;
    budget: number;
    created_by: number;
  };
}

// --- Component ----------------------------------------------------------------

@Component({
  selector: 'app-add-edit-digital-facebook-dialog',
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-edit-digital-facebook-dialog.html',
  styleUrl: './add-edit-digital-facebook-dialog.scss',
})
export class AddEditDigitalFacebookDialog implements OnInit {

  // Injections
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject<MatDialogRef<AddEditDigitalFacebookDialog>>(MatDialogRef);
  readonly dialogData = inject<BudgetDialogData>(MAT_DIALOG_DATA);

  // State
  private readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  readonly projectsList = signal<ProjectOption[]>([]);
  readonly sourcesList = signal<SourceOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  readonly isEditMode = computed(() => !!this.dialogData?.editData);
  readonly projectBudgetSetupId = computed(() => this.dialogData?.editData?.project_budget_setup_id ?? null);

  // Form
  readonly budgetForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    sourceBudgets: new FormArray<FormGroup>([]),
  });

  /** Convenience getter for the FormArray */
  get sourceBudgetsArray(): FormArray<FormGroup> {
    return this.budgetForm.get('sourceBudgets') as FormArray<FormGroup>;
  }

  /** Computed total budget across all sources */
  readonly totalBudget = signal<number>(0);

  // Lifecycle
  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchSources();
    if (this.isEditMode()) {
      this.patchFormValues();
    }
  }

  // Data fetching

  fetchAllProjects(): void {
    this.isLoading.set(true);
    this.commonService
      .fetchUserProjectDropdown(this.userId)
      .pipe(
        catchError(err => { console.error('Error fetching projects:', err); return of([]); }),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: res => this.projectsList.set(res ?? []) });
  }

  fetchSources(): void {
    this.commonService
      .fetchSources()
      .pipe(
        catchError(err => { console.error('Error fetching sources:', err); return of([]); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: res => {
          const sources = res ?? [];
          this.sourcesList.set(sources);
          this.buildSourceBudgetRows(sources);
        },
      });
  }

  // Form helpers

  /** Build one row per source in the FormArray */
  private buildSourceBudgetRows(sources: SourceOption[]): void {
    this.sourceBudgetsArray.clear();
    sources.forEach(src => {
      const group = new FormGroup({
        source_id: new FormControl<number>(src.source_id),
        budget: new FormControl<number | null>(null, [Validators.min(0)]),
      });

      // Listen for budget changes to update total
      group.get('budget')?.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.recalcTotal());

      this.sourceBudgetsArray.push(group);
    });
  }

  /** Recalculate total budget */
  private recalcTotal(): void {
    const total = this.sourceBudgetsArray.controls.reduce((sum, ctrl) => {
      const val = ctrl.get('budget')?.value;
      return sum + (val ? Number(val) : 0);
    }, 0);
    this.totalBudget.set(total);
  }

  private patchFormValues(): void {
    const d = this.dialogData.editData;
    if (!d) return;
    this.budgetForm.patchValue({
      project_id: d.project_id,
    });
    // Patch the matching source row budget after sources load
    // (handled via subscription timing — sources load first, then patch)
    setTimeout(() => {
      const idx = this.sourceBudgetsArray.controls.findIndex(
        ctrl => ctrl.get('source_id')?.value === d.source_id
      );
      if (idx >= 0) {
        this.sourceBudgetsArray.at(idx).patchValue({ budget: d.budget });
      }
    }, 500);
  }

  // Submit

  onSubmit(): void {
    if (this.budgetForm.invalid) {
      Object.values(this.budgetForm.controls).forEach(c => c.markAsTouched());
      return;
    }

    const projectId = this.budgetForm.get('project_id')?.value;
    if (!projectId) return;

    // Build source_budget array: collect rows that have a budget value > 0
    const sourceBudget = this.sourceBudgetsArray.controls
      .map(ctrl => ({
        source_id: ctrl.get('source_id')?.value as number,
        budget: Number(ctrl.get('budget')?.value) || 0,
      }))
      .filter(r => r.budget > 0);

    if (sourceBudget.length === 0) {
      this.snackBar.open('Please enter budget for at least one source', 'OK', { duration: 3000 });
      return;
    }

    this.isSubmitting.set(true);

    // Single API call with source_budget array
    const apiCall = this.projectBudgetSetupId()
      ? this.commonService.editProjectBudget({
          project_budget_setup_id: this.projectBudgetSetupId()!,
          project_id: projectId,
          source_budget: sourceBudget,
          created_by: this.dialogData.editData?.created_by ?? this.userId,
          updated_by: this.userId,
        })
      : this.commonService.addProjectBudget({
          project_id: projectId,
          source_budget: sourceBudget,
          created_by: this.userId,
          updated_by: this.userId,
        });

    apiCall
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: response => {
          if (response.success) {
            this.dialog.open(SuccessDialogComponent, { data: { status: true, message: response.message } });
            this.dialogRef.close(true);
          } else {
            this.dialog.open(SuccessDialogComponent, { data: { status: false, message: response.message || 'Operation failed' } });
          }
        },
        error: err => {
          this.dialog.open(SuccessDialogComponent, {
            data: { status: false, message: err?.error?.message || 'Something went wrong' },
          });
        },
      });
  }

  private openSuccessDialog(message: string, isSuccess: boolean = true): void {
    this.dialog.open(SuccessDialogComponent, { data: { status: isSuccess, message } });
  }
}
