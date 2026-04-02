
import { CommonModule, DatePipe } from '@angular/common';
import { PresalesFacade } from '../state/presales.facade';
import { effect } from '@angular/core';
import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  FormArray,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { catchError, tap, of, combineLatest, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { environment } from '../../../../../environments/environment';

interface Project {
  project_id: number;
  property_name: string;
}

interface User {
  user_id: number;
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

interface DialogData {
  title: string;
  successMessage: string;
  rowData?: any;
}

@Component({
  selector: 'app-add-presales-target-dialog',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-presales-target-dialog.component.html',
  styleUrl: './add-presales-target-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class AddPresalesTargetDialogComponent implements OnInit {
  // ============================================================================
  // DEPENDENCY INJECTION
  // ============================================================================
  private readonly facade = inject(PresalesFacade);
  private readonly snackBar = inject(MatSnackBar);
  private readonly datePipe = inject(DatePipe);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<AddPresalesTargetDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  // ============================================================================
  // CONSTANTS
  // ============================================================================
  private readonly baseUrl = environment.API_URL;
  private readonly userId = Number(sessionStorage.getItem('session_id')) || 0;

  // ============================================================================
  // SIGNALS - STATE MANAGEMENT
  // ============================================================================
  readonly projectsList = this.facade.projects;
  readonly isEditMode = signal<boolean>(false);
  readonly preSaleTargetId = signal<number | null>(null);
  readonly isLoading = this.facade.isLoading;
  readonly lastMonthTargets = this.facade.lastMonthTargets;

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================

  readonly submitButtonText = computed(() =>
    this.isEditMode() ? ' Update Target' : 'Add Target'
  );

  // ============================================================================
  // REACTIVE FORM
  // ============================================================================
  readonly addTargetForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    target_from: new FormControl<Date | string | null>(null),
    target_to: new FormControl<Date | string | null>(null),
    remark: new FormControl<string>(''),
    active_status_id: new FormControl<number>(1),
    created_by: new FormControl<number>(this.userId),
    userTargets: new FormArray<FormGroup>([]),
  });

  constructor() {
    this.isEditMode.set(!!this.data?.rowData);
    this.setupFormReactivity();

    // React to facade state changes
    effect(() => {
      const targets = this.lastMonthTargets();
      if (targets) {
        this.populateUserTargetsGrid(targets);
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.fetchAllProjects();
  }

  get userTargetsArray(): FormArray {
    return this.addTargetForm.get('userTargets') as FormArray;
  }

  // ============================================================================
  // FORM REACTIVITY SETUP
  // ============================================================================
  private setupFormReactivity(): void {
    // Combine all relevant form value changes
    combineLatest([
      this.addTargetForm.get('project_id')!.valueChanges.pipe(startWith(this.addTargetForm.get('project_id')?.value)),
      this.addTargetForm.get('target_from')!.valueChanges.pipe(startWith(this.addTargetForm.get('target_from')?.value)),
      this.addTargetForm.get('target_to')!.valueChanges.pipe(startWith(this.addTargetForm.get('target_to')?.value)),
    ])
      .pipe(
        debounceTime(300), // Wait for 300ms pause in events
        distinctUntilChanged((prev, curr) => {
          // Check if values actually changed to avoid unnecessary calls
          return JSON.stringify(prev) === JSON.stringify(curr);
        }),
        tap(() => this.refreshUserGrid()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private refreshUserGrid(): void {
    const { project_id, target_from, target_to } = this.addTargetForm.getRawValue();

    // Clear grid if minimum requirements aren't met
    if (!project_id || !target_from || !target_to) {
      this.userTargetsArray.clear();
      return;
    }

    const targetFromStr = this.datePipe.transform(target_from, 'yyyy-MM-dd');
    const targetToStr = this.datePipe.transform(target_to, 'yyyy-MM-dd');

    // Extract user_id if in edit mode to filter targets for that specific user
    const editUserId = this.isEditMode() ? this.data?.rowData?.user_id : null;

    // Delegate API call to Facade
    this.facade.loadLastMonthTargets(
      project_id,
      editUserId,
      targetFromStr,
      targetToStr
    );
  }

  private populateUserTargetsGrid(groupedData: any[]): void {
    this.userTargetsArray.clear();
    const isEdit = this.isEditMode();
    const rowData = this.data?.rowData;

    groupedData.forEach((group: any) => {
      const roleName = group.role_name;
      const users = group.users || [];

      // Pre-calculate reference totals for footer (handle both field name types)
      const lastMonthBookingTargetTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_booking_target || u.booking_target || 0), 0);
      const lastMonthSiteVisitAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_site_visit_achievement || u.site_visit_achievement || 0), 0);
      const lastMonthBookingAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_booking_achievement || u.booking_achievement || 0), 0);
      const lastMonthTokenAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_token_achievement || u.token_achievement || 0), 0);
      const lastMonthSiteVisitTargetTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_site_visit_target || u.site_visit_target || 0), 0);

      users.forEach((user: any, index: number) => {
        // Resolve achievement/target values (handle both field name types)
        const lastTarget = user.last_month_booking_target ?? user.booking_target ?? 0;
        const lastAch = user.last_month_booking_achievement ?? user.booking_achievement ?? 0;
        const lastVisitTarget = user.last_month_site_visit_target ?? user.site_visit_target ?? 0;
        const lastVisitAch = user.last_month_site_visit_achievement ?? user.site_visit_achievement ?? 0;
        const lastTokenAch = user.last_month_token_achievement ?? user.token_achievement ?? 0;

        // In edit mode, if this user matches the one we are editing, use targets from rowData
        let currentBookingTarget = user.current_month_booking_target || null;
        let currentTokenTarget = user.current_month_token_target || null;

        if (isEdit && rowData && user.user_id === rowData.user_id) {
          currentBookingTarget = rowData.booking_target;
          currentTokenTarget = rowData.token_target;
        }

        const userGroup = new FormGroup({
          // Group metadata (UI only)
          role_name: new FormControl(roleName),
          is_first_in_role: new FormControl(index === 0),
          is_last_in_role: new FormControl(index === users.length - 1),
          role_count: new FormControl(users.length),

          // Pre-calculated Static Totals (for footer)
          group_total_last_month_booking_target: new FormControl(lastMonthBookingTargetTotal),
          group_total_last_month_site_visit_achievement: new FormControl(lastMonthSiteVisitAchTotal),
          group_total_last_month_booking_achievement: new FormControl(lastMonthBookingAchTotal),
          group_total_last_month_token_achievement: new FormControl(lastMonthTokenAchTotal),
          group_total_last_month_site_visit_target: new FormControl(lastMonthSiteVisitTargetTotal),

          pre_sale_target_id: new FormControl(user.pre_sale_target_id || null),
          user_id: new FormControl(user.user_id),
          role_id: new FormControl(user.role_id),
          user_name: new FormControl(user.user_name),

          // Excel Reference Data (Last Month)
          last_month_booking_target: new FormControl(lastTarget),
          last_month_booking_achievement: new FormControl(lastAch),
          last_month_site_visit_target: new FormControl(lastVisitTarget),
          last_month_site_visit_achievement: new FormControl(lastVisitAch),
          last_month_token_achievement: new FormControl(lastTokenAch),

          // Computed Display Metrics (for reference)
          conversion_ratio: new FormControl(this.calculateRatio(lastAch, lastVisitAch)),
          achievement_percent: new FormControl(this.calculateRatio(lastAch, lastTarget)),
          performance_status: new FormControl(this.calculateStatus(lastAch, lastTarget)),

          // Input Fields (Current Month)
          booking_target: new FormControl(currentBookingTarget, [Validators.required, Validators.min(0)]),
          token_target: new FormControl(currentTokenTarget, [Validators.min(0)]),
        });

        this.userTargetsArray.push(userGroup);
      });
    });
  }

  /**
   * Dynamically calculates group totals for input fields
   */
  getGroupTotal(roleName: string, controlName: string): number {
    return this.userTargetsArray.controls
      .filter(control => control.get('role_name')?.value === roleName)
      .reduce((sum, control) => sum + (control.get(controlName)?.value || 0), 0);
  }

  /**
   * Calculates overall grand total for the entire grid
   */
  getGrandTotal(controlName: string): number {
    return this.userTargetsArray.controls
      .reduce((sum, control) => sum + (control.get(controlName)?.value || 0), 0);
  }

  private calculateRatio(numerator: any, denominator: any): string {
    const n = parseFloat(numerator) || 0;
    const d = parseFloat(denominator) || 0;
    if (d === 0) return '0.00';
    return ((n / d) * 100).toFixed(2);
  }

  private calculateStatus(actual: any, target: any): string {
    const a = parseFloat(actual) || 0;
    const t = parseFloat(target) || 0;
    if (t === 0) return a > 0 ? 'Accelerator' : 'Struggler';
    const percent = (a / t) * 100;
    if (percent >= 100) return 'Accelerator';
    if (percent >= 50) return 'Average';
    return 'Struggler';
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  private initializeForm(): void {
    if (this.isEditMode()) {
      const rowData = this.data.rowData;
      this.preSaleTargetId.set(rowData.pre_sale_target_id);

      // Patch the main form with project and dates
      this.addTargetForm.patchValue({
        project_id: rowData.project_id,
        target_from: rowData.target_from,
        target_to: rowData.target_to,
        remark: rowData.remark,
        active_status_id: rowData.active_status_id,
      });

      // refreshUserGrid will be triggered by project_id change or manual call if needed
      // Since project_id is already set, we might need to call refreshUserGrid manually if valueChanges doesn't fire
    } else {
      // Set default values to current month for new targets
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      this.addTargetForm.patchValue({
        target_from: firstDayOfMonth,
        target_to: lastDayOfMonth,
      });
    }
  }

  // ============================================================================
  // DATE NAVIGATION
  // ============================================================================
  shiftMonth(offset: number): void {
    const currentFrom = this.addTargetForm.get('target_from')?.value;
    if (!currentFrom) return;

    const fromDate = new Date(currentFrom);
    // Determine the current month start to safely calculate the next/prev month
    const year = fromDate.getFullYear();
    const month = fromDate.getMonth();

    // Set to the first day of the new month
    const newFrom = new Date(year, month + offset, 1);
    // Set to the last day of the new month
    const newTo = new Date(year, month + offset + 1, 0);

    this.addTargetForm.patchValue({
      target_from: newFrom,
      target_to: newTo
    });
  }

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================
  onSubmit(): void {
    const formDataList = this.prepareFormData();

    if (!this.addTargetForm.get('project_id')?.value) {
      this.showSnackBar('Please select a project first');
      return;
    }

    if (formDataList.length === 0) {
      this.showSnackBar('Please enter at least one target before submitting');
      return;
    }

    const apiEndpoint = this.isEditMode()
      ? 'update_pre_sale_target'
      : 'add_pre_sale_target';

    this.facade.saveTarget(apiEndpoint, formDataList)
      .pipe(
        tap((res) => {
          this.dialogRef.close(true);
          this.showSnackBar(res.message || 'Targets updated successfully');
        }),
        catchError((error) => {
          this.handleError(error);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  // ============================================================================
  // DATA PREPARATION
  // ============================================================================
  private prepareFormData(): any[] {
    const formValue = this.addTargetForm.getRawValue();
    const targets = formValue.userTargets || [];

    const targetFrom = formValue.target_from
      ? this.datePipe.transform(formValue.target_from, 'yyyy-MM-dd')!
      : null;
    const targetTo = formValue.target_to
      ? this.datePipe.transform(formValue.target_to, 'yyyy-MM-dd')!
      : null;

    // Filter to only include records that have at least one numeric target > 0
    return targets
      .filter((t: any) => (t.booking_target || 0) > 0 || (t.site_visit_target || 0) > 0)
      .map((t: any) => ({
        project_id: formValue.project_id,
        role_id: t.role_id,
        user_id: t.user_id,
        target_from: targetFrom,
        target_to: targetTo,
        token_target: t.token_target || 0,
        booking_target: t.booking_target || 0,
        created_by: formValue.created_by,
        ...(this.isEditMode() && {
          pre_sale_target_id: t.pre_sale_target_id,
        }),
      }));
  }

  // ============================================================================
  // API CALLS
  // ============================================================================

  private fetchAllProjects(): void {
    this.facade.loadProjects(this.userId);
  }

  // ============================================================================
  // SUCCESS/ERROR HANDLING
  // ============================================================================
  private handleError(error: any): void {
    const message = error.error?.message || 'Something went wrong. Please try again.';
    this.showSnackBar(message);
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
    });
  }
}
