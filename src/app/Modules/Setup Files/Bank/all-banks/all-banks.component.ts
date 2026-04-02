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
import { AddNewBankComponent } from '../add-new-bank/add-new-bank.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-banks',
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
  templateUrl: './all-banks.component.html',
  styleUrl: './all-banks.component.scss',
})
export class AllBanksComponent {
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
    { key: 'preferred_bank', label: 'Preferred Bank' },
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
headerButtons = [
  {
    label: ' Add Preferred Bank',
    icon: 'add_circle',
    color: 'primary',
    disabled: () => false,
    action: () => this.addNewBak('add'),
    show: () => true,

  }
];
  fetchAllPreferdLocaiton(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/fetch_preferred_bank`).subscribe({
      next: (res: any) => {
               this.dataSource = new MatTableDataSource(res);

        this.dataSource.data = res;
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
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Bank',
      action: 'leadAssign',
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
      case 'leadAssign':
        this.addNewBak('edit', row);

        break;
      case 'deleteProject':
        this.deleteBank(row.preferred_bank_id);
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
  addNewBak(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddNewBankComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Bank' : 'Edit Bank',
        apiUrl: action === 'add' ? 'add_preferred_bank' : 'edit_preferred_bank',
        successMessage:
          action === 'add'
            ? 'Bank added successfully'
            : 'Bank updated successfully',
        rowData: row, // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllPreferdLocaiton(); // Refresh the list if data was modified
      }
    });
  }
  deleteBank(BankId: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Preferred Location' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          preferred_bank_id: BankId,
        };
        this.http
          .post(`${this.baseUrl}/delete_preferred_bank`, requestPayload)
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
