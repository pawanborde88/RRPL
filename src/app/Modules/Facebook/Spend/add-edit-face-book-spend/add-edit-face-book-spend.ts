import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, of, finalize } from 'rxjs';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { CommonService } from '../../../../Service/common/common.service';
import { AddEditDigitalFacebookDialog } from '../../Digital Facebook/add-edit-digital-facebook-dialog/add-edit-digital-facebook-dialog';

interface ProjectOption {
  project_id: number;
  property_name: string;
}

interface SourceOption {
  source_id: number;
  source: string;
}

interface SourceDetailOption {
  source_detail_id: number;
  source_detail: string;
}

interface SpendDialogData {
  editData?: {
    spend_id: number;
    project_id: number;
    source_detail_id: number;
    source_id: number;
    start_date: string;
    end_date: string;
    spend_amount: number;
    remaning_amount: number;
    quantity: number;
  };
}

@Component({
  selector: 'app-add-edit-face-book-spend',
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-edit-face-book-spend.html',
  styleUrl: './add-edit-face-book-spend.scss',
})
export class AddEditFaceBookSpend implements OnInit {
  // Injections
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject<MatDialogRef<AddEditFaceBookSpend>>(MatDialogRef);
  readonly dialogData = inject<SpendDialogData>(MAT_DIALOG_DATA);

  // State
  private readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  readonly projectsList = signal<ProjectOption[]>([]);
  readonly sourcesList = signal<SourceOption[]>([]);
  readonly sourceDetailsList = signal<SourceDetailOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  readonly isEditMode = computed(() => !!this.dialogData?.editData);
  readonly spendId = computed(() => this.dialogData?.editData?.spend_id ?? null);

  // Form
  readonly spendForm = new FormGroup({
    project_id:       new FormControl<number | null>(null, Validators.required),
    source_id:        new FormControl<number | null>(null, Validators.required),
    source_detail_id: new FormControl<number | null>(null, Validators.required),
    start_date:       new FormControl<string | null>(null, Validators.required),
    end_date:         new FormControl<string | null>(null, Validators.required),
    spend_amount:     new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    remaning_amount:  new FormControl<number | null>(null, [Validators.required, Validators.min(0)]),
    quantity:         new FormControl<number | null>(null, [Validators.required, Validators.min(1)]),
  });

  // Lifecycle
  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchSources();

    // When source_id changes, reload source details
    this.spendForm.get('source_id')!.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(sourceId => {
        this.spendForm.get('source_detail_id')!.setValue(null);
        this.sourceDetailsList.set([]);
        if (sourceId) {
          this.fetchSourceDetails(sourceId);
        }
      });

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

  fetchSourceDetails(sourceId: number): void {
    this.commonService
      .fetchSourceDetails(sourceId)
      .pipe(
        catchError(err => { console.error('Error fetching source details:', err); return of([]); }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: res => this.sourceDetailsList.set(res ?? []) });
  }

  // Form helpers

  private patchFormValues(): void {
    const d = this.dialogData.editData;
    if (!d) return;

    if (d.source_id) {
      this.fetchSourceDetails(d.source_id);
    }

    this.spendForm.patchValue({
      project_id: d.project_id,
      source_id: d.source_id,
      source_detail_id: d.source_detail_id,
      start_date: d.start_date,
      end_date: d.end_date,
      spend_amount: d.spend_amount,
      remaning_amount: d.remaning_amount,
      quantity: d.quantity,
    });
  }

  // Submit

  onSubmit(): void {
    if (this.spendForm.invalid) {
      Object.values(this.spendForm.controls).forEach(c => c.markAsTouched());
      return;
    }

    this.isSubmitting.set(true);
    const v = this.spendForm.value;

    const commonPayload = {
      project_id: v.project_id!,
      source_detail_id: v.source_detail_id!,
      source_id: v.source_id!,
      start_date: v.start_date!,
      end_date: v.end_date!,
      spend_amount: v.spend_amount!,
      remaning_amount: v.remaning_amount!,
      quantity: v.quantity!,
      created_by: this.userId,
    };

    const apiCall = this.spendId()
      ? this.commonService.editSpend({ spend_id: this.spendId()!, ...commonPayload })
      : this.commonService.addSpend(commonPayload);

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
