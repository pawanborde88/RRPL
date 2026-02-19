import { Component, ViewChild } from '@angular/core';
import { EditLetterConfigComponent } from '../edit-letter-config/edit-letter-config.component';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-letter-config-list',
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
    ReusableTableComponent,
  ],
  templateUrl: './all-letter-config-list.component.html',
  styleUrl: './all-letter-config-list.component.scss'
})
export class AllLetterConfigListComponent {
  loadingState: boolean = true;
  baseUrl = environment.API_URL;
  loading = false;
  projectsList: any[] = [];
  selectedProjectId: any | null = null;
  userId = Number(sessionStorage.getItem('session_id'));

  searchQuery: string = '';
  roleId: number = Number(sessionStorage.getItem('role_id'));
  dataSource = new MatTableDataSource<any>([]);

  // Data properties
  columnData: any[] = [];
  rowData: any[] = [];
  filteredRowData: any[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
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
    { key: 'preferred_bank', label: 'Preferred Bank' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing Name' },
    { key: 'letter_type', label: 'Letter Type' },
    { key: 'effective_date', label: 'Effective Date', type: 'year' }, // Assuming this is a year field
    { 
      key: 'created_at', 
      label: 'Created At', 
      type: 'date' 
    },
    { 
      key: 'updated_at', 
      label: 'Updated At', 
      type: 'date' 
    }
  ];
  columnKeys: string[] = this.displayedColumns.map((col) => col.key);

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}
  ngOnInit(): void {
    this.fetchAllProjects();
  }
  applyFilter(searchText: string) {
    this.dataSource.filter = searchText.trim().toLowerCase();
  }
headerButtons = [
  {
    label: ' Add Letter Config',
    icon: 'add_circle',
    color: 'primary',
    disabled: () => false,
    action: () => this.addNewBak('add'),
    show: () => true,
  }
];

  fetchLetterConfig(projectId: number): void {
    this.loading = true;
    this.http.post(`${this.baseUrl}/fetch_letter_config`, {project_id: projectId}).subscribe({
      next: (res: any) => {
               this.dataSource = new MatTableDataSource(res.data || []);

        this.dataSource.data = res.data;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch project Modules.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  onProjectChange(projectId: number): void {
    if (projectId !== null && projectId !== undefined) {
      this.selectedProjectId = projectId;
      // Clear previous data
      this.dataSource.data = [];
      // Fetch visitors for the selected project
      this.fetchLetterConfig(projectId);
    }
  }
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Bank',
      action: 'editLetterConfig',
      color: 'primary',
    },
    ...(this.roleId === 2
      ? [
          {
            icon: 'delete',
            tooltip: 'Delete Project',
            action: 'deleteProject',
            color: 'warn',
          },
        ]
      : []),
  ];
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'editLetterConfig':
        this.addNewBak('edit', row);

        break;
      case 'deleteProject':
        this.deleteLetterConfig(row.letter_config_id);
        break;
      default:
        break;
    }
  }
  selectedProjects: any[] = [];

  toggleSelection(isChecked: boolean, row: any): void {
    if (!row || !row.project_id) {
      console.error('Invalid row data');
      return;
    }

    if (isChecked) {
      if (!this.selectedProjects.some((p) => p.source_id === row.source_id)) {
        this.selectedProjects.push({ ...row }); // Add a copy of the project
      }
    } else {
      this.selectedProjects = this.selectedProjects.filter(
        (p) => p.source_id !== row.source_id
      );
    }

    console.log('Selected Projects:', this.selectedProjects);
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

  addNewBak(action: string, row?: any): void {
    const dialogRef = this.dialog.open(EditLetterConfigComponent, {
      minWidth: '70vw',
      maxWidth: '70vw',
      maxHeight: '100vh',
      data: {
        rowData: row, // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchLetterConfig(this.selectedProjectId); // Refresh the list if data was modified
      }
    });
  }
  deleteLetterConfig(leterConfigID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Preferred Location' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
            letter_config_id: leterConfigID,
        };
        this.http
          .post(`${this.baseUrl}/delete_letter_config`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open(
                'Letter Config deleted successfully',
                'Close',
                {
                  duration: 3000,
                }
              );
              this.fetchLetterConfig(this.selectedProjectId); // Ensure this is called here to update the teams
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Letter Config.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
