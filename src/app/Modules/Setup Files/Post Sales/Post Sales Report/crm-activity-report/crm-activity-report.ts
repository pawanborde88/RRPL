import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { distinctUntilChanged, catchError, of, shareReplay } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { CommonService } from '../../../../../Service/common/common.service';
import { MatDialog } from '@angular/material/dialog';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
interface EnquiryFilterForm {
  project_id: FormControl<any | null>;
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
  ignore_date_filters: FormControl<boolean | null>;
}
@Component({
  selector: 'app-crm-activity-report',
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
  ],
  templateUrl: './crm-activity-report.html',
  styleUrl: './crm-activity-report.scss',
})
export class CrmActivityReport {
  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // Constants
  private readonly DATE_FORMAT = 'yyyy-MM-dd';
  private readonly DEFAULT_PAGE_SIZE = 30;

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly crmReportData = signal<any>(null);

  // Form definition
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any | null>(null, Validators.required),
    start_date: new FormControl<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
    end_date: new FormControl<Date | null>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)),
    ignore_date_filters: new FormControl<boolean>(false),
  });

  // Target Editing state
  readonly editingTarget = signal<boolean>(false);
  readonly targetForm = new FormGroup({
    booking_target: new FormControl<number>(0),
    agreement_target: new FormControl<number>(0),
    disbursement_target: new FormControl<number>(0),
  });

  private readonly formValues = signal<{
    project_id: any | null;
    start_date: Date | null;
    end_date: Date | null;
    ignore_date_filters: boolean;
  }>({
    project_id: null,
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    ignore_date_filters: false,
  });

  // Actions for AG Grid (readonly constant)
  readonly bookingActions: readonly any[] = [] as const;

  // Computed signals for permission checks
  private readonly userId = computed(() => {
    return Number(sessionStorage.getItem('session_id')) || 0;
  });

  private readonly roleData = computed(() => {
    return sessionStorage.getItem('role_id');
  });

  ngOnInit(): void {
    this.fetchAllProjects();
    this.setupFormValueTracking();
  }

  /**
   * Track form value changes and update formValues signal
   * This makes computed signals reactive to form changes
   */
  private setupFormValueTracking(): void {
    // Subscribe to form valueChanges and update signal
    this.enquiryFilterForm.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) =>
          JSON.stringify(prev) === JSON.stringify(curr)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((formValue) => {
        this.formValues.set({
          project_id: formValue.project_id ?? null,
          start_date: formValue.start_date ?? null,
          end_date: formValue.end_date ?? null,
          ignore_date_filters: formValue.ignore_date_filters ?? false,
        });
      });

    // Initialize with current form values
    const initialValue = this.enquiryFilterForm.value;
    this.formValues.set({
      project_id: initialValue.project_id ?? null,
      start_date: initialValue.start_date ?? null,
      end_date: initialValue.end_date ?? null,
      ignore_date_filters: initialValue.ignore_date_filters ?? false,
    });
  }

  // ==================== PERMISSION METHODS ====================
  private hasPermission(...permissions: number[]): boolean {
    const roles = this.roleData();
    if (!roles) return false;
    return permissions.some((permission) => roles.includes(permission.toString()));
  }

  // ==== DATA FETCHING ====
  fetchCrmReport(): void {
    if (this.enquiryFilterForm.invalid) {
      this.enquiryFilterForm.markAllAsTouched();
      this.showSnackBar('Please select a project.', 'error');
      return;
    }

    const formValues = this.formValues();
    const projectId = Array.isArray(formValues.project_id) ? formValues.project_id[0] : formValues.project_id;

    const payload = {
      project_id: projectId,
      from_date: this.formatDate(formValues.start_date) || '',
      to_date: this.formatDate(formValues.end_date) || '',
    };

    this.loading.set(true);
    this.commonService.crm_report(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res && res.status) {
            this.crmReportData.set(res.data);
          } else {
            this.showSnackBar(res?.message || 'Failed to fetch report.', 'error');
            this.crmReportData.set(null);
          }
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error fetching CRM report:', err);
          this.showSnackBar('An error occurred while fetching the report.', 'error');
          this.loading.set(false);
          this.crmReportData.set(null);
        }
      });
  }

  fetchAllFaceBookList(): void {
    this.fetchCrmReport();
  }

  // ==== TARGET EDITING ====
  enableTargetEditing(): void {
    const data = this.crmReportData();
    if (!data) return;

    this.targetForm.patchValue({
      booking_target: data.bookings?.current_target || 0,
      agreement_target: data.agreement?.current_target || 0,
      disbursement_target: data.disbursement?.current_target || 0,
    });
    this.editingTarget.set(true);
  }

  saveMonthlyTarget(): void {
    const data = this.crmReportData();
    if (!data) return;

    const formValues = this.formValues();
    const projectId = Array.isArray(formValues.project_id) ? formValues.project_id[0] : formValues.project_id;
    const targetValues = this.targetForm.value;

    this.loading.set(true);

    if (data.monthly_project_target_id) {
      // Edit existing
      const payload = {
        monthly_project_target_id: data.monthly_project_target_id,
        target_from: this.formatDate(formValues.start_date) || '',
        target_to: this.formatDate(formValues.end_date) || '',
        booking_target: targetValues.booking_target || 0,
        agreement_target: targetValues.agreement_target || 0,
        disbursement_target: targetValues.disbursement_target || 0,
        project_id: projectId,
        updated_by: this.userId(),
      };

      this.commonService.editMonthlyTarget(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (res.success || (res as any)['status']) {
              this.dialog.open(SuccessDialogComponent, {
                width: '400px',
                data: {
                  status: true,
                  message: 'Monthly target updated successfully.',
                },
              });
              this.editingTarget.set(false);
              this.fetchCrmReport(); // Refresh data
            } else {
              this.showSnackBar(res.message || 'Failed to update target.', 'error');
              this.loading.set(false);
            }
          },
          error: (err) => {
            console.error('Error updating target:', err);
            this.showSnackBar('An error occurred while updating.', 'error');
            this.loading.set(false);
          }
        });
    } else {
      // Add new
      const payload = {
        target_from: this.formatDate(formValues.start_date) || '',
        target_to: this.formatDate(formValues.end_date) || '',
        booking_target: targetValues.booking_target || 0,
        agreement_target: targetValues.agreement_target || 0,
        disbursement_target: targetValues.disbursement_target || 0,
        project_id: projectId,
        created_by: this.userId(),
      };

      this.commonService.addMonthlyTarget(payload)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            if (res.success || (res as any)['status']) {
              this.dialog.open(SuccessDialogComponent, {
                width: '400px',
                data: {
                  status: true,
                  message: 'Monthly target added successfully.',
                },
              });
              this.editingTarget.set(false);
              this.fetchCrmReport(); // Refresh data
            } else {
              this.showSnackBar(res.message || 'Failed to add target.', 'error');
              this.loading.set(false);
            }
          },
          error: (err) => {
            console.error('Error adding target:', err);
            this.showSnackBar('An error occurred while adding.', 'error');
            this.loading.set(false);
          }
        });
    }
  }

  cancelTargetEditing(): void {
    this.editingTarget.set(false);
  }

  private buildFilters(formValues: {
    project_id: any[] | null;
    start_date: Date | null;
    end_date: Date | null;
    ignore_date_filters: boolean;
  }): Record<string, any> {
    const filters: Record<string, any> = {
      project_id: formValues.project_id || null,

    };

    // Add date filters if not ignored
    if (!filters['ignore_date_filters']) {
      if (formValues.start_date) {
        filters['start_date'] = this.formatDate(formValues.start_date);
      }
      if (formValues.end_date) {
        filters['end_date'] = this.formatDate(formValues.end_date);
      }
    }

    return filters;
  }

  private formatDate(date: Date | null): string | null {
    if (!date) return null;
    return this.datePipe.transform(date, this.DATE_FORMAT);
  }

  fetchAllProjects(): void {
    const userId = this.userId();

    if (!this.projectsCache$) {
      this.loading.set(true);

      this.projectsCache$ = this.commonService
        .fetchUserProjectDropdown(userId)
        .pipe(
          catchError((err) => {
            console.error('Error fetching projects:', err);
            this.showSnackBar('Unable to fetch projects.');
            return of([]);
          }),
          shareReplay(1)
        );
    }

    this.projectsCache$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.projectsList.set(res || []);
          this.loading.set(false);
        }
      });
  }

  // ==================== HELPER METHODS ====================
  private showSnackBar(message: string, panelClass: 'error' | 'default' = 'default'): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: panelClass === 'error' ? ['snackbar-error'] : undefined,
    });
  }
}
