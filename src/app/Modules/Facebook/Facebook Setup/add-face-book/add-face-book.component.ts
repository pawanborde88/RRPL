import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, DestroyRef, signal, computed, OnInit } from '@angular/core';
import {
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialog,
  MAT_DIALOG_DATA,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { CommonService } from '../../../../Service/common/common.service';

/**
 * Interface for project dropdown option
 */
interface ProjectOption {
  project_id: number;
  property_name: string;
}

/**
 * Interface for Facebook setup form data
 */
interface FacebookSetupFormData {
  project_id: number | null;
  form_id: string | null;
  integration_name: string | null;
  created_by: number;
  updated_by: number;
  facebook_setup_id: number | null;
  meta_cost: string | null;
  branding_cost: string | null;
}

/**
 * Interface for dialog data
 */
interface FacebookDialogData {
  editData?: {
    facebook_setup_id: number;
    project_id: number;
    form_id: string;
    integration_name?: string;
    meta_cost?: string;
    branding_cost?: string;
  };
}

/**
 * High-performance Facebook Setup Component with Angular 17+ advanced patterns:
 * - Standalone component with optimized tree-shakeable imports
 * - Signals for reactive state management
 * - OnPush change detection for minimal re-renders
 * - takeUntilDestroyed for automatic subscription cleanup
 * - inject() function for clean DI
 * - Computed values for derived state
 * - Production-grade error handling
 * - CommonService for centralized API calls
 */
@Component({
  selector: 'app-add-face-book',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-face-book.component.html',
  styleUrl: './add-face-book.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFaceBookComponent implements OnInit {
  // Dependency injection using inject() function
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject<MatDialogRef<AddFaceBookComponent>>(MatDialogRef);
  readonly dialogData = inject<FacebookDialogData>(MAT_DIALOG_DATA);

  // User ID from session storage (computed once)
  private readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  // Reactive state using signals
  readonly projectsList = signal<ProjectOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  // Computed values for reactive template bindings
  readonly isEditMode = computed(() => !!this.dialogData?.editData);
  readonly facebookSetupId = computed(() => this.dialogData?.editData?.facebook_setup_id ?? null);
  readonly isFormValid = computed(() => this.addFaceBookForm.valid);

  // Reactive form with proper typing
  readonly addFaceBookForm = new FormGroup<{
    project_id: FormControl<number | null>;
    form_id: FormControl<string | null>;
    integration_name: FormControl<string | null>;
    meta_cost: FormControl<string | null>;
    branding_cost: FormControl<string | null>;
    created_by: FormControl<number>;
    updated_by: FormControl<number>;
    facebook_setup_id: FormControl<number | null>;
  }>({
    project_id: new FormControl<number | null>(null, { validators: [Validators.required], nonNullable: false }),
    form_id: new FormControl<string | null>(null, { validators: [Validators.required], nonNullable: false }),
    integration_name: new FormControl<string | null>(null, { nonNullable: false }),
    meta_cost: new FormControl<string | null>(null, { nonNullable: false }),
    branding_cost: new FormControl<string | null>(null, { nonNullable: false }),
    created_by: new FormControl<number>(this.userId, { nonNullable: true }),
    updated_by: new FormControl<number>(this.userId, { nonNullable: true }),
    facebook_setup_id: new FormControl<number | null>(null, { nonNullable: false }),
  });

  ngOnInit(): void {
    this.fetchAllProjects();

    if (this.isEditMode()) {
      this.patchFormValues();
    }
  }

  /**
   * Fetch all projects from API using CommonService
   */
   fetchAllProjects(): void {
     this.isLoading.set(true);
     const userId = this.userId;
 
     this.commonService
       .fetchUserProjectDropdown(userId)
       .pipe(
         catchError((err) => {
           console.error('Error fetching projects:', err);
           return of([]);
         }),
         finalize(() => this.isLoading.set(false)),
         takeUntilDestroyed(this.destroyRef)
       )
       .subscribe({
         next: (res) => {
           this.projectsList.set(res || []);
         },
       });
   }
  /**
   * Patch form values when in edit mode
   */
  private patchFormValues(): void {
    const editData = this.dialogData.editData;
    if (!editData) return;

    this.addFaceBookForm.patchValue({
      project_id: editData.project_id,
      form_id: editData.form_id,
      integration_name: editData.integration_name ?? null,
      facebook_setup_id: editData.facebook_setup_id,
      meta_cost: editData.meta_cost ?? null,
      branding_cost: editData.branding_cost ?? null,
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.addFaceBookForm.invalid) {
      this.markFormGroupTouched(this.addFaceBookForm);
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.addFaceBookForm.value as FacebookSetupFormData;

    const payload = this.facebookSetupId()
      ? {
          facebook_setup_id: this.facebookSetupId()!,
          project_id: formValue.project_id!,
          form_id: formValue.form_id!,
          integration_name: formValue.integration_name ?? undefined,
          meta_cost: formValue.meta_cost ?? undefined,
          branding_cost: formValue.branding_cost ?? undefined,
          updated_by: this.userId,
        }
      : {
          project_id: formValue.project_id!,
          form_id: formValue.form_id!,
          integration_name: formValue.integration_name ?? undefined,
          meta_cost: formValue.meta_cost ?? undefined,
          branding_cost: formValue.branding_cost ?? undefined,
          created_by: this.userId,
          updated_by: this.userId,
        };

    const apiCall = this.facebookSetupId()
      ? this.commonService.editFacebookSetup(payload as Parameters<typeof this.commonService.editFacebookSetup>[0])
      : this.commonService.addFacebookSetup(payload as Parameters<typeof this.commonService.addFacebookSetup>[0]);

    apiCall
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.addFaceBookForm.reset({
              created_by: this.userId,
              updated_by: this.userId,
            });
            this.openSuccessDialog(response.message);
            this.dialogRef.close(true);
          } else {
            this.openSuccessDialog(response.message || 'Operation failed', false);
          }
        },
        error: (error) => {
          this.openSuccessDialog(
            error.error?.message || 'Something went wrong',
            false
          );
        },
      });
  }

  /**
   * Open success/error dialog
   */
  private openSuccessDialog(message: string, isSuccess: boolean = true): void {
    this.dialog.open(SuccessDialogComponent, {
      data: {
        status: isSuccess,
        message,
      },
    });
  }

  /**
   * Mark all form controls as touched for validation display
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
