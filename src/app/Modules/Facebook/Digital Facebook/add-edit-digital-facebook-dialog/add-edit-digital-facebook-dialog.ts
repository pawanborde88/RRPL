import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
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
    source_id: new FormControl<number | null>(null, Validators.required),
    budget: new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),

  });

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
      .subscribe({ next: res => this.sourcesList.set(res ?? []) });
  }

  // Form helpers

  private patchFormValues(): void {
    const d = this.dialogData.editData;
    if (!d) return;
    this.budgetForm.patchValue({
      project_id: d.project_id,
      source_id: d.source_id,
      budget: d.budget,
    });
  }

  // Submit

  onSubmit(): void {
    if (this.budgetForm.invalid) {
      Object.values(this.budgetForm.controls).forEach(c => c.markAsTouched());
      return;
    }

    this.isSubmitting.set(true);
    const { project_id, source_id, budget } = this.budgetForm.value;

    const apiCall = this.projectBudgetSetupId()
      ? this.commonService.editProjectBudget({
        project_budget_setup_id: this.projectBudgetSetupId()!,
        source_id: source_id!,
        project_id: project_id!,
        budget: budget!,
        created_by: this.dialogData.editData?.created_by ?? this.userId,
        updated_by: this.userId,
      })
      : this.commonService.addProjectBudget({
        source_id: source_id!,
        project_id: project_id!,
        budget: budget!,
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
