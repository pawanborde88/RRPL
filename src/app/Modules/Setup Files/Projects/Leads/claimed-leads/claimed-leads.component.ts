import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Sort } from '@angular/material/sort';
import { debounceTime, distinctUntilChanged, filter, startWith, switchMap, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ResizableColumnDirective } from '../../../../../Common/directives/resizable-column.directive';
import { PaginationComponent } from '../../../../../Common/pagination/pagination.component';
import { ReusableTableComponent, TableColumn, ActionButton } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { ColumnDynamicColorService } from '../../../../../Service/Column-Colors/column-dynamic-color.service';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { CommentLogComponent } from '../../../comment-log/comment-log.component';
import { CallStatus, LeadLevel } from '../../../comment-log/comment-log.models';
import { ImportFloorUnitsComponent } from '../../../Floor Unit/import-floor-units/import-floor-units.component';
import { AddProjectleadComponent } from '../add-projectlead/add-projectlead.component';
import { AssignLeadsComponent } from '../assign-leads/assign-leads.component';
import { FacebookQuestionComponent } from '../facebook-question/facebook-question.component';
import { ConfirmationDialogComponent } from '../../../../../Common/Reusable/ConfirmDialog/confirm-dialog/confirm-dialog.component';
import { AllCallRecordingsComponent } from '../../../../../Dialogs/all-call-recordings/all-call-recordings.component';
import { WhatAppChattingDialogComponent } from '../../../../WhatsApp/what-app-chatting-dialog/what-app-chatting-dialog.component';
import { ClaimedLeadsFacade } from './claimed-leads.facade';
import { LeadData, Telecaller } from './claimed-leads.models';
import { environment } from '../../../../../../environments/environment';

const SCROLL_THRESHOLD = 15;
const DEBOUNCE_TIME_MS = 500;
const GRID_REFRESH_DEBOUNCE_MS = 600;
const DATE_FORMAT = 'yyyy-MM-dd';

@Component({
  selector: 'app-claimed-leads',
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
    ResizableColumnDirective,
    AutocompleteReusableComponent,
    ReusableTableComponent,
    PaginationComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './claimed-leads.component.html',
  styleUrl: './claimed-leads.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClaimedLeadsComponent implements OnInit {
  readonly facade = inject(ClaimedLeadsFacade);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly columnDynamicColorService = inject(ColumnDynamicColorService);
  private readonly datePipe = new DatePipe('en-US');

  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent<LeadData>;

  readonly enquiryFilterForm = new FormGroup({
    project_id: new FormControl<number[]>([], [Validators.required]),
    lead_level_id: new FormControl<number | null>(null),
    call_status_id: new FormControl<number | null>(null),
    status_id: new FormControl<number[]>([]),
    telecaller_id: new FormControl<number[]>([]),
    source_id: new FormControl<number | null>(null),
    source_detail_id: new FormControl<number | null>(null),
    channel_partner_id: new FormControl<number | null>(null),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(null),
    start_followup_date: new FormControl<Date | null>(null),
    end_followup_date: new FormControl<Date | null>(null),
    ignore_date_filters: new FormControl<boolean>(false),
  });

  readonly isNotChannelPartnerSource = computed(() => this.enquiryFilterForm.get('source_id')?.value !== 3);

  readonly formValues = toSignal(this.enquiryFilterForm.valueChanges.pipe(startWith(this.enquiryFilterForm.value)), {
    initialValue: this.enquiryFilterForm.value
  });

  private lastAgGridPayload: string = '';
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const projectId = values?.project_id;

    if (!Array.isArray(projectId) || projectId.length === 0) {
      return null;
    }

    const telecallerIdValue = this.getTelecallerIdValue(values);
    const filters = this.buildFiltersObject(values, telecallerIdValue);
    const paginationState = this.facade.paginationParams();

    const newPayload = {
      offset: paginationState.offset,
      limit: paginationState.limit,
      sortBy: paginationState.sortBy,
      sortOrder: paginationState.sortOrder,
      filters: {
        ...filters,
        search: this.facade.globalSearchTerm(),
        assigned_status: this.facade.assignedStatus(),
      }
    };

    const newPayloadStr = JSON.stringify(newPayload);
    if (newPayloadStr === this.lastAgGridPayload) {
      return JSON.parse(this.lastAgGridPayload);
    }

    this.lastAgGridPayload = newPayloadStr;
    return newPayload;
  });

  // Action Buttons
  readonly bookingActions = [
    {
      action: 'delete',
      icon: 'delete',
      tooltip: () => this.facade.assignedStatus() === 1 ? 'Delete Lead' : 'Delete Lead (Unclaimed)',
      color: 'warn' as const,
      show: () => this.facade.hasPermission('404'),
    },
    {
      action: 'addComment',
      icon: 'add_comment',
      tooltip: () => this.facade.assignedStatus() === 1 ? 'Follow Up' : 'Follow Up (Unclaimed - Enable after claiming)',
      color: 'primary' as const,
      disabled: () => this.facade.assignedStatus() !== 1,
      show: () => this.facade.hasPermission('405'),
    },
    {
      action: 'whatsAppChatting',
      icon: 'fa-brands fa-whatsapp',
      iconType: 'fontawesome',
      tooltip: () => this.facade.assignedStatus() === 1 ? 'WhatsApp Chat' : 'WhatsApp Chat (Unclaimed - Enable after claiming)',
      color: 'success' as const,
      disabled: () => this.facade.assignedStatus() !== 1,
      show: () => this.facade.hasPermission('405'),
    },
    {
      action: 'leadCallRecording',
      icon: 'mic',
      tooltip: () => this.facade.assignedStatus() === 1 ? 'IVR Recording' : 'IVR Recording (Unclaimed - Enable after claiming)',
      color: 'primary' as const,
      disabled: () => this.facade.assignedStatus() !== 1,
      show: () => this.facade.hasPermission('405'),
    },
    {
      action: 'editLead',
      icon: 'edit_note',
      tooltip: () => this.facade.assignedStatus() === 1 ? 'Edit Lead' : 'Edit Lead (Unclaimed - Enable after claiming)',
      color: 'primary' as const,
      disabled: () => this.facade.assignedStatus() !== 1,
      show: () => this.facade.hasPermission('407'),
    },
    {
      action: 'calllead',
      icon: 'call',
      tooltip: () => this.facade.assignedStatus() === 1 ? 'Call Lead' : 'Call Lead (Unclaimed - Enable after claiming)',
      color: 'success' as const,
      disabled: () => this.facade.assignedStatus() !== 1,
      show: () => this.facade.hasPermission('405'),
    },
  ] satisfies readonly ActionButton<LeadData>[];

  readonly headerButtons = computed(() => [
    {
      label: 'Unclaimed',
      icon: 'radio_button_unchecked',
      color: this.facade.assignedStatus() === 0 ? 'accent' : ('primary' as const),
      disabled: () => this.isProjectIdEmpty(),
      action: () => this.facade.setAssignedStatus(0),
      show: () => this.facade.hasPermission('614'),
    },
    {
      label: 'Claimed',
      icon: 'check_circle',
      color: this.facade.assignedStatus() === 1 ? 'accent' : ('primary' as const),
      disabled: () => this.isProjectIdEmpty(),
      action: () => this.facade.setAssignedStatus(1),
      show: () => this.facade.hasPermission('615'),
    },
    {
      label: 'Transfer/Assign',
      icon: 'assignment_ind',
      color: 'primary' as const,
      action: () => this.assignLead(),
      disabled: () => !this.facade.hasSelectedBookings(),
      show: () => this.facade.hasPermission('399'),
    },
    {
      label: 'Facebook Question',
      icon: 'facebook',
      color: 'primary' as const,
      disabled: () => !this.facade.hasSelectedBookings(),
      action: () => this.openFacebookQuestion(),
      show: () => this.facade.hasPermission('398'),
    },
    {
      label: 'Upload leads',
      icon: 'post_add',
      color: 'primary' as const,
      disabled: () => false,
      action: () => this.openImportFloorUnit(),
      show: () => this.facade.hasPermission('401'),
    },
    {
      label: 'Add New Lead',
      icon: 'add_box',
      color: 'primary' as const,
      disabled: () => false,
      action: () => this.addProjectLead('add'),
      show: () => this.facade.hasPermission('402'),
    },
  ]);

  constructor() {
    this.setupFormListeners();
    this.setupDebouncedGridRefresh();
  }

  ngOnInit(): void {
    Promise.resolve().then(() => {
      this.facade.fetchallLeadLevels();
      this.facade.fetchAllProjects();
      this.facade.fetchAllSources();
    });
  }

  private setupDebouncedGridRefresh(): void {
    this.facade.refreshGridSubject.pipe(
      debounceTime(GRID_REFRESH_DEBOUNCE_MS),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.safeRefreshGrid());
  }

  private safeRefreshGrid(): void {
    const projectId = this.enquiryFilterForm.get('project_id')?.value;
    if (!Array.isArray(projectId) || projectId.length === 0) return;
    if (this.agGridComponent) {
      setTimeout(() => this.agGridComponent.refreshData(), 0);
    }
  }

  private setupFormListeners(): void {
    // Date Filters
    this.enquiryFilterForm.get('ignore_date_filters')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged()
    ).subscribe((checked) => {
      if (checked) {
        this.enquiryFilterForm.patchValue({
          start_date: null,
          end_date: null,
          start_followup_date: null,
          end_followup_date: null
        });
      }
    });

    // Project ID Listener – only fetch telecallers on select/change; fetch_all_lead runs only on Apply Filter
    this.enquiryFilterForm.get('project_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      debounceTime(DEBOUNCE_TIME_MS),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe((projectID) => {
      const ids = Array.isArray(projectID) ? projectID : [];
      this.facade.fetchAllTalecallerList(ids);
    });

    // Lead Level Listener
    this.enquiryFilterForm.get('lead_level_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged()
    ).subscribe((leadLevelId) => {
      if (leadLevelId) {
        this.facade.fetchCallStatus(leadLevelId);
      } else {
        this.facade.callStatus.set([]);
        this.enquiryFilterForm.get('call_status_id')?.reset();
      }
    });

    // Source Listener
    this.enquiryFilterForm.get('source_id')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      distinctUntilChanged()
    ).subscribe((sourceId) => {
      this.enquiryFilterForm.patchValue({ source_detail_id: null, channel_partner_id: null });
      this.facade.sourceDetailedList.set([]);
      this.facade.allChannelPartnerList.set([]);

      if (typeof sourceId === 'number' && sourceId > 0 && sourceId !== 3) {
        this.facade.fetchSourceDetails(sourceId);
      }
    });
  }

  onPartnerSearch(searchText: string): void {
    const trimmed = searchText.trim();
    if (this.enquiryFilterForm.get('source_id')?.value !== 3) {
      this.facade.allChannelPartnerList.set([]);
      return;
    }
    if (trimmed.length > 2) {
      this.facade.fetchChannelPartners(trimmed);
    } else if (trimmed.length === 0) {
      this.facade.allChannelPartnerList.set([]);
    }
  }

  fetchAllProjectLeads(): void {
    const values = this.enquiryFilterForm.value;
    if (!values.project_id?.length) return;

    this.facade.isFiltered.set(this.hasFiltersApplied(values));
    this.facade.scrollIndex.set(0);
    this.facade.paginationParams.update(params => ({ ...params, offset: 0 }));
    this.facade.refreshGridSubject.next(Date.now());
  }

  private hasFiltersApplied(values: any): boolean {
    return !!(
      values.project_id?.length ||
      values.lead_level_id ||
      values.call_status_id ||
      values.status_id?.length ||
      values.telecaller_id?.length ||
      values.source_id ||
      values.source_detail_id ||
      values.channel_partner_id ||
      values.start_date ||
      values.end_date ||
      values.start_followup_date ||
      values.end_followup_date
    );
  }

  private getTelecallerIdValue(values: any): number[] | null {
    if (this.facade.hasOnlyRoles([13]) || this.facade.hasOnlyRoles([7, 13])) {
      return this.facade.userId() ? [this.facade.userId()] : null;
    }
    return values.telecaller_id?.length ? values.telecaller_id.map(Number) : null;
  }

  private buildFiltersObject(values: any, telecallerId: number[] | null): Record<string, any> {
    return {
      project_id: values.project_id?.length ? values.project_id : null,
      lead_level_id: values.lead_level_id || null,
      call_status_id: values.call_status_id || null,
      status_id: values.status_id?.length ? values.status_id : null,
      telecaller_id: telecallerId,
      source_id: values.source_id || null,
      source_detail_id: values.source_detail_id || null,
      channel_partner_id: values.channel_partner_id || null,
      start_date: this.formatDate(values.start_date),
      end_date: this.formatDate(values.end_date),
      start_followup_date: this.formatDate(values.start_followup_date),
      end_followup_date: this.formatDate(values.end_followup_date),
      user_id: this.facade.userId()
    };
  }

  private formatDate(date: Date | null): string | null {
    return date ? this.datePipe.transform(date, DATE_FORMAT) : null;
  }

  private isProjectIdEmpty(): boolean {
    return !this.enquiryFilterForm.get('project_id')?.value?.length;
  }

  // --- Grid Events ---
  onSortChange(sort: Sort): void {
    this.facade.paginationParams.update(params => ({
      ...params,
      sortBy: sort.active,
      sortOrder: (sort.direction || 'desc') as 'asc' | 'desc'
    }));
    this.facade.refreshGridSubject.next(Date.now());
  }

  onPageChange(page: number): void {
    this.facade.paginationParams.update(params => ({
      ...params,
      offset: (page - 1) * params.limit
    }));
    this.facade.refreshGridSubject.next(Date.now());
  }

  onPageSizeChange(size: number | string): void {
    const paging = this.facade.paginationParams();
    const newLimit = size === 'All' ? paging.filteredCount : (size as number);
    this.facade.paginationParams.update(params => ({ ...params, limit: newLimit, offset: 0 }));
    this.facade.refreshGridSubject.next(Date.now());
  }

  onLeadSelectionChange(checked: boolean, booking: LeadData): void {
    const id = booking.project_lead_id;
    this.facade.selectedBookings.update(bookings => {
      const exists = bookings.some(b => b.project_lead_id === id);
      if (checked && !exists) {
        return [...bookings, {
          project_lead_id: id,
          project_id: booking.project_id,
          project_enq_id: booking.project_enq_id,
        }];
      } else if (!checked && exists) {
        return bookings.filter(b => b.project_lead_id !== id);
      }
      return bookings;
    });
  }

  onRowSelectedUpdate(rows: LeadData[]): void {
    this.facade.updateSelectedBookings(rows.map(row => ({
      project_lead_id: row.project_lead_id,
      project_id: row.project_id,
      project_enq_id: row.project_enq_id,
    })));
  }

  onBookingAction(action: string, row: LeadData): void {
    const handlers: Record<string, () => void> = {
      delete: () => this.deleteProjectLead(row.project_lead_id),
      addComment: () => this.openAddCommentDialog(row),
      leadCallRecording: () => this.openCallLeadDialog(row),
      whatsAppChatting: () => this.openWhatsAppChattingDialog(row),
      editLead: () => this.addProjectLead('edit', row),
      calllead: () => this.callLead(row.project_lead_id)
    };
    handlers[action]?.();
  }

  onScrollIndexChange(index: number): void {
    if (index > this.facade.scrollIndex() + SCROLL_THRESHOLD) {
      this.facade.scrollIndex.set(index);
      this.facade.paginationParams.update(params => ({ ...params, offset: index }));
      this.facade.refreshGridSubject.next(Date.now());
    }
  }

  // --- Dialogs ---
  deleteProjectLead(leadID: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Lead?' },
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap(result => this.facade.deleteProjectLead(leadID, result.reason))
    ).subscribe();
  }

  addProjectLead(action: 'add' | 'edit', row?: LeadData): void {
    const dialogRef = this.dialog.open(AddProjectleadComponent, {
      minWidth: '70vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Project Lead' : 'Edit Project Lead',
        apiUrl: action === 'add' ? 'add_lead' : 'update_lead',
        successMessage: action === 'add' ? 'Project Lead added successfully' : 'Project Lead updated successfully',
        rowData: row,
      },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res) this.facade.refreshGridSubject.next(Date.now());
    });
  }

  openAddCommentDialog(data: LeadData): void {
    const dialogRef = this.dialog.open(CommentLogComponent, {
      minWidth: '60vw',
      maxWidth: '50vw',
      maxHeight: '100vh',
      data: {
        title: 'Add FollowUp',
        payload: 'project_lead_id',
        request: data.project_lead_id,
        apiUrl: 'add_lead_follow_up',
        successMessage: 'Follow-up Added Successfully...',
        rowData: data,
        for: 'lead-followUp',
      },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res) this.facade.refreshGridSubject.next(Date.now());
    });
  }

  assignLead(): void {
    const selected = this.facade.selectedBookings();
    if (!selected.length) return;
    const dialogRef = this.dialog.open(AssignLeadsComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: 'Assign Lead',
        apiUrl: 'assign_lead',
        successMessage: 'Lead assigned successfully',
        rowData: selected,
      },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res) {
        this.facade.refreshGridSubject.next(Date.now());
        this.facade.selectedBookings.set([]);
      }
    });
  }

  openFacebookQuestion(): void {
    const selected = this.facade.selectedBookings();
    if (!selected.length) return;
    const dialogRef = this.dialog.open(FacebookQuestionComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { rowData: selected[0].project_lead_id },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res) {
        this.facade.refreshGridSubject.next(Date.now());
        this.facade.selectedBookings.set([]);
      }
    });
  }

  openImportFloorUnit(): void {
    const dialogRef = this.dialog.open(ImportFloorUnitsComponent, {
      width: '500px',
      disableClose: true,
      data: { for: 'projectLead', API_URL: 'import_project_lead' },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res) this.facade.refreshGridSubject.next(Date.now());
    });
  }

  openWhatsAppChattingDialog(data: any): void {
    this.dialog.open(WhatAppChattingDialogComponent, {
      minWidth: '40vw',
      maxWidth: '40vw',
      maxHeight: '80vh',
      data: { chattingData: data },
    });
  }

  openCallLeadDialog(data: any): void {
    this.dialog.open(AllCallRecordingsComponent, {
      minWidth: '40vw',
      maxWidth: '40vw',
      maxHeight: '100vh',
      data: {
        title: `Lead Call Recording`,
        projectLeadId: data.project_lead_id,
        for: 'lead-call',
      },
    });
  }

  callLead(project_lead_id: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to call this Lead?' },
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result && result !== 'false'),
      switchMap(() => this.facade.callLead(project_lead_id))
    ).subscribe();
  }

  // --- View Helpers ---
  getRowClass = (): string | undefined => this.facade.assignedStatus() === 0 ? 'bg-light-yellow' : undefined;

  readonly customTheme = computed(() => this.facade.assignedStatus() === 0 ? { backgroundColor: "rgb(249, 245, 227)" } : undefined);

  // Column Definitions
  readonly columnDefinitions = computed<readonly TableColumn<LeadData>[]>(() => {
    const isClaimed = this.facade.assignedStatus() === 1;
    return [
      { key: 'actions', label: 'Actions', type: 'actions', sticky: true, disabled: false },
      { key: 'project_lead_id', label: 'Lead ID' },
      { key: 'project_names', label: 'Project Name' },
      { key: 'date', label: 'Lead Date', type: 'mediumDate' },
      ...(isClaimed ? [{ key: 'follow_up_date', label: 'Follow-Up Date', type: 'mediumDate' } as any] : []),
      { key: 'customer_name', label: 'Client Name' },
      ...(isClaimed ? [{ key: 'lead_type', label: 'Lead Type' }] : []),
      { key: 're_enquiry', label: 'Re-enquiry' },
      { key: 'integration_name', label: 'Campaign Name' },
      { key: 'ai_lead_level', label: 'AI Lead Level' },
      {
        key: 'imported',
        label: 'Imported',
        applyChequeStatusColor: true,
        cellStyle: ({ data }: any) => this.columnDynamicColorService.getImportedCellStyle(data?.['imported'])
      },
      { key: 'mobile_no', label: 'Phone', type: 'sensitive' },
      { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
      { key: 'alternate_mob_no', label: 'Secondary Mobile No', type: 'sensitive' },
      { key: 'email_id', label: 'Email ID', type: 'sensitive' },
      ...(isClaimed ? [
        { key: 'telecaller_names', label: 'Telecaller' },
        { key: 'source', label: 'Lead Source' },
        { key: 'source_detail', label: 'Source Type' },
        { key: 'preference', label: 'Configuration' },
        { key: 'latest_status', label: 'Latest Call Status' },
        { key: 'latest_followup', label: 'Latest Follow-Up', type: 'truncate' },
        { key: 'site_visited', label: 'Site Visit' }
      ] : []),
      { key: 'is_booked', label: 'Is Booked' },
      { key: 'created_at', label: 'Created At', type: 'date' },
      { key: 'updated_at', label: 'Updated At', type: 'date' },
      { key: 'created_by', label: 'Created By' },
      { key: 'updated_by', label: 'Updated By' },
    ];
  });
}