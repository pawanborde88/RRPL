import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { catchError, of, finalize, throwError, Subscription } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { AllUnitBankerListComponent } from '../all-unit-banker-list/all-unit-banker-list.component';
import { MatTabGroup } from '@angular/material/tabs';

interface Project {
  project_id: number;
  property_name: string;
  [key: string]: any;
}

interface Wing {
  wing_id: number;
  wing_name: string;
  [key: string]: any;
}

interface Unit {
  floor_unit_id: number;
  floor_unit: string;
  applicant_name: string;
  booking_id: number;
  full_name: string;
  [key: string]: any;
}

interface BankerType {
  banker_type_id: number;
  banker_type: string;
  [key: string]: any;
}

interface LoanStatus {
  loan_status_id: number;
  loan_staus: string;
  [key: string]: any;
}

interface PreferredBank {
  preferred_bank_id: number;
  preferred_bank: string;
  [key: string]: any;
}

interface BookingData {
  agreement_cost: number;
  package_total: number;
  sanction_amt: number;
  funding_amt: number;
  gst: number;
  stamp_duty: number;
  reg: number;
  society_for: number;
  legal: number;
  maintenance: number;
  parking_charges: number;
  other: number;
  sanction_letter_date: string | null;
  loan_status: number | string;
  banker_type: number | string;
  [key: string]: any;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  code?: number;
  data?: T;
}

@Component({
  selector: 'app-addunit-banker',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    AutocompleteReusableComponent,
    AllUnitBankerListComponent
  ],
  templateUrl: './addunit-banker.component.html',
  styleUrl: './addunit-banker.component.scss',
})
export class AddunitBankerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatTabGroup) tabGroup!: MatTabGroup;
  @ViewChild(AllUnitBankerListComponent) listComponent!: AllUnitBankerListComponent;
  
  private readonly baseUrl = environment.API_URL;
  private readonly roleId = Number(sessionStorage.getItem('role_id') || '0');
  private readonly userId = Number(sessionStorage.getItem('session_id') || '0');
  private readonly storageUrl = environment.STORAGE_URL;
  private readonly accountId = Number(sessionStorage.getItem('account_id') || '0');
  private subscriptions: Subscription[] = [];
  
  projectsList: Project[] = [];
  allWingslist: Wing[] = [];
  allUnitNoList: Unit[] = [];
  allLoanStatusList: LoanStatus[] = [];
  allBankerTypeList: BankerType[] = [];
  preferredBankDropdown: PreferredBank[] = [];
  
  selectedFile: File | null = null;
  loading = false;
  isEditing = true; // Always in edit mode
  editingId: string | number | null = null;
  selectedTabIndex = 0;
  isListTabEnabled = false; // Flag to control if list tab is enabled
  
  // Display fields from API
  projectName: string = '';
  wingName: string = '';
  unitName: string = '';
  applicantName: string = '';
  applicantMobile: string = '';
  applicantEmail: string = '';
  bankName: string = '';
  bankerTypeName: string = '';
  loanStatusName: string = '';
  
  private readonly datePipe = new DatePipe('en-US');

  addUnitBankerForm = new FormGroup({
    project_id: new FormControl<number | null>(null),
    wing_id: new FormControl<number | string | null>(null),
    unit_id: new FormControl<Unit | null>(null),
    sanction_amount: new FormControl<number | null>(null, Validators.required),
    agreement_amt: new FormControl<number | null>(null),
    own_contribution_pack: new FormControl<number | null>(null),
    own_contribution_agr: new FormControl<number | null>(null),
    package_total_amount: new FormControl<number | null>(null),
    funding_amount: new FormControl<number | null>(null, Validators.required),
    banker_type_id: new FormControl<number | string | null>('', Validators.required),
    bank_id: new FormControl<number | string | null>('', Validators.required),
    branch_name: new FormControl<string | null>(null, Validators.required),
    bank_login_date: new FormControl<Date | null>(null),
    parking_charges: new FormControl<number | null>(null),
    other_charges: new FormControl<number | null>(null),
    maintenance_charges: new FormControl<number | null>(null),
    legal_charges: new FormControl<number | null>(null),
    registration_amt: new FormControl<number | null>(null),
    gst_amt: new FormControl<number | null>(null),
    stamp_duty: new FormControl<number | null>(null),
    society_formation_charges: new FormControl<number | null>(null),
    sanction_date: new FormControl<Date | null>(null, Validators.required),
    loan_status_id: new FormControl<number | string | null>('', Validators.required),
    banker_name: new FormControl<string>(''),
    banker_email: new FormControl<string>(''),
    banker_mobile_no: new FormControl<string>(''),
    rate_of_interest: new FormControl<number | null>(null),
    loan_no: new FormControl<string>(''),
    sanction_letter: new FormControl<File | null>(null),
    remark: new FormControl<string>(''),
    created_by: new FormControl<number>(this.userId),
  });

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check for ID parameter for editing
    this.route.queryParams.subscribe(params => {
      const unitBankerId = params['id'];
      if (unitBankerId) {
        this.editingId = unitBankerId;
        this.fetchUnitBankerDetails(unitBankerId);
      } else {
        this.snackBar.open('No unit banker ID provided for editing', 'Close', { duration: 3000 });
      }
    });
    
    // Subscribe to project_id changes
    const projectSubscription = this.addUnitBankerForm
      .get('project_id')
      ?.valueChanges.subscribe(projectId => {
        if (projectId) {
          this.fetchAllBanerTypelist();
          this.fetchAllLoanStatus();
          this.fetchPreferredBankDropdown();
        }
      });
      
    if (projectSubscription) {
      this.subscriptions.push(projectSubscription);
    }
    
    this.autoCalculateContributions();
  }
  
  ngAfterViewInit(): void {
    // Subscribe to tab changes after view is initialized
    setTimeout(() => {
      const tabChangeSubscription = this.tabGroup?.selectedIndexChange.subscribe(index => {
        // If switching to list tab and it's enabled, refresh the data
        if (index === 1 && this.isListTabEnabled && this.listComponent) {
          this.refreshListData();
        }
      });
      
      if (tabChangeSubscription) {
        this.subscriptions.push(tabChangeSubscription);
      }
    });
  }
  
  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Automatically calculates contribution amounts based on form values
   */
  private autoCalculateContributions(): void {
    const formSubscription = this.addUnitBankerForm.valueChanges.subscribe(form => {
      const sanction = form.funding_amount || 0;
      const packageTotal = form.package_total_amount || 0;
      const agreement = form.agreement_amt || 0;

      this.addUnitBankerForm.patchValue(
        {
          own_contribution_pack: packageTotal - sanction,
          own_contribution_agr: agreement - sanction,
        },
        { emitEvent: false }
      );
    });
    
    this.subscriptions.push(formSubscription);
  }

  /**
   * Handles file selection for sanction letter upload
   */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  /**
   * Submits the form data to update the unit banker record
   */
  onSubmit(): void {
    if (this.addUnitBankerForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }
    
    const formData = new FormData();
    
    // Loop through form controls
    Object.keys(this.addUnitBankerForm.controls).forEach(key => {
      const control = this.addUnitBankerForm.get(key);
      const value = control?.value;

      if (key === 'sanction_letter') {
        // Skip file field, handled separately
        return;
      }

      if (key === 'unit_id' && value) {
        // Extract floor_unit_id from the unit object
        formData.append('unit_id', value.floor_unit_id?.toString() || '');
        return;
      }

      if (key === 'sanction_date' || key === 'bank_login_date') {
        const formattedDate = value ? this.datePipe.transform(value, 'yyyy-MM-dd') : '';
        formData.append(key, formattedDate || '');
      } else {
        formData.append(key, value !== null && value !== undefined ? value.toString() : '');
      }
    });

    // Append file separately if selected
    if (this.selectedFile) {
      formData.append('sanction_letter', this.selectedFile);
    }
    
    // Add the ID to the form data
    if (this.editingId) {
      formData.append('unit_banker_id', this.editingId.toString());
    }

    this.loading = true;

    this.http.post<ApiResponse<any>>(`${this.baseUrl}/edit_unit_banker`, formData)
      .pipe(
        finalize(() => this.loading = false),
        catchError((error: HttpErrorResponse) => {
          this.dialog.open(SuccessDialogComponent, {
            data: { message: error.error?.message || 'Something went wrong' },
          });
          return throwError(() => error);
        })
      )
      .subscribe({
        next: (res: ApiResponse<any>) => {
          if (res.success) {
            this.dialog.open(SuccessDialogComponent, {
              data: { message: res.message || 'Record updated successfully' },
            }).afterClosed().subscribe(() => {
              // After dialog is closed, enable list tab and switch to it
              this.isListTabEnabled = true;
              this.selectedTabIndex = 1;
              
              // Refresh data if editingId exists
              if (this.editingId) {
                this.fetchUnitBankerDetails(this.editingId);
              }
              
              // Ensure the list data is refreshed
              setTimeout(() => {
                this.refreshListData();
              }, 100);
            });
          }
        }
      });
  }

  /**
   * Fetches loan status options for dropdown
   */
  fetchAllLoanStatus(): void {
    this.http.get<LoanStatus[]>(`${this.baseUrl}/loan_status_dropdown`)
      .pipe(
        catchError(err => {
          this.snackBar.open('Unable to fetch loan status options.', 'Close', { duration: 3000 });
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (res: LoanStatus[]) => {
          this.allLoanStatusList = res;
        }
      });
  }
  
  /**
   * Fetches banker type options for dropdown
   */
  fetchAllBanerTypelist(): void {
    this.http.get<BankerType[]>(`${this.baseUrl}/banker_type_dropdown`)
      .pipe(
        catchError(err => {
          this.snackBar.open('Unable to fetch banker types.', 'Close', { duration: 3000 });
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (res: BankerType[]) => {
          this.allBankerTypeList = res;
        }
      });
  }
  
  /**
   * Fetches preferred bank options for dropdown
   */
  fetchPreferredBankDropdown(): void {
    this.http.get<PreferredBank[]>(`${this.baseUrl}/preferred_bank_dropdown`)
      .pipe(
        catchError(err => {
          this.snackBar.open('Unable to fetch bank options.', 'Close', { duration: 3000 });
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (res: PreferredBank[]) => {
          this.preferredBankDropdown = res;
        }
      });
  }

  /**
   * Fetches unit banker details for editing
   */
  fetchUnitBankerDetails(unitBankerId: string | number): void {
    this.loading = true;
    
    this.http.post<ApiResponse<any>>(`${this.baseUrl}/fetch_unit_banker`, { unit_banker_id: unitBankerId })
      .pipe(
        finalize(() => this.loading = false),
        catchError(err => {
          this.snackBar.open('Unable to fetch unit banker details.', 'Close', { duration: 3000 });
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response && Array.isArray(response) && response.length > 0) {
            const data = response[0]; // Get the first item from the array
            
            // Set display fields from API
            this.projectName = data.project_name || '';
            this.wingName = data.wing_name || '';
            this.unitName = data.floor_unit || '';
            this.applicantName = data.applicant_name || '';
            this.applicantMobile = data.applicant_mobile || '';
            this.applicantEmail = data.applicant_email || '';
            this.bankName = data.bank_name || '';
            this.bankerTypeName = data.banker_type_name || '';
            this.loanStatusName = data.loan_status_name || '';
            
            // Set form values for hidden fields
            this.addUnitBankerForm.get('project_id')?.setValue(data.project_id);
            this.addUnitBankerForm.get('wing_id')?.setValue(data.wing_id);
            
            // Create a unit object for the form
            const unitObj: Unit = {
              floor_unit_id: data.unit_id,
              floor_unit: data.floor_unit,
              applicant_name: data.applicant_name,
              booking_id: data.booking_id,
              full_name: `${data.floor_unit} - ${data.applicant_name}`
            };
            
            // Populate the form with data from API
            this.addUnitBankerForm.patchValue({
              unit_id: unitObj,
              sanction_amount: data.sanction_amount && data.sanction_amount.toString() !== 'undefined' ? data.sanction_amount : null,
              agreement_amt: data.agreement_cost,
              own_contribution_pack: data.own_contribution_pack,
              own_contribution_agr: data.own_contribution_agr,
              package_total_amount: data.package_total,
              funding_amount: data.funding_amount,
              banker_type_id: data.banker_type_id,
              bank_id: data.bank_id,
              branch_name: data.branch_name,
              bank_login_date: data.bank_login_date && data.bank_login_date !== '0000-00-00' ? new Date(data.bank_login_date) : null,
              parking_charges: data.parking_charges || 0,
              other_charges: data.other_charges || 0,
              maintenance_charges: data.maintenance,
              legal_charges: data.legal,
              registration_amt: data.reg,
              gst_amt: data.gst,
              stamp_duty: data.stamp_duty,
              society_formation_charges: data.society_for || 0,
              sanction_date: data.sanction_date && data.sanction_date !== '0000-00-00' ? new Date(data.sanction_date) : null,
              loan_status_id: data.loan_status_id,
              banker_name: data.banker_name,
              banker_email: data.banker_email,
              banker_mobile_no: data.banker_mobile_no,
              rate_of_interest: data.rate_of_interest,
              loan_no: data.loan_no,
              remark: data.remark
            });
            
            // Load dropdown data
            this.fetchAllBanerTypelist();
            this.fetchAllLoanStatus();
            this.fetchPreferredBankDropdown();
          } else {
            this.snackBar.open('No data found or invalid response format', 'Close', { duration: 3000 });
          }
        }
      });
  }

  // Method to refresh list data
  refreshListData(): void {
    // Check if the list component has a refresh method
    if (this.listComponent && typeof this.listComponent.fetchAllUnitBankers === 'function') {
      this.listComponent.fetchAllUnitBankers();
    }
  }
  
  // Handle tab click - prevent changing to disabled tab
  handleTabClick(index: number): void {
    if (index === 1 && !this.isListTabEnabled) {
      // If trying to click on list tab but it's disabled, show message
      this.snackBar.open('Please submit the form successfully first to view the list', 'Close', { duration: 3000 });
      return;
    }
    this.selectedTabIndex = index;
  }
}