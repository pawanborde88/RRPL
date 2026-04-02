import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { DigitalLeadService } from '../../../../Service/digital-lead.service';

/**
 * Interface for project dropdown option
 */
interface ProjectOption {
  project_id: number;
  property_name: string;
}

/**
 * Interface for lead web setup form data
 */
interface LeadWebSetupFormData {
  project_id: number | null;
  description: string | null;
}

@Component({
  selector: 'app-add-digital-lead-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-digital-lead-dialog.component.html',
  styleUrl: './add-digital-lead-dialog.component.scss'
})
export class AddDigitalLeadDialogComponent implements OnInit {
  // Dependency injection
  private readonly digitalLeadService = inject(DigitalLeadService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef);

  // User ID from session storage
  private readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  // Reactive state using signals
  readonly projectsList = signal<ProjectOption[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);

  // Reactive form
  readonly leadWebSetupForm = new FormGroup({
    project_id: new FormControl<number | null>(113, { validators: [Validators.required], nonNullable: false }),
    description: new FormControl<string | null>(null, { validators: [Validators.required], nonNullable: false }),
  });

  ngOnInit(): void {
    this.fetchAllProjects();
  }

  /**
   * Fetch all projects from API using DigitalLeadService (for dropdown)
   */
  private fetchAllProjects(): void {
    this.isLoading.set(true);

    this.digitalLeadService
      .fetchProjectsDropdown()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (projects) => {
          this.projectsList.set(projects);
        },
        error: () => {
          this.snackBar.open('Failed to fetch projects data.', 'Close', {
            duration: 3000,
          });
          this.projectsList.set([]);
        },
      });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.leadWebSetupForm.invalid) {
      this.markFormGroupTouched(this.leadWebSetupForm);
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.leadWebSetupForm.value;

    const payload = {
      project_id: formValue.project_id!,
      description: formValue.description!,
      created_by: this.userId,
    };

    this.digitalLeadService.createLeadWebSetup(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSubmitting.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
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
