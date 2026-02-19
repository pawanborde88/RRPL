import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { AutocompleteReusableComponent } from '../../autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../template/template.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../environments/environment';
import { ExecutiveProjectQRComponent } from '../../../Modules/Setup Files/Enquiry/executive-project-qr/executive-project-qr.component';
import { CommentLogComponent } from '../../../Modules/Setup Files/comment-log/comment-log.component';
import { ConfirmDialogComponent } from '../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddEnquiryComponent } from '../../../Modules/Setup Files/Enquiry/add-enquiry/add-enquiry.component';
import { AssignProjectDialogComponent } from '../../../Modules/Setup Files/Enquiry/assign-project-dialog/assign-project-dialog.component';
import { ClaimEnquiryComponent } from '../../../Modules/Setup Files/Enquiry/claim-enquiry/claim-enquiry.component';
import { AssignLeadsComponent } from '../../../Modules/Setup Files/Projects/Leads/assign-leads/assign-leads.component';
import { AddSiteVisitComponent } from '../../../Modules/Setup Files/Site Visit/add-site-visit/add-site-visit.component';
import { FetchFunctionsService } from '../../../Service/fetch-functions.service';
import { ViewInfoMobEmailComponent } from '../../View Mobile Email/view-info-mob-email/view-info-mob-email.component';
import { PaginationComponent } from '../../pagination/pagination.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../../Service/auth.service';
import { CommonService } from '../../../Service/common/common.service';
import { ConfigurableAgGridDataComponent } from '../../Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../Reusable/reusable-table/reusable-table-refactored.types';

@Component({
  selector: 'app-search-customer-data',
  standalone: true,
  imports: [CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
    ReusableTableComponent,
    PaginationComponent,
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,

    ReusableTableComponent,],
  templateUrl: './search-customer-data.component.html',
  styleUrl: './search-customer-data.component.scss'
})
export class SearchCustomerDataComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly userId = this.authService.userId();
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly allWingslist = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);
  readonly FloorUnitDropdown = signal<any[]>([]);

  // Form signal for reactive payload
  private readonly formValues = signal<any>({});

  @Input() agreementStatus: number = 1;
  @Input() active: boolean = false;

  readonly bookingForm = new FormGroup({
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl(null, Validators.required),

  });

  readonly agreementDetailsColumnsNames: (TableColumn & { claimedOnly?: boolean })[] = [

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

    // 👇 Claim-only columns
    { key: 'sales_executive', label: 'Sales Executive', claimedOnly: true },
    { key: 'lead_level', label: 'Enquiry Level', claimedOnly: true },
    { key: 'call_status', label: 'Call Status', claimedOnly: true },
    { key: 'is_booked', label: 'Booked', claimedOnly: true },

    // 👇 Always visible
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



  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};

    if (values.project_id) filters.project_id = values.project_id;
    if (values.wing_id) filters.wing_id = values.wing_id;

    return { filters };
  });







  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();

    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValues());
  }

  fetchAllBookings(): void {
    this.updateFormValues();
    this.agGridTable?.refreshData();
  }

  private updateFormValues(): void {
    this.formValues.set(this.bookingForm.value);
  }

  private loadInitialData(): void {
    this.commonService.fetchUserProjectDropdown(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) this.projectsList.set(res);
        },
        error: () => this.showError('Unable to fetch projects.')
      });
  }

  private setupFormSubscriptions(): void {
    this.bookingForm.get('project_id')?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(id => !!id)
      )
      .subscribe(projectID => {
        this.fetchAllWings(projectID);
        // Reset wing when project changes
        this.bookingForm.get('wing_id')?.setValue(null);
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }




  fetchAllWings(projectID: any): void {
    this.commonService.fetchWingDropdown(projectID)
      .subscribe({
        next: (res: any) => {
          this.allWingslist.set(res);
        },
        error: () => {
          this.showError('Unable to fetch wings.');
        },
      });
  }
  selectedBooking: any = null; // Change from selectedBookingId to selectedBooking

  onBookingSelectionChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedBooking = booking;
      console.log('Selected booking:', this.selectedBooking);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedBooking &&
        this.selectedBooking.floor_rise_id === booking.floor_rise_id
      ) {
        this.selectedBooking = null;
      }
    }
  }



}
