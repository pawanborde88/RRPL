import { Component, OnInit } from '@angular/core';
import { environment } from '../../../../../../environments/environment';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { AddTokenPaymentComponent } from '../Token Payment/add-token-payment/add-token-payment.component';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';

@Component({
  selector: 'app-pay-token-manually',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    AutocompleteReusableComponent,
    AddTokenPaymentComponent,
    AmountDirective ,

  ],
  templateUrl: './pay-token-manually.component.html',
  styleUrl: './pay-token-manually.component.scss'
})
export class PayTokenManuallyComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading = false;
  allPaymentMode: any[] = [];
  confiList: any[] = [];
  FloorUnitDropdown: any[] = [];
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  showUpgradeDetails: boolean = false;
  showPaymnually: boolean = false;
  projectsList: any[] = [];
  tokenID: any;
  UnitNo: any[] = [];
  allTokenType: any[] = [];
  preferenceDropdown: any[] = [];
  sourceDetailedList: any[] = [];
  allTokenUnit: any[] = [];
  allWingslist: any[] = [];
  elementData: any;
  isTokenUpgraded: boolean = false;
  isPaymentDone: boolean = false;
  pipe = new DatePipe('en-US');
  selectedFile: File | null = null;

  upgradeTokens = new FormGroup({
    project_id: new FormControl(),
    token_id: new FormControl(null),
    token_type_id: new FormControl(),
    preference_id: new FormControl(null),
    phase_id: new FormControl(null),
    first_name: new FormControl(null),
    last_name: new FormControl(null),
    middle_name: new FormControl(null),

    mob_no: new FormControl('', [
      Validators.pattern(/^\d{10}$/),
      Validators.minLength(10),
      Validators.maxLength(10),
    ]),
    floor_id: new FormControl('', Validators.required), // Changed from floor_unit_id
    floor_unit_id: new FormControl('', Validators.required),
    floor_unit: new FormControl('', Validators.required),
    unit_type: new FormControl('', Validators.required),
    email_id: new FormControl(),
    token_amount: new FormControl(),
    amount_paid: new FormControl(),
    balance: new FormControl(),
    transaction_id: new FormControl(''),
    payment_mode_id: new FormControl('', Validators.required),
    amount: new FormControl('', [Validators.required, Validators.min(1), ]),

    cheque_no: new FormControl(''),
    upi_id: new FormControl(''),
    card_no: new FormControl(''),
    created_by: new FormControl(this.userId),
    bank_name: new FormControl(''),
    ifsc_code: new FormControl(''),
    bank_branch: new FormControl(''),

    date: new FormControl(
      this.pipe.transform(new Date(), 'yyyy-MM-dd')
    ),
    payment_attachment: new FormControl(''),
    wing_id: new FormControl(null),
  });

  ngOnInit(): void {
    this.elementData = history.state.data;
    
    // Load payment modes immediately
    this.fetchPaymentModeDropdown();

    // Fetch all projects
    this.fetchAllProjects();

    if (this.elementData) {
      this.tokenID = this.elementData.token_id;
      this.fetchSingleToken(this.tokenID);

      console.log('Element Data:', this.elementData);
      // Calculate balance - if token is fully paid, balance will be 0
      const tokenAmount = Number(this.elementData.token_amount) || 0;
      const amountPaid = Number(this.elementData.amount_paid) || 0;
      
      // Show upgrade details if we have token amount info
      this.showUpgradeDetails = !!this.elementData.token_amount;
      
      // Disable project selection since we're working with an existing token
      this.upgradeTokens.get('project_id')?.disable();
      this.upgradeTokens.get('token_type_id')?.disable();
      this.upgradeTokens.get('first_name')?.disable();
      this.upgradeTokens.get('middle_name')?.disable();
      this.upgradeTokens.get('last_name')?.disable();
      this.upgradeTokens.get('email_id')?.disable();
      this.upgradeTokens.get('mob_no')?.disable();
      this.upgradeTokens.get('token_amount')?.disable();
      this.upgradeTokens.get('amount_paid')?.disable();
      this.upgradeTokens.get('floor_id')?.disable();
      this.upgradeTokens.get('floor_unit_id')?.disable();
      this.upgradeTokens.get('floor_unit')?.disable();
      this.upgradeTokens.get('unit_type')?.disable();
      this.upgradeTokens.get('wing_id')?.disable();
      this.upgradeTokens.get('token_id')?.disable();
      this.upgradeTokens.get('token_type_id')?.disable();
      this.upgradeTokens.get('token_amount')?.disable();
      this.upgradeTokens.get('amount_paid')?.disable();
      this.upgradeTokens.get('balance')?.disable();

      this.upgradeTokens.patchValue({
        project_id: this.elementData.project_id,
        token_id: this.elementData.token_id,
        wing_id: this.elementData.wing_id,
        token_type_id: this.elementData.token_type_id,
        first_name: this.elementData.first_name,
        middle_name: this.elementData.middle_name,
        last_name: this.elementData.last_name,
        email_id: this.elementData.email_id,
        floor_unit: this.elementData.floor_unit,
        mob_no: this.elementData.mob_no,
        token_amount: this.elementData.token_amount,
        amount_paid: this.elementData.amount_paid,
        floor_id: this.elementData.floor_id || '',
        unit_type: this.elementData.unit_type || '',
        preference_id: this.elementData.preference_id,
        phase_id: this.elementData.phase_id
      });
      
      // If floor_unit_id exists, set it
      if (this.elementData.floor_unit_id) {
        this.upgradeTokens.patchValue({
          floor_unit_id: this.elementData.floor_unit_id
        });
      }
      
      // Setup dependent data based on project_id
      if (this.elementData.project_id) {
        this.setupTokenTypeHandler(this.elementData.project_id);
        this.fetchAllWings(this.elementData.project_id);
        this.fechpreferencedropdown(this.elementData.project_id);
        this.fetchallProjectFloors(this.elementData.project_id, this.elementData.wing_id);
        // If wing_id exists, fetch floors
        if (this.elementData.wing_id) {
          this.fetchallProjectFloors(this.elementData.project_id, this.elementData.wing_id);
          
          // If floor_id and wing_id exist, fetch unit types
          if (this.elementData.floor_id && this.elementData.wing_id) {
            this.FetchProjectUnitType(
              this.elementData.project_id, 
              this.elementData.wing_id, 
              this.elementData.floor_id
            );
            
            // If unit_type exists, fetch floor units
            if (this.elementData.unit_type) {
              this.fetchTokenFloorUnitDropdown(
                this.elementData.project_id,
                this.elementData.wing_id,
                this.elementData.floor_id,
                this.elementData.unit_type
              );
            }
          }
        }
      }
    }
    
    this.setupFormValueChanges();
  }
  fetchSingleToken(tokenID: any): void {
    this.http
      .post(`${this.baseUrl}/fetch_single_token`, { token_id: tokenID })
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.upgradeTokens.patchValue({
              amount: res.balance,
              token_id: res.token_id,
            });
          }
        },
        error: () => {
          this.snackBar.open(
            'Error occurred while fetching data, please try later',
            'Close',
            { duration: 3000 }
          );
        },
      });
  }
  setupFormValueChanges(): void {
    // Project changes
    this.upgradeTokens
      .get('project_id')
      ?.valueChanges.subscribe((projectID) => {
        if (projectID) {
          this.setupTokenTypeHandler(projectID);
          this.fetchAllWings(projectID);
          this.fechpreferencedropdown(projectID);

          this.resetDependentFields();
        }
      });

    // Wing changes
    this.upgradeTokens.get('wing_id')?.valueChanges.subscribe((wingID) => {
      const projectID = this.upgradeTokens.get('project_id')?.value;
      if (projectID && wingID) {
        this.fetchallProjectFloors(projectID, wingID);
        this.upgradeTokens.get('floor_id')?.reset();
        this.upgradeTokens.get('unit_type')?.reset();
        this.upgradeTokens.get('floor_unit_id')?.reset();
      }
    });

    // Floor changes
    this.upgradeTokens.get('floor_id')?.valueChanges.subscribe((floorId) => {
      const projectID = this.upgradeTokens.get('project_id')?.value;
      const wingID = this.upgradeTokens.get('wing_id')?.value;

      if (projectID && wingID && floorId) {
        this.FetchProjectUnitType(projectID, wingID, floorId);
        this.upgradeTokens.get('unit_type')?.reset();
        this.upgradeTokens.get('floor_unit_id')?.reset();
      }
    });

    // Unit type changes
    this.upgradeTokens.get('unit_type')?.valueChanges.subscribe((unitType) => {
      const projectID = this.upgradeTokens.get('project_id')?.value;
      const wingID = this.upgradeTokens.get('wing_id')?.value;
      const floorID = this.upgradeTokens.get('floor_id')?.value;

      if (projectID && wingID && floorID && unitType) {
        this.fetchTokenFloorUnitDropdown(projectID, wingID, floorID, unitType);
        this.upgradeTokens.get('floor_unit_id')?.reset();
      }
    });

    // Source changes
    this.upgradeTokens.get('source_id')?.valueChanges.subscribe((sourceId) => {
      if (sourceId) {
        this.fetchAllSourceDetails(sourceId);
      }
    });
    
    // Payment amount changes - update balance
    this.upgradeTokens.get('amount')?.valueChanges.subscribe((amount) => {
      if (amount && this.elementData?.token_amount) {
        const tokenAmount = Number(this.elementData.token_amount) || 0;
        const amountPaid = Number(this.elementData.amount_paid) || 0;
        const currentAmount = Number(amount) || 0;
        const newBalance = Math.max(0, tokenAmount - amountPaid - currentAmount);
        
        this.upgradeTokens.patchValue({
          balance: newBalance
        }, { emitEvent: false });
      }
    });
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
      error: () => {},
    });
  }
  
  private resetDependentFields(): void {
    this.upgradeTokens.get('wing_id')?.reset();
    this.upgradeTokens.get('floor_id')?.reset();
    this.upgradeTokens.get('unit_type')?.reset();
    this.upgradeTokens.get('floor_unit_id')?.reset();
  }
  
  fetchTokenFloorUnitDropdown(
    projectID: any,
    wingID: any,
    floorID: any,
    unitType: any
  ): void {
    this.http
      .post(`${this.baseUrl}/token_floor_unit_dropdown`, {
        project_id: projectID,
        wing_id: wingID,
        floor_id: floorID,
        unit_type: unitType,
      })
      .subscribe({
        next: (res: any) => {
          this.UnitNo = res;
        },
        error: () => {
          this.snackBar.open('Unable to fetch floor units.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  
  fechpreferencedropdown(projectID: any): void {
    this.http
      .post(`${this.baseUrl}/web_config_dropdown`, { project_id: projectID })
      .subscribe({
        next: (res: any) => {
          this.preferenceDropdown = res;
        },
        error: () => {},
      });
  }
  
  fetchAllSourceDetails(sourceId: any): void {
    this.http
      .post(`${this.baseUrl}/source_detail_dropdown`, { source_id: sourceId })
      .subscribe({
        next: (res: any) => {
          this.sourceDetailedList = res;
        },
        error: () => {
          this.snackBar.open('Unable to fetch source details.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  
  isHighestTokenSelected(): boolean {
    const selectedTokenId = this.upgradeTokens.get('token_type_id')?.value;
    if (!selectedTokenId || !this.allTokenType) return false;

    const selectedToken = this.allTokenType.find(
      (token) => token.token_type_id === selectedTokenId
    );
    return selectedToken ? selectedToken.is_highest === 1 : false;
  }
  
  onSubmit() {
 
    const formData = new FormData();
    
    // Add all form values to formData
    Object.keys(this.upgradeTokens.controls).forEach(key => {
      if (key !== 'payment_attachment') {
        const control = this.upgradeTokens.get(key);
        if (control) {
          const value = control.value;
          if (value !== null && value !== undefined) {
            // Special handling for date field
            if (key === 'date' && value instanceof Date) {
              formData.append(key, this.pipe.transform(value, 'yyyy-MM-dd') || '');
            } else {
              formData.append(key, value.toString());
            }
          }
        }
      }
    });

    // Ensure critical fields are included
    formData.append('token_id', this.tokenID.toString());
    formData.append('created_by', this.userId.toString());
    
    // Include project_id even if disabled in the form
    if (this.upgradeTokens.get('project_id')?.disabled) {
      formData.append('project_id', this.elementData.project_id.toString());
    }

    // Append file if selected
    if (this.selectedFile) {
      formData.append('payment_attachment', this.selectedFile);
    }

    const apiUrl = `${this.baseUrl}/add_token_payment`;
    this.loading = true;

    this.http.post(apiUrl, formData).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          if (res.code === 201) {
            this.snackBar.open(res.message, 'Close', { duration: 3000 });
          } else {
            // Reset only payment-related fields, not the entire form
            this.resetPaymentFields();
            
            this.dialog.open(SuccessDialogComponent, {
              data: { message: res.message },
            });
            
            // Update the payment status
            this.isPaymentDone = true;
            
            // If token data includes token transactions, update the amount paid
            if (this.elementData && this.upgradeTokens.get('amount')?.value) {
              const currentAmountPaid = Number(this.elementData.amount_paid) || 0;
              const newPayment = Number(this.upgradeTokens.get('amount')?.value) || 0;
              this.elementData.amount_paid = (currentAmountPaid + newPayment).toString();
              
              // Update the balance
              const tokenAmount = Number(this.elementData.token_amount) || 0;
              const totalPaid = currentAmountPaid + newPayment;
              this.elementData.balance = Math.max(0, tokenAmount - totalPaid);
              
              // Update form values
              this.upgradeTokens.patchValue({
                amount_paid: this.elementData.amount_paid,
                balance: this.elementData.balance
              });
            }
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.dialog.open(SuccessDialogComponent, {
          data: { message: error.error?.message || 'Something went wrong' },
        });
      },
    });
  }
  
  resetPaymentFields(): void {
    // Reset only payment-related fields
    this.upgradeTokens.patchValue({
      payment_mode_id: '',
      amount: '',
      transaction_id: '',
      cheque_no: '',
      upi_id: '',
      card_no: '',
      bank_name: '',
      ifsc_code: '',
      bank_branch: '',
      payment_attachment: ''
    });
    this.selectedFile = null;
  }

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private _activatedRoute: ActivatedRoute,
  ) {}

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
  
  fetchPaymentModeDropdown(): void {
    this.http.get(`${this.baseUrl}/payment_mode_dropdown`).subscribe({
      next: (res: any) => {
        this.allPaymentMode = res;
      },
      error: (err: any) => {
        console.error('Error fetching payment modes:', err);
        this.snackBar.open('Unable to fetch payment modes.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  
  setupTokenTypeHandler(projectID: any): void {
    if (!projectID) return;

    // Fetch token types for the project
    this.http
      .post<any>(`${this.baseUrl}/token_type_dropdown`, {
        project_id: projectID,
      })
      .subscribe({
        next: (tokenTypes: any) => {
          // Store all token types
          this.allTokenType = tokenTypes;

          // If you only want to show highest tokens in dropdown, filter them here
          // this.allTokenType = tokenTypes.filter(token => token.is_highest === 1);
        },
        error: (error) => {
          console.error('Error fetching token types:', error);
          this.snackBar.open('Failed to load token types', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }
  
  fetchallProjectFloors(projectID: any, wingID: any): void {
    this.http
      .post(`${this.baseUrl}/fetch_floor_dropdown`, {
        project_id: projectID,
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

  fetchTokenFloorUnit(projectID: any, wingID: any): void {
    this.http
      .post<any>(`${this.baseUrl}/fetch_token_floor_unit`, {
        project_id: projectID,
        wing_id: wingID,
      })
      .subscribe({
        next: (response) => {
          this.allTokenUnit = response.token_given_units;
        },
        error: (error) => {
          console.error('Error fetching token floor unit:', error);
          this.snackBar.open('Unable to fetch floor units.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  fetchAllProjects(): void {
    this.http.get<any>(`${this.baseUrl}/project_dropdown`).subscribe({
      next: (response) => {
        console.log('Response for projectsList:', response);
        this.projectsList = response;
      },
      error: (error) => {
        console.error('Error fetching projectsList:', error);
        this.snackBar.open('Unable to fetch project dropdown data.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  

}
