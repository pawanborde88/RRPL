import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { AddBrokerageSlabsComponent } from '../add-brokerage-slabs/add-brokerage-slabs.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { BrokerageImagesComponent } from '../brokerage-images/brokerage-images.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-all-brokerage',
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
    ReusableTableComponent
  ],
  templateUrl: './all-brokerage.component.html',
  styleUrl: './all-brokerage.component.scss',
})
export class AllBrokerageComponent implements OnInit {
   myForm: FormGroup;

baseUrl = environment.API_URL;
storageUrl = environment.STORAGE_URL;
projectData: any = {};
roleId = Number(sessionStorage.getItem('role_id')) || null;
userId = Number(sessionStorage.getItem('session_id')) || null;
allBrokerageList: any[] = [];
allcpList: any[] = [];
allBrokerageImages: any;
allProjectSpecifiationList: any[] = [];
selectedCpType: number =0;
selectedPhaseId: number | null = null;
allProjectPhases: any[] = [];
  loading = false;
  dataSource = new MatTableDataSource<any>([]);
  projectsList: any[] = [];
constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.myForm = this.fb.group({
      project_id: ['']
    });
  }
  displayedColumns = [
    {
      key: 'actions',
      label: '',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'sr_no',
      label: 'Sr. No.',
      type: 'index',
    },
    { key: 'brokerage_slab_from', label: 'Slab From'  },
    { key: 'brokerage_slab_to', label: 'Slab To'  },
    { key: 'valid_from', label: 'Valid From',type: 'date'
      },
    { key: 'valid_till', label: 'Valid Till',type: 'date'
      },
    { key: 'brokerage_unit', label: 'Unit' },
    { key: 'value', label: 'Value' },
    { key: 'brokerage_value_unit', label: 'Value Unit' },
   
  ];
  ngOnInit(): void {
    this.fetchAllProjects();
    
    // Listen for project selection changes
    this.myForm.get('project_id')?.valueChanges.subscribe((value:any) => {
      if (value) {
        this.fetchBrokerageSlabs();
      }
    });
  }
get projectID() {
  return this.myForm.get('project_id')?.value;
}
fetchBrokerageSlabs(): void {
  if (!this.projectID) return;
  this.loading = true;
  const payload = {
    project_id: this.projectID,

  };

  this.http.post(`${this.baseUrl}/fetch_brokerage_slab`, payload).subscribe({
    next: (res: any) => {
      this.dataSource = new MatTableDataSource(res);

      this.dataSource.data = res;
      this.allBrokerageList = Array.isArray(res) ? res : [];
      this.dataSource.data = this.allBrokerageList;
    },
    error: () => {
      this.snackBar.open('Unable to fetch project configuration.', 'Close', {
        duration: 3000,
      });
    },
    complete: () => {
      this.loading = false;
    }
  });
}
projectActions = [
  {
    icon: 'edit_note',
    tooltip: 'Edit Brokerage',
    action: 'editProject',
    color: 'primary',
  },
  {
    icon: 'delete',
    tooltip: 'Delete Brokerage',
    action: 'deleteProject',
    color: 'warn',
  },
];
headerButtons = [
    
  {
    label: 'Add Brokerage',
    icon: 'add_circle',
    color: 'primary',
    action: () => this.openBrokerage('add'),
    disabled: () => false,
    show: () => true,
  },
];
onProjectAction(action: string, row: any): void {
  switch (action) {
    case 'deleteProject':
      this.deleteBrokerageSlab(row.brokerage_slab_id);
      break;
    case 'editProject':
      this.openBrokerage('edit', row);
      break;
    default:
      break;
  }
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
openBrokerage(action: string, row?: any): void {
  const dialogRef = this.dialog.open(AddBrokerageSlabsComponent, {
    minWidth: '40vw',
    maxWidth: '50vh',
    maxHeight: '100vh',
    data: {
      title: action === 'add' ? 'Add Brokerage' : 'Edit Brokerage',
      apiUrl: action === 'add' ? 'add_brokerage_slab' : 'edit_brokerage_slab',
      successMessage: action === 'add' ? 'Brokerage added successfully' : 'Brokerage updated successfully',
      rowData: row,
      projectid: this.projectID,
    }
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) this.fetchBrokerageSlabs();
  });
}

deleteBrokerageSlab(brokerageSlabID: any): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
     minWidth: '25vw',
    data: { message: 'Are you sure you want to delete this Brokerage Slab?' }
  });

  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.http.post(`${this.baseUrl}/delete_brokerage_slab`, { brokerage_slab_id: brokerageSlabID }).subscribe({
        next: () => {
          this.snackBar.open('Brokerage Slab deleted successfully', 'Close', { duration: 3000 });
          this.fetchBrokerageSlabs();
        },
        error: () => this.snackBar.open('Unable to delete the image.', 'Close', { duration: 3000 })
      });
    }
  });
}

}
