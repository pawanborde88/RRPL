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
import { AngularMaterialModule } from '../../../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../../../Pipes/truncate.pipe';
import { UpdateStagesListComponent } from '../../Payment Schedule/update-stages-list/update-stages-list.component';
import { HttpClient } from '@angular/common/http';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../../../environments/environment';

@Component({
  selector: 'app-unit-payment-schedule-congig-list',
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
   
    ActionColumnComponent,
    ReusableTableComponent,
    UpdateStagesListComponent,
  ],
  templateUrl: './unit-payment-schedule-congig-list.component.html',
  styleUrl: './unit-payment-schedule-congig-list.component.scss',
})
export class UnitPaymentScheduleCongigListComponent {
  baseUrl = environment.API_URL;
  loading = false;
  allWingsList: any[] = [];
  projectsList: any[] = [];
  allStatusList: any[] = [];
  dataSource = new MatTableDataSource<any>();
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  searchText = '';
  pipe = new DatePipe('en-US');
  currentBookingId: number | null = null;
  maxUnitsCount = 0;
  unitColumns = ['floor_name'];
  allFloorsChecked = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  // Form Group
  addpaymentStages = new FormGroup({
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl('', Validators.required),
    stage_id: new FormControl('', Validators.required),
  });
  selectedStageId: any;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.fetchAllProjects();
    this.setupFormListeners();
  }
floorUnitDisplayedColumns = [

  {
    key: 'sr_no',
    label: 'Sr. No',
    type: 'index',
  },
  {
    key: 'floor_unit',
    label: 'Floor Unit',
  },
 
  {
    key: 'status',
    label: 'Status',
    type: 'boolean', // Optional: Can be used to display check/tick
  },
  {
    key: 'project_name',
    label: 'Project Name',
  },
  {
    key: 'wing_name',
    label: 'Wing Name',
  },
  {
    key: 'payment_stage',
    label: 'Payment Stage',
  },
  {
    key: 'percentage',
    label: 'Percentage (%)',
  },
];

  columnKeys: string[] = this.floorUnitDisplayedColumns.map((col) => col.key); // ✅ Define it as a property
  setupFormListeners(): void {
    this.addpaymentStages
      .get('project_id')
      ?.valueChanges.subscribe((projectId: string | null) => {
        if (projectId) {
          this.fetchAllWings(projectId);
          // Reset dependent fields and data
          this.addpaymentStages.get('wing_id')?.reset();
          this.addpaymentStages.get('stage_id')?.reset();
          this.dataSource.data = [];
          this.allStatusList = [];
        }
      });

    this.addpaymentStages
      .get('wing_id')
      ?.valueChanges.subscribe((wingId: string | null) => {
        const projectId = this.addpaymentStages.get('project_id')?.value;
        if (wingId && projectId) {
          this.fetchStages(projectId, wingId);
          // Reset dependent field
          this.addpaymentStages.get('stage_id')?.reset();
          this.dataSource.data = [];
        } else {
          this.dataSource.data = [];
          this.allStatusList = [];
        }
      });

    // Add listener for stage_id changes
    this.addpaymentStages
      .get('stage_id')
      ?.valueChanges.subscribe((stageId: string | null) => {
        const projectId = this.addpaymentStages.get('project_id')?.value;
        const wingId = this.addpaymentStages.get('wing_id')?.value;
        if (stageId && projectId && wingId) {
          this.fetchAllFloorUnits(projectId, wingId, stageId);
        } else {
          this.dataSource.data = [];
        }
      });
  }

  fetchStages(projectId: string, wingId: string): void {
    this.http
      .post(`${this.baseUrl}/fetch_payment_stage`, {
        project_id: projectId,
        wing_id: wingId,
      })
      .subscribe({
        next: (res: any) => {
          this.allStatusList = res.data || [];
        },
        error: () => this.showError('No payment stages available'),
      });
  }

  fetchAllFloorUnits(projectId: string, wingId: string, stageId: string): void {
    this.http
      .post(`${this.baseUrl}/fetch_floor_all_units`, {
        project_id: projectId,
        wing_id: wingId,
        stage_id: stageId,
      })
      .subscribe({
        next: (res: any) => (this.dataSource.data = res.units || []),
        error: () => this.showError('No units available for selection.'),
      });
  }
  // API methods
  fetchAllProjects(): void {
    this.loading = true;
    const payload = { user_id:  this.userId };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => (this.projectsList = res || []),
      error: () => this.showError('Unable to fetch projects.'),
      complete: () => (this.loading = false),
    });
  }

  fetchAllWings(projectId: string): void {
    this.http
      .post(`${this.baseUrl}/wing_dropdown`, { project_id: projectId })
      .subscribe({
        next: (res: any) => (this.allWingsList = res || []),
        error: () => this.showError('No wings available'),
      });
  }
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
