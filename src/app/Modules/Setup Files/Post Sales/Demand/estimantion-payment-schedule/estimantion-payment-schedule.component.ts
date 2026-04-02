import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { tap, switchMap, of } from 'rxjs';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { IndianCurrencyPipe } from '../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddDemandGenerationComponent } from '../Demand Dashboard/Demand Generation/add-demand-generation/add-demand-generation.component';

interface Project {
  project_id: number;
  property_name: string;
  // Add other properties as needed
}

interface Wing {
  wing_id: number;
  wing_name: string;
  // Add other properties as needed
}

interface Demand {
  // Define the structure of your demand data
  [key: string]: any;
}
@Component({
  selector: 'app-estimantion-payment-schedule',
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
     AddDemandGenerationComponent,
     IndianCurrencyPipe,
     ActionColumnComponent,
     ReusableTableComponent,
   ],
  templateUrl: './estimantion-payment-schedule.component.html',
  styleUrl: './estimantion-payment-schedule.component.scss'
})
export class EstimantionPaymentScheduleComponent {
  baseUrl = environment.API_URL;
  loading = false;
  allWingslist: Wing[] = [];
  projectsList: Project[] = [];
  dataSource = new MatTableDataSource<Demand>();
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  searchText = '';
  pipe = new DatePipe('en-US');
  currentBookingId: number | null = null;

  addUnitBankerForm = new FormGroup({
    project_id: new FormControl<number | null>(this.userId, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
  });
 displayedColumns = [
    {
    key: 'sr_no',
    label: 'Sr.no',
    type: 'index',
  },
  {
    key: 'payment_stage',
    label: 'Payment Stage',
  },
    {
    key: 'percentage',
    label: 'Percent (%)',
  },
  {
    key: 'status_string',
    label: 'Status',
    applyChequeStatusColor: true,
    colorCondition: (element: any) =>
      element.status === 1 ? 'green' : 'red',
  },

  {
    key: 'total_floor_unit',
    label: 'No. of Units',
  },

  {
    key: 'total_carpet_area',
    label: 'Salable Area',
  },
  {
    key: 'booking_unit',
    label: 'Sold Unit',
  },
  {
    key: 'unsold_unit',
    label: 'Unsold Unit',
  },
  {
    key: 'unsold_area',
    label: 'Unsold Area',
  },
  {
    key: 'unsold_basic_cost',
    label: 'Unsold Basic Cost',
    isAmount: true,
  },
  {
    key: 'unsold_agreement_cost',
    label: 'Unsold Agreement Cost',
    isAmount: true,
  },
  {
    key: 'completed_floor_unit_count',
    label: 'Stage Completed Unit',
   
  },
  {
    key: 'agreement_cost',
    label: 'Agreement Cost',
    isAmount: true,
  },
  {
    key: 'sold_agreement_cost',
    label: 'Sold Agreement Cost',
    isAmount: true,
  },
  {
    key: 'sale_carpet_area',
    label: 'Sale Carpet Area',
  },

 
  {
    key: 'total_sold_unsold_collection',
    label: 'Total Sold & Unsold Collection',
    isAmount: true,
  },
  {
    key: 'stage_wise',
    label: 'Stage Wise',
    isAmount: true,
  },
  {
    key: 'stage_complete_wise',
    label: 'Stage Complete Wise',
    isAmount: true,
  },
  {
    key: 'received_amount',
    label: 'Received Amount',
    isAmount: true,
  },
  {
    key: 'balance_amount',
    label: 'Balance Amount',
    isAmount: true,
  },
  {
    key: 'stage_wise_gst',
    label: 'Stage Wise GST',
    isAmount: true,
  },
  {
    key: 'stage_complete_wise_gst',
    label: 'Stage Complete Wise GST',
    isAmount: true,
  },
  {
    key: 'received_gst',
    label: 'Received GST',
    isAmount: true,
  },
  {
    key: 'balance_gst',
    label: 'Balance GST',
    isAmount: true,
  }
];

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}

  ngOnInit(): void {
    this.fetchAllProjects();
    this.setupFormValueChanges();
  }

  private setupFormValueChanges(): void {
    this.addUnitBankerForm.get('project_id')?.valueChanges.pipe(
      tap((projectId: number | null) => {
        if (projectId) {
          this.fetchAllWings(projectId);
          // Reset wing selection when project changes
          this.addUnitBankerForm.get('wing_id')?.reset();
          this.dataSource.data = [];
        }
      }),
      switchMap((projectId: number | null) => 
        projectId ? this.addUnitBankerForm.get('wing_id')?.valueChanges || of(null) : of(null)
      ),
      tap((wingId: number | null) => {
        const projectId = this.addUnitBankerForm.get('project_id')?.value;
        if (wingId && projectId) {
          this.fetchAllDemand(projectId, wingId);
        } else {
          this.dataSource.data = [];
        }
      })
    ).subscribe();
  }

  fetchAllDemand(projectId: number, wingId: number): void {
    this.loading = true;
    this.http.post<{ data: Demand[] }>(`${this.baseUrl}/fetch_estimation_payment_shadule`, {
      project_id: projectId,
      wing_id: wingId,
    }).subscribe({
      next: (res:any) => {
                this.dataSource = new MatTableDataSource(res);

        this.dataSource.data = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(err.error?.message || 'No units available for this wing.', 'Close', {
          duration: 3000,
        });
        this.dataSource.data = [];
      }
    });
  }

  fetchAllProjects(): void {
    this.loading = true;
    const payload = {
      user_id:  this.userId,
    };

    this.http.post<Project[]>(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res) => {
        this.projectsList = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching projects:', err);
        this.loading = false;
        this.snackBar.open('Unable to fetch projects. Please try again later.', 'Close', {
          duration: 3000,
        });
        this.projectsList = [];
      },
    });
  }

  fetchAllWings(projectId: number): void {
    this.loading = true;
    this.http.post<Wing[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectId }).subscribe({
      next: (res) => {
        this.allWingslist = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching wings:', err);
        this.loading = false;
        this.snackBar.open('No wings available for the selected project', 'Close', {
          duration: 3000,
        });
        this.allWingslist = [];
      },
    });
  }

  // Add this if you need to initialize the paginator and sort after view init
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  
}
