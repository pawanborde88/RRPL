import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  ViewChild,
  ChangeDetectionStrategy,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, Router } from '@angular/router';
import { catchError, of, Observable, tap, shareReplay } from 'rxjs';
import { switchMap, distinctUntilChanged, filter } from 'rxjs/operators';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { CommonService } from '../../../../Service/common/common.service';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { CommentLogService } from '../../comment-log/comment-log.service';
import { LeadLevel, CallStatus } from '../../comment-log/comment-log.models';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-reenquiry-report',
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
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-reenquiry-report.component.html',
  styleUrl: './all-reenquiry-report.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllReenquiryReportComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly commonService = inject(CommonService);
  private readonly pipe = new DatePipe('en-US');

  // Computed signals for session data
  private readonly userId = computed(() => {
    return Number(sessionStorage.getItem('session_id')) || 0;
  });

  readonly roleId = computed(() => {
    return Number(sessionStorage.getItem('role_id')) || 0;
  });

  private readonly roleData = computed(() => {
    return sessionStorage.getItem('role_id');
  });

  // Cached observables for performance
  private projectsCache$?: ReturnType<typeof this.commonService.fetchUserProjectDropdown>;

  // Reactive state with signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  readonly statusDropdown = signal<any[]>([]);
  readonly allTelecallerlist = signal<any[]>([]);
  readonly assignedStatus = signal<number>(0);
  readonly searchText = signal<string>('');

  // Computed signals for derived state
  readonly hasFilters = computed(() => {
    const formValues = this.leadForm.value;
    return !!(
      (formValues.project_id ?? []).length ||
      formValues.lead_level_id ||
      formValues.call_status_id ||
      (formValues.status_id ?? []).length ||
      (formValues.telecaller_id ?? []).length ||
      formValues.start_date ||
      formValues.end_date ||
      formValues.start_followup_date ||
      formValues.end_followup_date
    );
  });

  readonly paginationParams = signal({
    offset: 0,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: '',
    filters: {},
    filteredCount: 0,
  });

  // Observable properties for dropdowns
  leadLevels$: Observable<LeadLevel[]> = of([]);
  callStatus$: Observable<CallStatus[]> = of([]);

  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;
  readonly columnDefinitions: readonly TableColumn[] = [
    { key: 'project_names', label: 'Project Name' },
    { key: 'date', label: 'Lead Date', type: 'mediumDate' },
    { key: 'customer_name', label: 'Client Name' },
    { key: 'mobile_no', label: 'Phone', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    { key: 'alternate_mob_no', label: 'Secondary Mobile No', type: 'sensitive' },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
    { key: 'source', label: 'Source' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
  ] as const;

  readonly bookingActions: readonly any[] = [
    {
      action: 'addComment',
      icon: 'add_comment',
      tooltip: 'Follow Up',
      color: 'primary',
      show: (row: any) => row?.telecaller_id !== null
    },
    {
      action: 'viewLog',
      icon: 'dataset',
      tooltip: 'View Log',
      color: 'primary',
      show: (row: any) => row?.telecaller_id !== null
    },
    {
      action: 'editLead',
      icon: 'edit_note',
      tooltip: 'Edit Lead',
      color: 'primary',
      show: (row: any) => row?.telecaller_id !== null && this.hasPermission(1, 2, 4)
    }
  ] as const;

  readonly leadForm = new FormGroup({
    project_id: new FormControl<number[]>([], Validators.required),
    lead_level_id: new FormControl<number | null>(null),
    call_status_id: new FormControl<number | null>(null),
    status_id: new FormControl<number[]>([]),
    telecaller_id: new FormControl<number[]>([]),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
    start_followup_date: new FormControl<Date | null>(null),
    end_followup_date: new FormControl<Date | null>(null),
    ignore_date_filters: new FormControl<boolean>(false),
  });

  // Reactive form values signal
  private readonly formValues = toSignal(this.leadForm.valueChanges, {
    initialValue: this.leadForm.value,
  });

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const userId = [this.userId()];
    const telecallerIdValue = this.getTelecallerIdValue(values, userId);
    const filters = this.buildFilters(values, telecallerIdValue);

    return {
      offset: this.paginationParams().offset,
      limit: this.paginationParams().limit,
      sortBy: this.paginationParams().sortBy,
      sortOrder: this.paginationParams().sortOrder,
      filters,
    };
  });

  constructor(
    private readonly dialog: MatDialog,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
    private readonly commentLogService: CommentLogService
  ) {
    this.setupFormListeners();
  }

  private setupFormListeners(): void {
    // Ignore date filters listener
    this.leadForm
      .get('ignore_date_filters')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged()
      )
      .subscribe((checked) => {
        if (checked) {
          this.leadForm.get('start_date')?.reset();
          this.leadForm.get('end_date')?.reset();
          this.leadForm.get('start_followup_date')?.reset();
          this.leadForm.get('end_followup_date')?.reset();
        }
      });

    // Project ID listener for telecaller dropdown
    this.leadForm
      .get('project_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        filter((projectId): projectId is number[] => !!projectId && Array.isArray(projectId) && projectId.length > 0)
      )
      .subscribe((projectId) => {
        this.fetchAllTalecallerList(projectId);
      });
  }

  ngOnInit(): void {
    this.fetchAllProjects();
    this.fetchAllEnquiryStatus();
    this.setupLeadLevelListener();

    // Initialize lead levels observable
    this.leadLevels$ = this.commentLogService.fetchLeadLevels().pipe(
      catchError(() => {
        this.snackBar.open('Unable to fetch lead levels.', 'Close', { duration: 3000 });
        return of([]);
      }),
      shareReplay(1),
      takeUntilDestroyed(this.destroyRef)
    );
  }

  private setupLeadLevelListener(): void {
    this.leadForm
      .get('lead_level_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        distinctUntilChanged(),
        tap(() => {
          // Reset call status when lead level changes
          this.callStatus$ = of([]);
          this.leadForm.get('call_status_id')?.reset();
        }),
        filter((value): value is number => typeof value === 'number' && value > 0),
        switchMap((leadLevelId: number) =>
          this.commentLogService.fetchCallStatus(leadLevelId).pipe(
            catchError(() => {
              this.snackBar.open('Unable to fetch call statuses.', 'Close', { duration: 3000 });
              return of([]);
            })
          )
        )
      )
      .subscribe((callStatuses: CallStatus[]) => {
        this.callStatus$ = of(callStatuses);
      });
  }

  // TrackBy functions for performance optimization
  trackByLeadLevelId(_index: number, level: LeadLevel): number {
    return level.lead_level_id;
  }

  trackByCallStatusId(_index: number, status: CallStatus): number {
    return status.call_status_id;
  }

  trackByProjectId(_index: number, item: any): number {
    return item.project_id || _index;
  }

  hasPermission(...permissions: any[]): boolean {
    const roleData = this.roleData();
    if (!roleData) return false;
    return permissions.some(permission => roleData.includes(String(permission)));
  }

  hasExactRole(roleId: number): boolean {
    const roleData = this.roleData();
    if (!roleData) return false;
    const currentRoles = roleData.split(',').map(Number);
    return currentRoles.length === 1 && currentRoles[0] === roleId;
  }

  private getTelecallerIdValue(formValues: any, userId: number[]): number[] | null {
    if (this.hasExactRole(7) || this.hasExactRole(13)) {
      return userId;
    }
    if (formValues.telecaller_id?.length > 0) {
      return Array.isArray(formValues.telecaller_id)
        ? formValues.telecaller_id.map((id: any) => Number(id))
        : [Number(formValues.telecaller_id)];
    }
    return null;
  }

  private buildFilters(formValues: any, telecallerIdValue: number[] | null) {
    return {
      project_id: formValues.project_id?.length ? formValues.project_id : null,
      lead_level_id: formValues.lead_level_id || null,
      call_status_id: formValues.call_status_id || null,
      status_id: formValues.status_id?.length ? formValues.status_id : null,
      telecaller_id: telecallerIdValue,
      start_date: formValues.start_date
        ? this.pipe.transform(formValues.start_date, 'yyyy-MM-dd')
        : null,
      end_date: formValues.end_date
        ? this.pipe.transform(formValues.end_date, 'yyyy-MM-dd')
        : null,
      start_followup_date: formValues.start_followup_date
        ? this.pipe.transform(formValues.start_followup_date, 'yyyy-MM-dd')
        : null,
      end_followup_date: formValues.end_followup_date
        ? this.pipe.transform(formValues.end_followup_date, 'yyyy-MM-dd')
        : null,
      ignore_date_filters: formValues.ignore_date_filters ? 1 : 0,
      user_id: this.userId(),
      re_enquiry: 1,
      search: this.searchText(),
      assigned_status: this.assignedStatus(),
    };
  }

  fetchAllTalecallerList(projectId: number[]): void {
    this.commonService
      .fetchTelecallerDropdown(projectId)
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch telecallers.', 'Close', { duration: 3000 });
          return of([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((res) => {
        this.allTelecallerlist.set(
          res.map((item) => ({
            ...item,
            full_name: `${item.first_name} ${item.last_name}`,
          }))
        );
      });
  }

  fetchAllProjects(): void {
    const userId = this.userId();

    if (!this.projectsCache$) {
      this.loading.set(true);

      this.projectsCache$ = this.commonService
        .fetchUserProjectDropdown(userId)
        .pipe(
          catchError(() => {
            this.snackBar.open('Unable to fetch projects.', 'Close', { duration: 3000 });
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

  fetchAllEnquiryStatus(): void {
    this.commonService
      .fetchEnquiryStatusDropdown()
      .pipe(
        catchError(() => {
          this.snackBar.open('Unable to fetch enquiry status.', 'Close', { duration: 3000 });
          return of([]);
        }),
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.statusDropdown.set(res || []);
        }
      });
  }

  refreshAgGridData(): void {
    if (!this.hasFilters()) {
      this.snackBar.open('Please select filter options.', 'Close', { duration: 3000 });
      return;
    }
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }
}
