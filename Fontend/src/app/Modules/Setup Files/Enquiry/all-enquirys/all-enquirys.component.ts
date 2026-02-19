import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  ViewChild,
  OnInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  DestroyRef,
  inject,
  computed,
  signal,
  effect
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, debounceTime, filter, switchMap, tap } from 'rxjs/operators';

// Modules & Components
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AddSiteVisitComponent } from '../../Site Visit/add-site-visit/add-site-visit.component';
import { CommentLogComponent } from '../../comment-log/comment-log.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ActionColumnComponent } from '../../../../Common/action-column/action-column.component';
import { AssignLeadsComponent } from '../../Projects/Leads/assign-leads/assign-leads.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ClaimEnquiryComponent } from '../claim-enquiry/claim-enquiry.component';
import { AssignProjectDialogComponent } from '../assign-project-dialog/assign-project-dialog.component';
import { TableColumn } from '../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { SendWhatsAppTemplageComponent } from '../send-whats-app-templage/send-whats-app-templage.component';
import { ImportFloorUnitsComponent } from '../../Floor Unit/import-floor-units/import-floor-units.component';
import { EnquiryManagementService } from '../services/enquiry-management.service';
import { ConfirmationDialogComponent } from '../../../../Common/Reusable/ConfirmDialog/confirm-dialog/confirm-dialog.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AllEnquiryStore } from './all-enquirys.store';
import { QuatationRequestDialogComponent } from '../quatation-request-dialog/quatation-request-dialog.component';
import { LeadLevel, CallStatus } from '../../comment-log/comment-log.models';
import { AddEnquiryComponent } from '../add-enquiry/add-enquiry.component';

interface ActionButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}

interface LeadAction {
  action: string;
  icon: string;
  tooltip: string;
  color: string;
  disabled: (row?: any) => boolean;
  show?: (row?: any) => boolean;
}

interface EnquiryFilterForm {
  project_id: FormControl<any[] | null>;
  source_id: FormControl<any>;
  user_id: FormControl<any[] | null>;
  sales_executive_id: FormControl<number[] | null>;
  channel_partner_id: FormControl<any>;
  source_detail_id: FormControl<any>;
  lead_level_id: FormControl<number | null>;
  call_status_id: FormControl<number | null>;
  start_date: FormControl<any | null>;
  end_date: FormControl<any | null>;
  project_configuration_id: FormControl<any>;
  ignore_date_filters: FormControl<boolean | null>;
}

@Component({
  selector: 'app-all-enquirys',
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
    ActionColumnComponent,
    AutocompleteReusableComponent,
    ReusableTableComponent,
    ConfigurableAgGridDataComponent,
    AddEnquiryComponent
  ],
  templateUrl: './all-enquirys.component.html',
  styleUrls: ['./all-enquirys.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllEnquirysComponent implements OnInit {
  // ==================== INJECTED DEPENDENCIES ====================
  readonly store = inject(AllEnquiryStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly enquiryService = inject(EnquiryManagementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // ==================== VIEW CHILDREN ====================
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // ==================== COMPUTED SIGNALS ====================
  readonly displayedColumns = computed<TableColumn[]>(() =>
    this.allColumns.filter(
      col => !col.claimedOnly || this.store.showClaimedEnquiries()
    )
  );

  readonly columnKeys = computed(() =>
    this.displayedColumns().map(col => col.key)
  );

  private readonly allColumns: (TableColumn & { claimedOnly?: boolean })[] = [
    { key: 'actions', label: 'Actions', type: 'actions', sticky: true, disabled: false },
    { key: 'project_enq_id', label: 'Client ID' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'enquiry_date', label: 'Date', type: 'mediumDate' },
    { key: 'follow_up_date', label: 'Follow-up Date', type: 'mediumDate', claimedOnly: true },
    { key: 'full_name', label: 'Customer Name' },
    { key: 'project_configuration', label: 'Configuration' },
    { key: 'min_budget', label: 'Min Budget', isAmount: true },
    { key: 'max_budget', label: 'Max Budget', isAmount: true },
    { key: 'mobile_no', label: 'Mobile No', type: 'sensitive' },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
    { key: 'sales_executive', label: 'Sales Executive', claimedOnly: true },
    { key: 'lead_level', label: 'Enquiry Level', claimedOnly: true },
    { key: 'call_status', label: 'Call Status', claimedOnly: true },
    { key: 'is_booked', label: 'Booked', claimedOnly: true },
    { key: 'source', label: 'Visit Source' },
    { key: 'firm_name', label: 'Channel Partner' },
    { key: 'source_description', label: 'Source Description' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'sourcing_manager', label: 'Sourcing Manager' },
    { key: 'is_imported', label: 'Imported' },
    { key: 'age_range', label: 'Age Range' },
    { key: 'alternate_mob_no', label: 'Secondary Mobile No', type: 'sensitive' },
    { key: 'whatsapp_no', label: 'WhatsApp No', type: 'sensitive' },
    { key: 'preferred_location', label: 'Preferred Location' },
    { key: 'current_living_place', label: 'Current Living Place' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'buying_purpose', label: 'Buying Purpose' },
    { key: 'possession_req', label: 'Possession Req' },
    { key: 'booking_plan_within', label: 'Booking Plan Within' },
    { key: 'job_location', label: 'Job Location' },
    { key: 'industry', label: 'Industry' },
    { key: 'created_by', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By', claimedOnly: true },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date', claimedOnly: true },
  ];

  // ==================== FORM DEFINITION ====================
  readonly enquiryFilterForm: FormGroup<EnquiryFilterForm> = new FormGroup({
    project_id: new FormControl<any[]>([], Validators.required),
    source_id: new FormControl(),
    project_configuration_id: new FormControl(),
    user_id: new FormControl<any[]>([], Validators.required),
    sales_executive_id: new FormControl<number[]>([]),
    channel_partner_id: new FormControl(),
    source_detail_id: new FormControl(),
    lead_level_id: new FormControl<number | null>(null),
    call_status_id: new FormControl<number | null>(null),
    start_date: new FormControl(null),
    end_date: new FormControl(null),
    ignore_date_filters: new FormControl(false),
  });

  // ==================== ACTION DEFINITIONS ====================
  readonly enquiryActions = computed<LeadAction[]>(() => {
    const roleId = this.store.roleId();
    const isClaimedView = this.store.showClaimedEnquiries();

    return [
      {
        action: 'claimEnquiry',
        icon: 'new_label',
        tooltip: 'Claim Enquiry',
        color: 'primary',
        disabled: (row: any) => !!row?.sales_executive_id,
        show: (row?: any) => !isClaimedView,
      },
      {
        action: 'editEnquiry',
        icon: 'edit_note',
        tooltip: isClaimedView ? 'Edit Client Details' : 'Edit Client Details (Unclaimed - Enable after claiming)',
        color: 'primary',
        disabled: (row: any) => !isClaimedView,
        show: () => this.store.hasPermission('627')(),
      },
      {
        action: 'addToken',
        icon: 'payments',
        tooltip: isClaimedView ? 'Add EOI' : 'Add EOI (Unclaimed - Enable after claiming)',
        color: 'primary',
        disabled: (row: any) => !isClaimedView || row?.is_token === 1,
        show: (row?: any) => true,
      },
      {
        action: 'addBooking',
        icon: 'add_circle',
        tooltip: isClaimedView ? 'Punch Booking' : 'Punch Booking (Unclaimed - Enable after claiming)',
        color: 'primary',
        disabled: (row: any) => !isClaimedView || row?.is_booked === "Yes",
        show: (row?: any) => true,
      },
      {
        action: 'addComment',
        icon: 'add_comment',
        tooltip: isClaimedView ? 'Add Follow-up' : 'Add Follow-up (Unclaimed - Enable after claiming)',
        color: 'primary',
        disabled: (row: any) => !isClaimedView,
        show: (row?: any) => true,
      },
      {
        action: 'callEnquiry',
        icon: 'call',
        tooltip: isClaimedView ? 'Call Enquiry' : 'Call Enquiry (Unclaimed - Enable after claiming)',
        color: 'success' as const,
        disabled: (row: any) => !isClaimedView || !row?.sales_executive_id,
        show: (row?: any) => true,
      },
      {
        action: 'deleteEnquiry',
        icon: 'delete',
        tooltip: isClaimedView ? 'Delete Client' : 'Delete Client (Unclaimed - Enable after claiming)',
        color: 'warn',
        disabled: (row: any) => !isClaimedView && roleId === 2,
        show: (row?: any) => roleId === 2,
      },
    ];
  });

  // ==================== HEADER BUTTONS ====================
  readonly headerButtons = computed<ActionButton[]>(() => {
    // Buttons are now always visible, but some might be disabled during loading

    const hasSelected = this.store.hasSelectedBookings();
    const isClaimed = this.store.showClaimedEnquiries();

    return [
      {
        label: 'Quotation ',
        icon: 'add_card',
        color: 'primary',
        disabled: () => !hasSelected,
        action: () => this.openAddQuatationRequestDialog(),
        show: () => this.store.hasPermission('629')() && isClaimed === true,
      },
      {
        label: 'Assign Project',
        icon: 'assignment_ind',
        color: 'primary',
        disabled: () => !hasSelected,
        action: () => this.assignProject(),
        show: () => this.store.hasPermission('474')() && isClaimed === true,
      },
      {
        label: 'Transfer/Assign',
        icon: 'assignment_ind',
        color: 'primary', // Changed back from accent for consistency if not active view
        disabled: () => !hasSelected,
        action: () => this.assignLead(),
        show: () => this.store.hasPermission('475')() && isClaimed === true,
      },
      {
        label: 'Unclaimed ',
        icon: 'person_off',
        color: !isClaimed ? 'accent' : 'primary',
        disabled: () => this.store.loading(),
        action: () => this.fetchByClaimStatus(false),
        show: () => this.store.hasPermission('613')(),
      },
      {
        label: 'Claimed ',
        icon: 'how_to_reg',
        color: isClaimed ? 'accent' : 'primary',
        disabled: () => this.store.loading(),
        action: () => this.fetchByClaimStatus(true),
        show: () => this.store.hasPermission('477')(),
      },
      {
        label: 'Import Enquiry',
        icon: 'drive_folder_upload',
        color: 'primary',
        disabled: () => false,
        action: () => this.openImportFloorUnit(),
        show: () => this.store.hasPermission('476')(),
      },
      {
        label: 'Add Enquiry',
        icon: 'add_circle',
        color: 'primary',
        disabled: () => false,
        action: () => this.openAddEnquiryDialog(),
        show: () => this.store.hasPermission('478')(),
      },
    ];
  });

  // ==================== LIFECYCLE HOOKS ====================
  ngOnInit(): void {
    // Initialize History State in Store
    this.store.setHistoryData(history.state.data, history.state.successBookingData);

    const cpData = this.store.cpTargetLoggedData();
    const successData = this.store.successBookingData();

    // Patch initial form values from history
    if (cpData?.project_id) {
      this.enquiryFilterForm.patchValue({ project_id: [cpData.project_id] });
    }
    if (successData?.project_id) {
      this.enquiryFilterForm.patchValue({ project_id: [successData.project_id] });
    }

    // Initial Data Load
    this.store.loadProjects(this.store.userId());
    this.store.loadSources();
    this.store.loadLeadLevels();

    this.setupFormListeners();

    if (successData?.project_id) {
      setTimeout(() => this.refreshGrid(), 500);
    }
  }

  // ==================== FORM HANDLING ====================
  private setupFormListeners(): void {
    // Source ID changes
    this.enquiryFilterForm.get('source_id')?.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(sourceId => {
      this.store.updateFilter({ source_id: sourceId });
      this.store.loadSourceDetails(sourceId);
    });

    // Project ID changes
    this.enquiryFilterForm.get('project_id')?.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(projectID => {
      const ids = Array.isArray(projectID) ? projectID : (projectID ? [projectID] : []);
      this.store.updateFilter({ project_id: ids });

      const firstProjectId = ids[0];
      if (firstProjectId) {
        this.store.loadSalesExecutives(firstProjectId);
        this.store.loadPreferenceDropdown(firstProjectId);
      }
    });

    // Lead Level changes
    this.enquiryFilterForm.get('lead_level_id')?.valueChanges.pipe(
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((leadLevelId: number | null) => {
      this.store.updateFilter({ lead_level_id: leadLevelId });
      this.store.loadCallStatuses(leadLevelId || 0);
    });

    // General Form Changes - Update Filter Store
    this.enquiryFilterForm.valueChanges.pipe(
      debounceTime(100),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((val) => {
      this.store.updateFilter(val as any);
      // We don't need to manually refresh grid here if the grid component 
      // is reactive to apiPayload changes (which it should be).
      // If the grid doesn't auto-refresh on payload change, we might need:
      // this.refreshGrid();
    });
  }

  // ==================== DATA FETCHING & ACTIONS ====================
  refreshGrid(): void {
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }

  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length <= 3) {
      this.store.channelPartners.set([]);
      return;
    }

    this.enquiryService.searchChannelPartners(trimmedSearch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          console.error(err);
          this.snackBar.open('Unable to fetch channel partners.', 'Close', { duration: 3000 });
          return of([]);
        })
      )
      .subscribe((res: any) => {
        this.store.channelPartners.set(res || []);
        this.cdr.markForCheck();
      });
  }

  fetchByClaimStatus(isClaimed: boolean): void {
    const selectedProjectIds = this.enquiryFilterForm.get('project_id')?.value;
    if (!selectedProjectIds || selectedProjectIds.length === 0) {
      this.snackBar.open('Please select at least one project first', 'Close', { duration: 3000 });
      return;
    }
    this.store.setClaimedView(isClaimed);
    setTimeout(() => this.refreshGrid(), 0);
  }

  onLeadSelectionChange(checked: boolean, booking: any): void {
    // AG Grid handles multiple selection usually, but if we need manual tracking:
    // This method seems to append/remove single items.
    const current = this.store.selectedBookings();
    const selectedData = {
      project_enq_id: booking.project_enq_id,
      project_id: booking.project_id,
    };

    if (checked) {
      this.store.updateSelectedBookings([...current, selectedData]);
    } else {
      this.store.updateSelectedBookings(current.filter(item => item.project_enq_id !== selectedData.project_enq_id));
    }
  }

  onRowSelected(rows: any[]): void {
    this.store.updateSelectedBookings(rows);
  }

  // ==================== DIALOG & NAVIGATION DELEGATES ====================
  getLeadActions(action: string, row: any): void {
    const actionHandlers: Record<string, () => void> = {
      editEnquiry: () => this.openAddEnquiryDialog(row),
      addSiteVisit: () => this.openAddSiteDialog(row),
      addToken: () => this.navigateToAddToken(row),
      addBooking: () => this.navigateToAddBooking(row),
      addComment: () => this.openAddCommentDialog(row),
      claimEnquiry: () => this.openClaimEnquiryDialog(row),
      deleteEnquiry: () => this.deleteEnquiry(row.project_enq_id),
      callEnquiry: () => this.callEnquiry(row.project_enq_id),
    };
    actionHandlers[action]?.();
  }

  // ... (Keeping existing Dialog/Navigation methods but employing Store where applicable)
  // Methods: openImportFloorUnit, callEnquiry, navigateTo..., openClaimEnquiryDialog, etc.

  openImportFloorUnit(): void {
    const dialogRef = this.dialog.open(ImportFloorUnitsComponent, {
      width: '500px',
      disableClose: true,
      data: { for: 'enquiryImport', API_URL: 'import_project_enquiries' },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  callEnquiry(projectEnqID: number): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      minWidth: '25vw',
      data: { project_enq_id: projectEnqID },
    });

    dialogRef.afterClosed().pipe(
      filter(result => result === true),
      switchMap(() => {
        return this.enquiryService.callToEnquiry({
          user_id: this.store.userId(),
          project_enq_id: projectEnqID
        }).pipe(
          tap(() => this.snackBar.open('Lead called successfully!', 'Close', { duration: 3000 })),
          catchError(() => {
            this.snackBar.open('Call not mapped to any IVR please contact admin', 'Close', { duration: 3000 });
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.cdr.markForCheck());
  }
  openAddEnquiryDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddEnquiryComponent, {
      width: '80vw',
      maxWidth: '1200px',
      maxHeight: '90vh',
      disableClose: true,
      data: row ? { project_enq_id: row.project_enq_id, project_id: row.project_id } : null
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.refreshGrid();
    });
  }

  private navigateToEditEnquiry(row: any) {
    this.router.navigate(['/setup/edit-enquiry', row.project_name, row.project_enq_id]);
  }
  private navigateToAddToken(row: any) {
    this.router.navigate(['/setup/add-token'], { state: { data: row } });
  }
  private navigateToAddBooking(row: any) {
    this.router.navigate(['/add-bookings'], { state: { data: row, extraText: 'EnquiryBooking' } });
  }

  openClaimEnquiryDialog(row: any): void {
    const dialogRef = this.dialog.open(ClaimEnquiryComponent, { minWidth: '25vw', data: row });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result === 'claimed') this.refreshGrid();
    });
  }

  openAddSiteDialog(row: any): void {
    const apiUrl = row?.site_visit_id ? 'add_revisit' : 'add_site_visit';
    const title = row?.site_visit_id ? 'Add Revisit' : 'Add Site Visit';
    const successMessage = row?.site_visit_id ? 'Revisit added successfully' : 'Site Visit added successfully';
    const dialogRef = this.dialog.open(AddSiteVisitComponent, {
      minWidth: '50vw', maxWidth: '50vh', maxHeight: '100vh',
      data: { title, apiUrl, successMessage, rowData: row },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) this.refreshGrid();
    });
  }

  openAddCommentDialog(data: any): void {
    const dialogRef = this.dialog.open(CommentLogComponent, {
      minWidth: '40vw', maxWidth: '50vw', maxHeight: '100vh',
      data: {
        title: `Add Comment to ${data?.project_name || 'Project'}`,
        payload: 'enquiry_id',
        request: data?.project_enq_id,
        apiUrl: 'add_comment',
        successMessage: 'Follow-up Added Successfully...',
        rowData: data,
        for: 'Enquiries',
      },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(res => {
      if (res) this.refreshGrid();
    });
  }

  assignProject(): void {
    const selected = this.store.selectedBookings();
    if (selected.length === 0) {
      this.snackBar.open('Please select at least one booking to assign', 'Close', { duration: 3000 });
      return;
    }
    const dialogRef = this.dialog.open(AssignProjectDialogComponent, {
      minWidth: '30vw', maxWidth: '50vh', maxHeight: '100vh',
      data: {
        for: 'leadAssign', title: 'Assign Project', apiUrl: 'assign_sales_executive',
        successMessage: 'Enquiry assigned successfully', rowData: selected,
      },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.refreshGrid();
        this.store.updateSelectedBookings([]);
      }
    });
  }

  // sendBulkWhatsApp removed as it was commented out in original file or just unused in headerButtons? 
  // It was commented out in original headerButtons, so I will omit it to be clean.

  openAddQuatationRequestDialog(): void {
    const selected = this.store.selectedBookings();
    if (selected.length === 0) {
      this.snackBar.open('Please select at least one enquiry first', 'Close', { duration: 3000 });
      return;
    }
    const projectEnqIds = selected.map(s => s.project_enq_id);
    const dialogRef = this.dialog.open(QuatationRequestDialogComponent, {
      minWidth: '70vw', maxWidth: '50vw', maxHeight: '100vh',
      data: { project_enq_ids: projectEnqIds, rowData: selected },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.refreshGrid();
        this.store.updateSelectedBookings([]);
      }
    });
  }

  assignLead(): void {
    const selected = this.store.selectedBookings();
    if (selected.length === 0) {
      this.snackBar.open('Please select at least one booking to assign', 'Close', { duration: 3000 });
      return;
    }
    const dialogRef = this.dialog.open(AssignLeadsComponent, {
      minWidth: '30vw', maxWidth: '50vh', maxHeight: '100vh',
      data: {
        for: 'leadAssign', title: 'Assign Enquiry', apiUrl: 'assign_sales_executive',
        successMessage: 'Enquiry assigned successfully', rowData: selected,
      },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      if (result) {
        this.refreshGrid();
        this.store.updateSelectedBookings([]);
      }
    });
  }

  deleteEnquiry(projectEnquiryID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw', data: { message: 'Are you sure you want to delete this Client?' },
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap((result) => {
        return this.enquiryService.deleteProjectEnquiry({
          project_enq_id: projectEnquiryID,
          reason: result.reason,
          created_by: this.store.userId(),
        }).pipe(
          catchError(() => {
            this.snackBar.open('Unable to delete enquiry.', 'Close', { duration: 3000 });
            return of(null);
          })
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(result => {
      if (result) {
        this.snackBar.open('Client deleted successfully', 'Close', { duration: 3000 });
        this.refreshGrid();
      }
    });
  }

  claimEnquiry(projectEnquiryID: any): void {
    this.enquiryService.claimProjectEnquiry({
      project_enq_id: projectEnquiryID,
      sales_executive_id: this.store.userId(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError((error) => {
        this.snackBar.open(error.error?.message || 'Something went wrong.', 'Close', { duration: 3000 });
        return of(null);
      })
    ).subscribe(result => {
      if (result) {
        this.snackBar.open('Enquiry Claim Successfully!', 'Close', { duration: 3000 });
        this.store.updateLoading(false); // Though loading wasn't set to true explicitly here
        this.refreshGrid();
      }
    });
  }

  // ==================== UTILITY ====================
  // trackBy functions needed for HTML
  trackByLeadLevelId = (_: number, level: LeadLevel) => level.lead_level_id;
  trackByCallStatusId = (_: number, status: CallStatus) => status.call_status_id;

  getRowClass = (params: any): string | string[] | undefined => {
    return !this.store.showClaimedEnquiries() ? 'bg-light-yellow' : undefined;
  };

  readonly customTheme = computed(() => {
    return !this.store.showClaimedEnquiries() ? { backgroundColor: "rgb(249, 245, 227)" } : undefined;
  });
}