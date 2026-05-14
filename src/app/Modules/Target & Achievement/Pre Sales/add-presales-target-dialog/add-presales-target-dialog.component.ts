
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
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { MatDialog } from '@angular/material/dialog';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { AddEditSourceTarget } from '../../Source Wise Target/add-edit-source-target/add-edit-source-target';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { CrmActivityReport } from '../../../Setup Files/Post Sales/Post Sales Report/crm-activity-report/crm-activity-report';
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
  apiUrl?: string;
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
    BreadcrumbComponent,
    TemplateComponent,
    CrmActivityReport,
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
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly dialog = inject(MatDialog);

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
  readonly sourceTargets = this.facade.sourceTargets;
  readonly sources = this.facade.sources;
  readonly unitReport = this.facade.unitReport;
  private rowData: any = null;

  // ============================================================================
  // COMPUTED SIGNALS
  // ============================================================================

  readonly submitButtonText = computed(() =>
    this.isEditMode() ? ' Update Target' : 'Add Target'
  );

  readonly unitTypes = computed(() => {
    const report = this.unitReport();
    if (!report || !report.data) return [];
    const types = new Set<string>();
    report.data.forEach((wing: any) => {
      if (wing.Sanctioned && typeof wing.Sanctioned === 'object' && !Array.isArray(wing.Sanctioned)) {
        Object.keys(wing.Sanctioned).forEach(t => types.add(t));
      }
      if (wing.Unsanctioned && typeof wing.Unsanctioned === 'object' && !Array.isArray(wing.Unsanctioned)) {
        Object.keys(wing.Unsanctioned).forEach(t => types.add(t));
      }
    });
    // Common order or sorted
    return Array.from(types).sort();
  });

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
    sourceTargets: new FormArray<FormGroup>([]),
  });

  constructor() {
    // Check for data from dialog or route state
    const navigation = this.router.getCurrentNavigation();
    const routeData = navigation?.extras.state as DialogData;

    this.rowData = routeData?.rowData;
    this.isEditMode.set(!!this.rowData);
    this.setupFormReactivity();

    // React to facade state changes
    effect(() => {
      const targets = this.lastMonthTargets();
      if (targets) {
        this.populateUserTargetsGrid(targets);
      }
    });

    effect(() => {
      const targets = this.sourceTargets();
      if (targets && targets.length > 0) {
        this.populateSourceTargetsGrid(targets);
      }
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.fetchAllProjects();
    this.facade.loadSources();
  }

  get userTargetsArray(): FormArray {
    return this.addTargetForm.get('userTargets') as FormArray;
  }

  get sourceTargetsArray(): FormArray {
    return this.addTargetForm.get('sourceTargets') as FormArray;
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
    const editUserId = this.isEditMode() ? this.rowData?.user_id : null;

    // Delegate API calls to Facade
    this.facade.loadLastMonthTargets(
      project_id,
      editUserId,
      targetFromStr,
      targetToStr
    );

    this.facade.loadSourceTargets(
      project_id,
      targetFromStr,
      targetToStr
    );

    this.facade.loadUnitReport(project_id);
  }

  openAddEditSourceTargetDialog(): void {
    const projectId = this.addTargetForm.get('project_id')?.value;
    const targetFrom = this.addTargetForm.get('target_from')?.value;
    const targetTo = this.addTargetForm.get('target_to')?.value;

    const dialogRef = this.dialog.open(AddEditSourceTarget, {
      width: '60vw',
      maxWidth: '1000px',
      data: {
        editData: projectId ? {
          project_id: projectId,
          target_from: targetFrom,
          target_to: targetTo
        } : null
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Refresh the grid if targets were updated
      if (result) {
        this.refreshUserGrid();
      }
    });
  }

  private populateUserTargetsGrid(groupedData: any[]): void {
    this.userTargetsArray.clear();
    const isEdit = this.isEditMode();

    // Get rowData from dialog or route state
    const rowData = this.rowData;

    groupedData.forEach((group: any) => {
      const roleName = group.role_name;
      const users = group.users || [];

       // Pre-calculate reference totals for footer (handle both field name types)
      const lastMonthBookingTargetTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_booking_target || u.booking_target || 0), 0);
      const lastMonthTokenTargetTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_token_target || u.token_target || 0), 0);
      const lastMonthSiteVisitTargetTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_site_visit_target || u.site_visit_target || 0), 0);
      const lastMonthAgreementTargetTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_agreement_target || 0), 0);
      const lastMonthDisbursementTargetTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_disbursement_target || 0), 0);

      const lastMonthBookingAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_booking_achievement || u.booking_achievement || 0), 0);
      const lastMonthTokenAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_token_achievement || u.token_achievement || 0), 0);
      const lastMonthSiteVisitAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_site_visit_achievement || u.site_visit_achievement || 0), 0);
      const lastMonthLeadAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_lead_achievement || u.lead_achievement || 0), 0);
      const lastMonthAgreementAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_agreement_achievement || u.agreement_achievement || 0), 0);
      const lastMonthDisbursementAchTotal = users.reduce((sum: number, u: any) => sum + (u.last_month_disbursement_achievement || u.disbursement_achievement || 0), 0);

      users.forEach((user: any, index: number) => {
        // Resolve achievement/target values (handle both field name types)
        const lastTarget = user.last_month_booking_target ?? user.booking_target ?? 0;
        const lastAch = user.last_month_booking_achievement ?? user.booking_achievement ?? 0;
        const lastVisitTarget = user.last_month_site_visit_target ?? user.site_visit_target ?? 0;
        const lastVisitAch = user.last_month_site_visit_achievement ?? user.site_visit_achievement ?? 0;
        const lastTokenAch = user.last_month_token_achievement ?? user.token_achievement ?? 0;

        // In edit mode, if this user matches the one we are editing, use targets from rowData
        let currentBookingTarget = user.current_month_booking_target || user.booking_target || null;
        let currentTokenTarget = user.current_month_token_target || user.token_target || null;
        let currentAgreementTarget = user.current_month_agreement_target || user.agreement_target || null;
        let currentDisbursementTarget = user.current_month_disbursement_target || user.disbursement_target || null;

        if (isEdit && rowData && user.user_id === rowData.user_id) {
          currentBookingTarget = rowData.booking_target;
          currentTokenTarget = rowData.token_target;
          currentAgreementTarget = rowData.agreement_target;
          currentDisbursementTarget = rowData.disbursement_target;
        }

        const userGroup = new FormGroup({
          // Group metadata (UI only)
          role_name: new FormControl(roleName),
          is_first_in_role: new FormControl(index === 0),
          is_last_in_role: new FormControl(index === users.length - 1),
          role_count: new FormControl(users.length),

          // Pre-calculated Static Totals (for footer)
          group_total_last_month_booking_target: new FormControl(lastMonthBookingTargetTotal),
          group_total_last_month_token_target: new FormControl(lastMonthTokenTargetTotal),
          group_total_last_month_site_visit_target: new FormControl(lastMonthSiteVisitTargetTotal),
          group_total_last_month_agreement_target: new FormControl(lastMonthAgreementTargetTotal),
          group_total_last_month_disbursement_target: new FormControl(lastMonthDisbursementTargetTotal),

          group_total_last_month_booking_achievement: new FormControl(lastMonthBookingAchTotal),
          group_total_last_month_token_achievement: new FormControl(lastMonthTokenAchTotal),
          group_total_last_month_site_visit_achievement: new FormControl(lastMonthSiteVisitAchTotal),
          group_total_last_month_lead_achievement: new FormControl(lastMonthLeadAchTotal),
          group_total_last_month_agreement_achievement: new FormControl(lastMonthAgreementAchTotal),
          group_total_last_month_disbursement_achievement: new FormControl(lastMonthDisbursementAchTotal),

          pre_sale_target_id: new FormControl(user.pre_sale_target_id || null),
          user_id: new FormControl(user.user_id),
          role_id: new FormControl(user.role_id),
          user_name: new FormControl(user.user_name),

          // Excel Reference Data (Last Month)
          last_month_booking_target: new FormControl(lastTarget),
          last_month_token_target: new FormControl(user.last_month_token_target || 0),
          last_month_site_visit_target: new FormControl(lastVisitTarget),
          last_month_agreement_target: new FormControl(user.last_month_agreement_target || 0),
          last_month_disbursement_target: new FormControl(user.last_month_disbursement_target || 0),

          last_month_booking_achievement: new FormControl(lastAch),
          last_month_token_achievement: new FormControl(lastTokenAch),
          last_month_site_visit_achievement: new FormControl(lastVisitAch),
          last_month_lead_achievement: new FormControl(user.last_month_lead_achievement || 0),
          last_month_agreement_achievement: new FormControl(user.last_month_agreement_achievement || 0),
          last_month_disbursement_achievement: new FormControl(user.last_month_disbursement_achievement || 0),

          // Percentages (from API)
          last_month_booking_percentage: new FormControl(user.last_month_booking_percentage || 0),
          last_month_token_percentage: new FormControl(user.last_month_token_percentage || 0),
          last_month_agreement_percentage: new FormControl(user.last_month_agreement_percentage || 0),
          last_month_disbursement_percentage: new FormControl(user.last_month_disbursement_percentage || 0),
          last_month_lead_percentage: new FormControl(user.last_month_lead_percentage || 0),
          last_month_site_visit_percentage: new FormControl(user.last_month_site_visit_percentage || 0),

          // Computed Display Metrics (for reference)
          conversion_ratio: new FormControl(
            user.role_id === 22 
              ? (user.last_month_disbursement_percentage ?? this.calculateRatio(user.last_month_disbursement_achievement, user.last_month_disbursement_target))
              : this.calculateRatio(lastAch, lastVisitAch)
          ),
          achievement_percent: new FormControl(
            user.role_id === 22 
              ? (user.last_month_agreement_percentage ?? this.calculateRatio(user.last_month_agreement_achievement, user.last_month_agreement_target))
              : (user.last_month_booking_percentage ?? this.calculateRatio(lastAch, lastVisitAch))
          ),
          disbursement_percent: new FormControl(
            user.last_month_disbursement_percentage ?? this.calculateRatio(user.last_month_disbursement_achievement, user.last_month_disbursement_target)
          ),
          performance_status: new FormControl(
            user.role_id === 22 
              ? this.calculateStatus(user.last_month_agreement_achievement, user.last_month_agreement_target)
              : this.calculateStatus(lastAch, lastTarget)
          ),

          // Input Fields (Current Month)
          booking_target: new FormControl(currentBookingTarget, [Validators.min(0)]),
          token_target: new FormControl(currentTokenTarget, [Validators.min(0)]),
          agreement_target: new FormControl(currentAgreementTarget, [Validators.min(0)]),
          disbursement_target: new FormControl(currentDisbursementTarget, [Validators.min(0)]),
        });

        this.userTargetsArray.push(userGroup);
      });
    });
  }

  private populateSourceTargetsGrid(targets: any[]): void {
    this.sourceTargetsArray.clear();
    targets.forEach(item => {
      this.sourceTargetsArray.push(new FormGroup({
        source_id: new FormControl(item.source_id),
        source_name: new FormControl(item.source_name || item.source),
        site_visit_target: new FormControl(item.site_visit_target || 0, [Validators.required, Validators.min(0)]),
        lead_target: new FormControl(item.lead_target || 0, [Validators.required, Validators.min(0)]),
        booking_target: new FormControl(item.booking_target || 0, [Validators.required, Validators.min(0)]),
        site_visit_count: new FormControl(item.site_visit_count || 0),
        booking_count: new FormControl(item.booking_count || 0),
        source_target_id: new FormControl(item.source_target_id || null)
      }));
    });
  }

  /**
   * Dynamically calculates group totals for input fields
   */
  getGroupTotal(roleName: string, controlName: string): number {
    return this.userTargetsArray.controls
      .filter(control => control.get('role_name')?.value === roleName)
      .reduce((sum, control) => {
        const roleId = control.get('role_id')?.value;
        let field = controlName;
        
        // Dynamic field mapping for CRM role
        if (roleId === 22) {
          if (controlName === 'booking_target') field = 'agreement_target';
          else if (controlName === 'token_target') field = 'disbursement_target';
          else if (controlName === 'last_month_booking_target') field = 'last_month_agreement_target';
          else if (controlName === 'last_month_token_target') field = 'last_month_disbursement_target';
          else if (controlName === 'last_month_booking_achievement') field = 'last_month_agreement_achievement';
          else if (controlName === 'last_month_token_achievement') field = 'last_month_disbursement_achievement';
        }
        
        return sum + (control.get(field)?.value || 0);
      }, 0);
  }

  /**
   * Calculates group totals for source targets input fields
   */
  getSourceTotal(controlName: string): number {
    return this.sourceTargetsArray.controls
      .reduce((sum, control) => sum + (control.get(controlName)?.value || 0), 0);
  }

  /**
   * Calculates overall grand total for the entire grid
   */
  getGrandTotal(controlName: string): number {
    return this.userTargetsArray.controls
      .reduce((sum, control) => {
        const roleId = control.get('role_id')?.value;
        let field = controlName;

        // Dynamic field mapping for CRM role
        if (roleId === 22) {
          if (controlName === 'booking_target') field = 'agreement_target';
          else if (controlName === 'token_target') field = 'disbursement_target';
          else if (controlName === 'last_month_booking_target') field = 'last_month_agreement_target';
          else if (controlName === 'last_month_token_target') field = 'last_month_disbursement_target';
        }

        return sum + (control.get(field)?.value || 0);
      }, 0);
  }

  calculateRatio(numerator: any, denominator: any): string {
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

  calculateSoldPercentage(): string {
    const report = this.unitReport();
    if (!report || !report.total_units) return '0';
    const total = Number(report.total_units) || 0;
    const booked = Number(report.total_booked) || 0;
    if (total === 0) return '0';
    return ((booked / total) * 100).toFixed(1);
  }

  getUnitCount(wing: any, type: string, isSanctioned: boolean): number {
    const data = isSanctioned ? wing.Sanctioned : wing.Unsanctioned;
    if (!data || Array.isArray(data)) return 0;
    return data[type] || 0;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================
  private initializeForm(): void {
    if (this.isEditMode()) {
      const rowData = this.rowData;

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

  goBack(): void {
    this.router.navigate(['/target-achievement/pre-sales/all-presale-target-list']);
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

    const userTargetsData = targets
      .filter((t: any) => 
        (t.booking_target || 0) > 0 || 
        (t.token_target || 0) > 0 || 
        (t.agreement_target || 0) > 0 || 
        (t.disbursement_target || 0) > 0 ||
        t.pre_sale_target_id
      )
      .map((t: any) => ({
        project_id: formValue.project_id,
        role_id: t.role_id,
        user_id: t.user_id,
        target_from: targetFrom,
        target_to: targetTo,
        token_target: t.role_id === 22 ? (Number(t.disbursement_target) || 0) : (Number(t.token_target) || 0),
        booking_target: t.role_id === 22 ? (Number(t.agreement_target) || 0) : (Number(t.booking_target) || 0),
        agreement_target: Number(t.agreement_target) || 0,
        disbursement_target: Number(t.disbursement_target) || 0,
        created_by: formValue.created_by,
        remark: formValue.remark,
        active_status_id: formValue.active_status_id,
        ...(t.pre_sale_target_id && {
          pre_sale_target_id: t.pre_sale_target_id,
          updated_by: this.userId
        }),
      }));

    const sourceTargetsData = (formValue.sourceTargets || [])
      .filter((st: any) => 
        (st.site_visit_target || 0) > 0 || 
        (st.lead_target || 0) > 0 || 
        (st.booking_target || 0) > 0 ||
        st.source_target_id
      )
      .map((st: any) => ({
        project_id: formValue.project_id,
        source_id: st.source_id,
        target_from: targetFrom,
        target_to: targetTo,
        site_visit_target: Number(st.site_visit_target) || 0,
        lead_target: Number(st.lead_target) || 0,
        booking_target: Number(st.booking_target) || 0,
        created_by: formValue.created_by,
        remark: formValue.remark,
        active_status_id: formValue.active_status_id,
        ...(st.source_target_id && { 
          source_target_id: st.source_target_id, 
          updated_by: this.userId 
        })
      }));

    return [...userTargetsData, ...sourceTargetsData];
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
