import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { AddSourcesComponent } from '../add-sources/add-sources.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-sources',
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
    ReusableTableComponent // Add the pipe here
  ],
  templateUrl: './all-sources.component.html',
  styleUrl: './all-sources.component.scss',
})
export class AllSourcesComponent {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state

  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}

  displayedColumns = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'sr_no',
      label: '',
      type: 'index', // Add this to identify it as an index column
    },
    { key: 'source', label: 'Source' },
        {
      key: 'active_status',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.active_status_id === 1 ? 'green' : 'red',
    },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  ngOnInit(): void {
    this.fetchAllSources();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  selectedProjects: any[] = [];
headerButtons = [
  {
    label: 'Add Sources',
    icon: 'add_circle',
    color: 'primary',
    disabled: () => false,
    action: () => this.openAddEditSorceDialog('add'),
    show: () => true,
  }
];

  toggleSelection(isChecked: boolean, row: any): void {
    if (!row || !row.project_id) {
      console.error('Invalid row data');
      return;
    }
  
    if (isChecked) {
      if (!this.selectedProjects.some(p => p.source_id === row.source_id)) {
        this.selectedProjects.push({...row}); // Add a copy of the project
      }
    } else {
      this.selectedProjects = this.selectedProjects.filter(
        p => p.source_id !== row.source_id
      );
    }
    
    console.log('Selected Projects:', this.selectedProjects);
  }
  fetchAllSources(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/fetch_sources`).subscribe({
      next: (res: any) => {
        
        this.dataSource = new MatTableDataSource(res);

        this.dataSource.data = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch channel partners.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Source',
      action: 'leadAssign',
      color: 'primary',
    },
    ...(this.roleId === 2
      ? [
          {
            icon: 'delete',
            tooltip: 'Delete Source',
            action: 'deleteProject',
            color: 'warn',
          },
        ]
      : []),
  ];
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
                this.openAddEditSorceDialog('edit', row);

        break;
      case 'deleteProject':
        this.deleteSources(row.source_id);
        break;
      default:
        break;
    }
  }
  
  openAddEditSorceDialog(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddSourcesComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Source' : 'Edit Source',
        apiUrl: action === 'add' ? 'add_source' : 'edit_source',
        successMessage:
          action === 'add'
            ? 'Source added successfully'
            : 'Source updated successfully',
        rowData: row, // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllSources(); // Refresh the list if data was modified
      }
    });
  }

  deleteSources(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Source?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          source_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_source`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Team deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllSources(); // Ensure this is called here to update the teams
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
