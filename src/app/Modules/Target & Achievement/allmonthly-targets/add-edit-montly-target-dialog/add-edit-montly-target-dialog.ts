import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, finalize, of } from 'rxjs';
import { CommonService } from '../../../../Service/common/common.service';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

@Component({
  selector: 'app-add-edit-montly-target-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AngularMaterialModule, AutocompleteReusableComponent],
  templateUrl: './add-edit-montly-target-dialog.html',
  styleUrl: './add-edit-montly-target-dialog.scss',
  providers: [DatePipe]
})
export class AddEditMontlyTargetDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddEditMontlyTargetDialog>);
  private readonly data = inject(MAT_DIALOG_DATA);
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly datePipe = inject(DatePipe);

  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  targetForm!: FormGroup;
  isEditMode = false;
  userId = Number(sessionStorage.getItem('session_id'));

  ngOnInit(): void {
    this.isEditMode = !!this.data.editData;
    this.initForm();
    this.fetchProjects();
    if (this.isEditMode) {
      this.patchFormValues();
    }
  }

  private initForm(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    this.targetForm = this.fb.group({
      project_id: [null, Validators.required],
      target_from: [firstDay, Validators.required],
      target_to: [lastDay, Validators.required],
      booking_target: [0, [Validators.required, Validators.min(0)]],
      agreement_target: [0, [Validators.required, Validators.min(0)]],
      disbursement_target: [0, [Validators.required, Validators.min(0)]],
    });
  }

  private fetchProjects(): void {
    this.commonService.fetchUserProjectDropdown(this.userId).subscribe({
      next: (res) => this.projectsList.set(res || []),
      error: (err) => console.error('Error fetching projects:', err)
    });
  }

  private patchFormValues(): void {
    const editData = this.data.editData;
    this.targetForm.patchValue({
      project_id: editData.project_id,
      target_from: editData.target_from,
      target_to: editData.target_to,
      booking_target: editData.booking_target,
      agreement_target: editData.agreement_target,
      disbursement_target: editData.disbursement_target,
    });
  }

  onSave(): void {
    if (this.targetForm.invalid) {
      this.targetForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const formValue = this.targetForm.value;

    // Format dates to YYYY-MM-DD
    const payload: any = {
      ...formValue,
      target_from: this.datePipe.transform(formValue.target_from, 'yyyy-MM-dd'),
      target_to: this.datePipe.transform(formValue.target_to, 'yyyy-MM-dd'),
    };

    if (this.isEditMode) {
      payload.monthly_project_target_id = this.data.editData.monthly_project_target_id;
      payload.updated_by = this.userId;

      this.commonService.editMonthlyTarget(payload)
        .pipe(
          finalize(() => this.loading.set(false)),
          catchError((err) => {
            this.showSnackBar('Error updating monthly target', 'error');
            return of(null);
          })
        )
        .subscribe((res) => {
          if (res) {
            this.showSnackBar('Monthly target updated successfully');
            this.dialogRef.close(true);
          }
        });
    } else {
      payload.created_by = this.userId;
      this.commonService.addMonthlyTarget(payload)
        .pipe(
          finalize(() => this.loading.set(false)),
          catchError((err) => {
            this.showSnackBar('Error adding monthly target', 'error');
            return of(null);
          })
        )
        .subscribe((res) => {
          if (res) {
            this.showSnackBar('Monthly target added successfully');
            this.dialogRef.close(true);
          }
        });
    }
  }

  private showSnackBar(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: type === 'error' ? ['snackbar-error'] : undefined
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
