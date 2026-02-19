import { CommonModule, DatePipe } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../../../Common/template/template.component';
import { IndianCurrencyPipe } from '../../../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../../../environments/environment';
import { FetchFunctionsService } from '../../../../../../../Service/fetch-functions.service';
import { UpdateStagesComponent } from '../update-stages/update-stages.component';
interface ActionButton {
  action: string;
  icon: string;
  tooltip: string;
  color?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-update-stages-list',
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
      ReusableTableComponent,
    ],
  templateUrl: './update-stages-list.component.html',
  styleUrl: './update-stages-list.component.scss'
})
export class UpdateStagesListComponent {
 baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  allWingslist: any[] = []; // Initialize allWingslist as an empty array
  allUnitNoList: any[] = []; // Added missing declaration  registrationOfficeList: any[] = [];
  dataSource = new MatTableDataSource<any>();
  projectsList: any[] = [];
  registrationOfficeList: any[] = [];
  totalPercentage: number = 0;
  isTotalPercentageFull: boolean = false;
  agreementCopyStatusList: any[] = []; // Initialize projectsList as an empty array
  confiList: any[] = []; // Initialize confiList as an empty array
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  searchText: string = '';
  pipe = new DatePipe('en-US');
  currentBookingId: number | null = null;
  bookingDisplayedColumns = [
 
    {
      key: 'sr_no',
      label: 'Sr.no',
      type: 'index',
    },
    { key: 'project_name', label: 'Project  ' },

        { key: 'wing_name', label: 'Wing' },

    { key: 'payment_stage', label: 'Particulars' },
    { key: 'percentage', label: 'Percentage (%)',  isAmount: true 
    },

    { key: 'stage_date', label: 'Stage Date', type: 'short_date' },

    {
      key: 'status_string',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.status === 1 ? 'green' : 'red',
    },

    { key: 'actual_date', label: 'Actual Date', type: 'short_date' },
    { key: 'architecture_letter', label: 'Architecture Letter', type: 'file' },

    { key: 'site_work_progress', label: 'Site Work Progress', type: 'file' },
  ];


  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}

  ngOnInit(): void {
    this.fetchAllProjects();
    this.addpaymentStages.get('project_id')?.valueChanges.subscribe((projectId) => {
      if (projectId) {
        this.fetchAllWings(projectId);
      }
    });

    this.addpaymentStages.get('wing_id')?.valueChanges.subscribe((wingId) => {
      const projectId = this.addpaymentStages.get('project_id')?.value;
      if (wingId && projectId) {
        this.fetchPaymentStages(projectId, wingId);
      }
    });
    
  }
  addpaymentStages = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
  });
  headerButtons = [
    
    {
      label: 'Update Stages',
      icon: 'add_circle',
      color: 'primary',
      action: () => this.openAddBookingVisitorDialog(),
      disabled: () => false,
      show: () => true,
    },
  ]; 

  bookingActions: ActionButton[] = [
    {
      action: 'editPaymentStage',
      icon: 'edit_note',
      tooltip: 'Edit Stage',
      color: 'primary',
      disabled: false,
    },
    {
      action: 'deleteBooking',
      icon: 'delete',
      tooltip: 'Delete Stage',
      color: 'warn',
      disabled: false,
    },
  ];
  fetchAllProjects(): void {
    this.loading = true;
    const payload = {
      user_id:  this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        this.projectsList = res || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching projects:', err);
        this.snackBar.open('Unable to fetch projects.', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
  fetchAllWings(projectId: number): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/wing_dropdown`, { project_id: projectId }).subscribe({
      next: (res: any) => {
        this.allWingslist = res || [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error fetching wings:', err);
        this.snackBar.open('No wings available for selection', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }
  openAddBookingVisitorDialog(): void {
    const dialogRef = this.dialog.open(UpdateStagesComponent, {
      minWidth: '70vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
   
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }
  
  fetchPaymentStages ( projectId:number, wingId:number ): void {
 
    this.http
      .post(`${this.baseUrl}/fetch_payment_stage`, {
        project_id: projectId,
        wing_id: wingId,
      })
      .subscribe({
        next: (res: any) => {
          this.dataSource = new MatTableDataSource(res);

          this.dataSource = new MatTableDataSource(res.data || []);
          this.totalPercentage =
            res.data?.reduce(
              (sum: number, stage: any) =>
                sum + (Number(stage.percentage) || 0),
              0
            ) || 0;
          this.isTotalPercentageFull = this.totalPercentage >= 100;
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('No units available for selection.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
}
