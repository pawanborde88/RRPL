import { Component, Inject, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, of } from 'rxjs';
import { CommonModule } from '@angular/common';

import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { CommonService } from '../../../../Service/common/common.service';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';

@Component({
  selector: 'app-add-edit-annual-commitmentdialog',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule, FormsModule, ReactiveFormsModule, AutocompleteReusableComponent,
  ],
  templateUrl: './add-edit-annual-commitmentdialog.html',
  styleUrl: './add-edit-annual-commitmentdialog.scss',
})
export class AddEditAnnualCommitmentdialog implements OnInit {
  companyGoalForm!: FormGroup;
  isEditMode = false;
  private readonly dialog = inject(MatDialog);

  baseUrl = environment.API_URL;
  userId = Number(sessionStorage.getItem('session_id'));
  projectsList = signal<any[]>([]);
  loading = false;

  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private commonService = inject(CommonService);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddEditAnnualCommitmentdialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.initForm();
    this.fetchAllProjects();
    if (this.data && this.data.editData) {
      this.isEditMode = true;
    }
  }

  initForm() {
    const editData = this.data?.editData || {};
    this.companyGoalForm = this.fb.group({
      project_id: [editData.project_id || '', Validators.required],
      manager_goal: [editData.manager_goal || '', [Validators.required, Validators.min(0)]],
      aspiration_goal: [editData.aspiration_goal ?? '', [Validators.required, Validators.min(0)]],
      aspiration_month: [editData.aspiration_month ?? '', [Validators.required, Validators.min(1), Validators.max(12)]],
      actual_month: [editData.actual_month ?? '', [Validators.required, Validators.min(1), Validators.max(12)]],
    });
  }

  fetchAllProjects(): void {
    this.commonService
      .fetchUserProjectDropdown(this.userId)
      .pipe(
        catchError((err) => {
          this.showSnackBar('Unable to fetch projects.');
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          // Defer so options loading does not mutate form validity during the same CD pass (NG0100).
          setTimeout(() => this.projectsList.set(res || []));
        },
      });
  }

  onSubmit() {
    if (this.companyGoalForm.invalid) {
      this.companyGoalForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.companyGoalForm.value;

    if (this.isEditMode) {
      const payload = {
        company_goal_setup_id: this.data.editData.company_goal_setup_id,
        project_id: formValue.project_id,
        manager_goal: formValue.manager_goal,
        aspiration_goal: formValue.aspiration_goal,
        aspiration_month: formValue.aspiration_month,
        actual_month: formValue.actual_month,
        updated_by: this.userId
      };

      this.http.post(`${this.baseUrl}/update_company_goal`, payload)
        .pipe(
          finalize(() => this.loading = false),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res: any) => {
            this.showSnackBar('Company goal updated successfully');
            this.dialogRef.close(true);
          },
          error: () => {
            this.showSnackBar('Error updating company goal', 'error');
          }
        });
    } else {
      const payload = {
        project_id: formValue.project_id,
        manager_goal: formValue.manager_goal,
        aspiration_goal: formValue.aspiration_goal,
        aspiration_month: formValue.aspiration_month,
        actual_month: formValue.actual_month,
        created_by: this.userId
      };

      this.http.post(`${this.baseUrl}/add_company_goal`, payload)
        .pipe(
          finalize(() => this.loading = false),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe({
          next: (res: any) => {
            this.dialog
            .open(SuccessDialogComponent, {
              data: { message: res.message, status: true },
            })
            .afterClosed()
            .subscribe(() => {
              this.dialogRef.close(true);
            });
          },
          error: () => {
            this.showSnackBar('Error adding company goal', 'error');
          }
        });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  private showSnackBar(message: string, panelClass: 'error' | 'default' = 'default'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass === 'error' ? ['snackbar-error'] : undefined,
    });
  }
}
