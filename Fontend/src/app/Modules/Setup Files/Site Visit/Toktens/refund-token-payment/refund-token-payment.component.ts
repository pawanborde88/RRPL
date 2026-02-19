import { CommonModule, DatePipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AmountDirective } from '../../../../../Common/Amount Direcitve/amount.directive';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { IndianCurrencyFormatPipe } from '../../../../../Pipes/currency/indian-currency-format.pipe';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { AddTokenPaymentComponent } from '../Token Payment/add-token-payment/add-token-payment.component';

@Component({
  selector: 'app-refund-token-payment',
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
    
   
  ],
  templateUrl: './refund-token-payment.component.html',
  styleUrl: './refund-token-payment.component.scss'
})
export class RefundTokenPaymentComponent {
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
  refundTokenData: any;
    selectedFile: File | null = null;
  pipe = new DatePipe('en-US');

  isTokenUpgraded: boolean = false;
  isPaymentDone: boolean = false;
  constructor(
        public dialogRef: MatDialogRef<RefundTokenPaymentComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

    private _activatedRoute: ActivatedRoute,
    private router: Router
  ) {}
  upgradeTokens = new FormGroup({
    project_id: new FormControl(),
    token_id: new FormControl(null),
    token_type_id: new FormControl(),
    first_name: new FormControl(null),
    last_name: new FormControl(null),
    middle_name: new FormControl(null),
payment_mode_id: new FormControl(),
    mob_no: new FormControl('', [
      Validators.pattern(/^\d{10}$/),
      Validators.minLength(10),
      Validators.maxLength(10),
    ]),
    amount: new FormControl('', [Validators.required, Validators.min(1)]),
created_by: new FormControl(''),
    cheque_no: new FormControl(''),
    upi_id: new FormControl(''),
    card_no: new FormControl(''),
    floor_id: new FormControl('', Validators.required), // Changed from floor_unit_id
    floor_unit_id: new FormControl('', Validators.required),
    unit_type: new FormControl('', Validators.required),
    email_id: new FormControl(),
       bank_name: new FormControl(''),
    ifsc_code: new FormControl(''),
    bank_branch: new FormControl(''),
    token_amount: new FormControl(),
    amount_paid: new FormControl(),
    payment_attachment: new FormControl(''),
    wing_id: new FormControl(null),
  });

  ngOnInit(): void {
    this.refundTokenData = this.data;
    this.tokenID = this.data.token_id;

    console.log(this.refundTokenData);

    if (this.refundTokenData) {
      this.upgradeTokens.get('project_id')?.disable(); // ✅ Disable here

      this.upgradeTokens.patchValue({
        project_id: this.refundTokenData.project_id,
        token_type_id: this.refundTokenData.token_type_id,
        first_name: this.refundTokenData.first_name,
        middle_name: this.refundTokenData.middle_name,
        last_name: this.refundTokenData.last_name,
        email_id: this.refundTokenData.email_id,

        mob_no: this.refundTokenData.mob_no,
      });
    }
    this.setupFormValueChanges();

    this.fetchAllProjects(); // always fetch project list
  }
  setupFormValueChanges(): void {
    if (this.refundTokenData.project_id) {
      this.setupTokenTypeHandler(this.refundTokenData.project_id);
      this.fetchAllWings(this.refundTokenData.project_id);
      this.fechpreferencedropdown(this.refundTokenData.project_id);
      this.fetchPaymentModeDropdown()

      // Reset all dependent fields
      this.resetDependentFields();
      this.upgradeTokens.get('project_id')?.disable();
    }

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
    onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
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


    // Explicitly ensure these fields are included
    formData.append('token_id', this.tokenID.toString());
    formData.append('created_by', this.userId.toString()); // Explicitly add created_by


    // Append file if selected
    if (this.selectedFile) {
      formData.append('payment_attachment', this.selectedFile);
    }

    const apiUrl = `${this.baseUrl}/refund_token_payment`;

    this.http.post(apiUrl, formData).subscribe({
      next: (res: any) => {
        if (res.success) {
   
            this.dialog.open(SuccessDialogComponent, {
              data: { message: res.message },
            });
  
        }
      },
      error: (error) => {
        this.dialog.open(SuccessDialogComponent, {
          data: { message: error.error?.message || 'Something went wrong' },
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
