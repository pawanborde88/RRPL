import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { IndianCurrencyPipe } from '../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddbookingBillComponent } from '../../../../Channel Partner Meetings/addbooking-bill/addbooking-bill.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';

@Component({
  selector: 'app-all-cpbooking-list',
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
    IndianCurrencyPipe,
    ActionColumnComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-cpbooking-list.component.html',
  styleUrl: './all-cpbooking-list.component.scss',
})
export class AllCPBookingListComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false;
  allWingslist: any[] = [];
  projectsList: any[] = [];
  confiList: any[] = [];
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;
  searchText: string = '';
  pipe = new DatePipe('en-US');
  allChannelPartnerList: any[] = []; // Initialize allWingslist as an empty array

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}

  bookingBillsColumns = [
 
    { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'wing' },
    { key: 'floor_unit', label: 'Unit No' },
    { key: 'unit_type', label: 'Configuration' },
    { key: 'applicant_name', label: 'Client Name' },
    { key: 'sales_executive', label: 'Executive' },
    { key: 'firm_name', label: 'Channel Partner' },
    {
      key: 'source_description',
      label: 'Source Description',
      type: 'truncate',
    },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  bookingForm = new FormGroup({
    user_id: new FormControl(this.userId),
    project_id: new FormControl(Validators.required),
    wing_id: new FormControl(null),
    floor_id: new FormControl(null),
    booking_status_id: new FormControl(null),
    agreement_status_id: new FormControl(null),
    channel_partner_id: new FormControl(null),
    booking_date: new FormControl(null),
    project_configuration_id: new FormControl(null),
    start_date: new FormControl(null),
    end_date: new FormControl(null),
  });

  
  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();
    if (trimmedSearch.length <= 3) {
      this.allChannelPartnerList = []; // Clear dropdown if too short
      return;
    }

    this.http
      .post(`${this.baseUrl}/channel_partner_dropdown`, {
        firm_name: trimmedSearch,
      })
      .subscribe({
        next: (res: any) => {
          this.allChannelPartnerList = res.map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner || '--'})`,
          }));
        },
        error: () => {
          this.snackBar.open('Unable to fetch source details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  headerButtons = [
    {
      label: 'Add booking Bill',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => this.selectedBooking.length === 0 || this.selectedBooking[0]?.bill_status_id === 1,
      action: () => this.openAddBookingBillDialog(),
      show: () => true,
    },
    
  ];
  openAddBookingBillDialog(row?: any): void {
    const dialogRef = this.dialog.open(AddbookingBillComponent, {
      width: '600px',
      data: {
        bookingID: this.selectedBooking?.[0]?.booking_id,
        editData: row,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }
  editBooking(booking: any): void {}

  ngOnInit(): void {
    this.fetchAllProjects();
    this.bookingForm.get('project_id')?.valueChanges.subscribe((projectID) => {
      if (projectID) {
        this.fetchAllWings(projectID);

        this.bookingForm.get('wing_id')?.valueChanges.subscribe((wingID) => {
          if (wingID) {
            this.fetchallProjectFloors(projectID, wingID);
          }
        });
      }
    });
  }
  FloorUnitDropdown: any[] = [];
  fetchallProjectFloors(selectedProjectId: any, wingID: any): void {
    this.http
      .post(`${this.baseUrl}/fetch_floor_dropdown`, {
        project_id: selectedProjectId,
        wing_id: wingID,
      })
      .subscribe({
        next: (res: any) => {
          this.FloorUnitDropdown = res;
        },
        error: () => {
          this.snackBar.open('Unable to fetch projects.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchAllBookings(): void {
    if (this.agGridTable) {
      this.agGridTable.refreshData();
    }
  }

  getAgGridApiPayload(): { filters: any } {
    const formValues = this.bookingForm.value;
    const filters: any = {
      ...formValues,
      source_id: 3, // Always include source_id as 3 for CP Booking List
      start_date: formValues.start_date
        ? (typeof formValues.start_date === 'string'
            ? formValues.start_date
            : this.pipe.transform(formValues.start_date, 'yyyy-MM-dd') ?? null)
        : null,
      end_date: formValues.end_date
        ? (typeof formValues.end_date === 'string'
            ? formValues.end_date
            : this.pipe.transform(formValues.end_date, 'yyyy-MM-dd') ?? null)
        : null,
    };

    // Remove null/undefined values to keep payload clean
    Object.keys(filters).forEach(key => {
      if (filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    return {
      filters: filters
    };
  }

  applyFilter(searchText: string): void {
    this.searchText = searchText;
    this.fetchAllBookings();
  }
  FetchProjectUnitType(projectID: any, wingId: any, floorId: any): void {
    const payload = {
      project_id: projectID,
      wing_id: wingId,
      floor_id: floorId,
    };

    this.http.post(`${this.baseUrl}/fetch_unit_type`, payload).subscribe({
      next: (res: any) => {
        this.confiList = res.data;
      },
      error: () => {
        this.snackBar.open('Unable to fetch project details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllProjects(): void {
    this.loading = true;

    const payload = {
      user_id:  this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.projectsList = res;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  fetchAllWings(projectID: any): void {
    this.http
      .post(`${this.baseUrl}/wing_dropdown`, { project_id: projectID })
      .subscribe({
        next: (res: any) => {
          this.allWingslist = res;
        },
        error: () => {
          this.snackBar.open('Unable to fetch project details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  selectedBooking: any[] = [];

  onBookingSelectionChange(checked: boolean, row: any) {
    if (checked) {
      this.selectedBooking = [row];
    } else {
      this.selectedBooking = this.selectedBooking.filter(
        (item) => item.booking_id !== row.booking_id
      );
    }
  }



  generateReceipt(): void {}
  openReceipt(bookingIds: number[]) {
    // Handle receipt logic with the selected booking IDs
    console.log('Selected bookings for receipt:', bookingIds);
    // Your implementation here
  }
  deleteBookings(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Booking?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          booking_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_booking`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Booking deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllBookings(); // Ensure this is called here to update the teams
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Team.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
