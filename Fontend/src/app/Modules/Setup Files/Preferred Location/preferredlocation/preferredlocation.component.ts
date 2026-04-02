import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { MatTableDataSource } from '@angular/material/table';
import { AddPreffedLocationComponent } from '../add-preffed-location/add-preffed-location.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-preferredlocation',
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
    ReusableTableComponent,
  ],
  templateUrl: './preferredlocation.component.html',
  styleUrl: './preferredlocation.component.scss',
})
export class PreferredlocationComponent implements OnInit {
  loadingState: boolean = true;
  baseUrl = environment.API_URL;
  loading = false;

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
    { key: 'preferred_location', label: 'Preferred Location' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);

  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) {}
  ngOnInit(): void {
    this.fetchAllPreferdLocaiton();
  }
  applyFilter(searchText: string) {
    this.dataSource.filter = searchText.trim().toLowerCase();
  }
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Location',
      action: 'leadAssign',
      color: 'primary',
    },
    ...(this.roleId === 2
      ? [
          {
            icon: 'delete',
            tooltip: 'Delete Location',
            action: 'deleteProject',
            color: 'warn',
          },
        ]
      : []),
  ];
  headerButtons = [
  {
    label: 'Add Preferred Location',
    icon: 'add_circle',
    color: 'primary',
    disabled: () => false,
    action: () => this.openAddPreferredLocation('add'),
    show: () => true,
  }
];
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.openAddPreferredLocation('edit', row);

        break;
      case 'deleteProject':
        this.deletePreferredLocation(row.preferred_location_id);
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
      if (
        !this.selectedProjects.some(
          (p) => p.preferred_location_id === row.preferred_location_id
        )
      ) {
        this.selectedProjects.push({ ...row }); // Add a copy of the project
      }
    } else {
      this.selectedProjects = this.selectedProjects.filter(
        (p) => p.preferred_location_id !== row.preferred_location_id
      );
    }

    console.log('Selected Projects:', this.selectedProjects);
  }
  fetchAllPreferdLocaiton(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/fetch_preferred_location`).subscribe({
      next: (res: any) => {
        this.dataSource.data = res;
        this.dataSource = new MatTableDataSource(res);

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
  openAddPreferredLocation(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddPreffedLocationComponent, {
      minWidth: '25vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title:
          action === 'add'
            ? 'Add Preferred Location'
            : 'Edit Preferred Location',
        apiUrl:
          action === 'add'
            ? 'add_preferred_location'
            : 'edit_preferred_location',
        successMessage:
          action === 'add'
            ? 'Preferred Location added successfully'
            : 'Preferred Location updated successfully',
        rowData: row, // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllPreferdLocaiton(); // Refresh the list if data was modified
      }
    });
  }
  deletePreferredLocation(preferredLocationID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete  Location' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          preferred_location_id: preferredLocationID,
        };
        this.http
          .post(`${this.baseUrl}/delete_preferred_location`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open(
                'Preferred Location deleted successfully',
                'Close',
                {
                  duration: 3000,
                }
              );
              this.fetchAllPreferdLocaiton(); // Ensure this is called here to update the teams
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
