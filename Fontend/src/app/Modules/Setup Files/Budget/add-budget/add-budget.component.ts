import { Component, Inject, OnInit } from '@angular/core';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { MatDatepicker } from '@angular/material/datepicker';
import { Moment } from 'moment';
import moment from 'moment';
import { MAT_DATE_FORMATS, DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MomentDateAdapter, MatMomentDateModule } from '@angular/material-moment-adapter';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';

// Custom date formats to show only month/year
export const MONTH_YEAR_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-add-budget',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    ReactiveFormsModule,
    MatMomentDateModule,
    AutocompleteReusableComponent
  ],
  templateUrl: './add-budget.component.html',
  styleUrl: './add-budget.component.scss',
  providers: [
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS },
  ],
})
export class AddBudgetComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading: boolean = false;
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  allChannelPartnerList: any[] = [];
  projectsList: any[] = []; // Will hold project data
  sourcesList: any[] = []; // Will hold source data
  sourcerDetailedList: any[] = []; // Will hold source detail data


  addBudget = new FormGroup({
    project_id: new FormControl('', Validators.required),
    user_id: new FormControl(this.userId),
    year: new FormControl(''),
    month: new FormControl(''),
    source_id: new FormControl('', Validators.required),
    source_detail_id: new FormControl(''),
    channel_partner_id: new FormControl(''),
    active_status_id: new FormControl(1),
    amount: new FormControl('', [Validators.required, Validators.min(1)]),
    remark: new FormControl(''),
    is_delete:new FormControl(0),
  });
  date = new FormControl(moment());

  setMonthAndYear(normalizedMonthAndYear: Moment, datepicker: MatDatepicker<Moment>) {
    const ctrlValue = this.date.value ?? moment();
    ctrlValue.month(normalizedMonthAndYear.month());
    ctrlValue.year(normalizedMonthAndYear.year());
    this.date.setValue(ctrlValue);

    // Update the reactive form so year & month get submitted automatically
    this.addBudget.patchValue({
      year: ctrlValue.year().toString(),
      month: (ctrlValue.month() + 1).toString(), // moment months are 0-indexed, API expects 1-12
    });

    datepicker.close();
  }
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { item: any }, // Correctly type data and item
    private dialogRef: MatDialogRef<AddBudgetComponent>
  ) {}
  

  ngOnInit(): void {
    console.log(this.data);
    
    this.fetchAllProjects();
    this.fetchAllSources();

 
    this.addBudget.get('source_id')?.valueChanges.subscribe((sourceId) => {
      if (sourceId) {
        this.fetchAllSourceDetails(sourceId);
      }
    
    });
 
    if (this.data?.item?.budget_id) {
      this.fetchSingleBudget(); // Only call if budget_id exists
    } 
  
    
  }
  onPartnerSearch(
    searchText: string,
    loadInitialData?: boolean,
    initialPartnerId?: any
  ): void {
    const trimmedSearch = searchText.trim();

    // Clear dropdown if search is too short (unless loading initial data)
    if (!loadInitialData && trimmedSearch.length <= 3) {
      this.allChannelPartnerList = [];
      return;
    }

    const requestBody: any = loadInitialData
      ? {}
      : {
          firm_name: trimmedSearch,
          channel_partner_id: null,
        };

    if (loadInitialData) {
      // Use the provided initialPartnerId or fall back to form value
      requestBody.channel_partner_id =
        initialPartnerId || this.addBudget.value.channel_partner_id;
    }

    this.http
      .post(`${this.baseUrl}/channel_partner_dropdown`, requestBody)
      .subscribe({
        next: (res: any) => {
          this.allChannelPartnerList = res.map((item: any) => ({
            ...item,
            full_name: `${item.firm_name} --(${item.cp_owner})`,
          }));
        },
        error: () => {
          this.snackBar.open('Unable to fetch partners.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  fetchSingleBudget() {
    this.http.post(`${this.baseUrl}/fetch_single_budget`, { budget_id: this.data.item.budget_id }).subscribe({
      next: (res: any) => {
        if (res) {
          const budgetData = res;

          // Check if budget_id exists in the response and patch the form
          if (budgetData && budgetData.budget_id) {
            this.addBudget.patchValue({
              project_id: budgetData.project_id || '',
              user_id: budgetData.user_id || this.userId,
              year: budgetData.year || '',
              month: budgetData.month || '',
              source_id: budgetData.source_id || '',
              source_detail_id: budgetData.source_detail_id || '',
              channel_partner_id:budgetData.channel_partner_id || '',
              amount: budgetData.amount || '',
              remark: budgetData.remark || '',
            });

            // Keep the month-year picker in sync when editing
            if (budgetData.year && budgetData.month) {
              // moment months are 0-indexed
              const editDate = moment({
                year: Number(budgetData.year),
                month: Number(budgetData.month) - 1,
                date: 1,
              });
              this.date.setValue(editDate);
            }
            if (budgetData.channel_partner_id) {
              this.onPartnerSearch('', true, res.channel_partner_id);
            }
          } else {
            console.error('Budget data or budget_id is missing in the response:', res);
          }
        } else {
          console.error('Invalid response data:', res);
        }
      },
      error: (err) => {
        console.error('Error fetching SOP details:', err);
      },
    });
  }
  
  fetchAllSources(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/source_dropdown`).subscribe({
      next: (res: any) => {
        this.sourcesList = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch source details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  fetchAllSourceDetails(sourceId: any): void {
    if (sourceId) {
      this.loading = true;
      this.http
        .post(`${this.baseUrl}/source_detail_dropdown`, { source_id: sourceId }) // Pass source_id in the request body
        .subscribe({
          next: (res: any) => {
            this.sourcerDetailedList = res;
            this.loading = false;
          },
          error: (err: any) => {
            console.error(err);
            this.loading = false;
            this.snackBar.open('Unable to fetch source details.', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  }

  fetchAllProjects(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/project_dropdown`).subscribe({
      next: (res: any) => {
        this.projectsList = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch project details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onSubmit(): void {
    // Clone form data and allow dynamic properties
    const formData = { ...this.addBudget.value } as Record<string, any>;
  
    console.log('Form Data:', formData);
  
    this.loading = true;
  
    // Add budget_id if it exists in the data
    if (this.data?.item?.budget_id) {
      formData['budget_id'] = this.data.item.budget_id;
    }
    if(this.data?.item?.budget_id){
      formData['updated_by'] = this.userId;
    }
    else{
      formData['created_by'] = this.userId;
    }
    // Determine the correct endpoint
    const apiEndpoint = this.data?.item?.budget_id
      ? `${this.baseUrl}/edit_budget`
      : `${this.baseUrl}/add_budget`;
  
    this.http.post(apiEndpoint, formData).subscribe({
      next: (response: any) => {
        this.loading = false;
        console.log('Budget saved successfully:', response);
  
        const successMessage = this.data?.item?.budget_id
          ? 'Budget Updated successfully!'
          : 'Budget added successfully!';
        this.snackBar.open(successMessage, 'Close', {
          duration: 3000,
        });
  
        // Close the dialog and pass success flag
        this.dialogRef.close(true);
      },
      error: (err: any) => {
        this.loading = false;
        console.error('Error saving budget:', err);
        this.snackBar.open('Failed to save budget.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  
 
  
}
