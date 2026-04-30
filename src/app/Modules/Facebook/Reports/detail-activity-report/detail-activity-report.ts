import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { CommonService } from '../../../../Service/common/common.service';
import { CostomLoadingComponent } from '../../../../Common/Reusable/coustom Loader/costom-loading/costom-loading.component';

interface EnquiryFilterForm {
  project_id: FormControl<any | null>;
  start_date: FormControl<Date | null>;
  end_date: FormControl<Date | null>;
  ignore_date_filters: FormControl<boolean | null>;
}

@Component({
  selector: 'app-detail-activity-report',
  standalone: true,
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
    CostomLoadingComponent,

  ],
  templateUrl: './detail-activity-report.html',
  styleUrl: './detail-activity-report.scss',
})
export class DetailActivityReport {
  // Dependency Injection
  private readonly commonService = inject(CommonService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = new DatePipe('en-US');

  // State signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly reportData = signal<any[]>([]);

  // Form definition
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any | null>(null, Validators.required),
    start_date: new FormControl<Date | null>(new Date()),
    end_date: new FormControl<Date | null>(null),
    ignore_date_filters: new FormControl<boolean>(false),
  });

  private readonly userId = computed(() => {
    return Number(sessionStorage.getItem('session_id')) || 0;
  });

  ngOnInit(): void {
    this.fetchAllProjects();
  }

  // ==================== DATA FETCHING ====================
  fetchAllFaceBookList(): void {
    if (this.enquiryFilterForm.invalid) {
      this.showSnackBar('Please select a project.', 'error');
      return;
    }

    const formValue = this.enquiryFilterForm.value;
    const payload = {
      project_id: formValue.project_id,
      start_date: this.datePipe.transform(formValue.start_date, 'yyyy-MM-dd')
    };

    this.loading.set(true);
    this.commonService.fetchDetailActivityReport(payload)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          if (res && res.data) {
            this.reportData.set(res.data);
          } else {
            this.reportData.set([]);
            this.showSnackBar('No data found for the selected filters.');
          }
        },
        error: (err: any) => {
          console.error('Error fetching report:', err);
          this.showSnackBar('An error occurred while fetching the report.', 'error');
        }
      });
  }

  fetchAllProjects(): void {
    const userId = this.userId();
    this.commonService.fetchUserProjectDropdown(userId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res: any) => {
          this.projectsList.set(res || []);
        },
        error: (err: any) => {
          console.error('Error fetching projects:', err);
          this.showSnackBar('Unable to fetch projects.');
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
