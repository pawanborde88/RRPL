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
import { AddTokenComponent } from '../add-token/add-token.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-token-types',
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
    ReusableTableComponent, // Add the pipe here
  ],
  templateUrl: './all-token-types.component.html',
  styleUrl: './all-token-types.component.scss',
})
export class AllTokenTypesComponent {
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
  ngOnInit(): void {
    this.fetchAllTokenTypes();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchAllTokenTypes(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/fetch_token_type`).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res);

        this.dataSource.data = res;
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch Tokens.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  headerButtons = [
    
    {
      label: 'Add Token Configuration',
      icon: 'add_circle',
      color: 'primary',
      action: () => this.openAddTokenType('add', null),
      disabled: () => false,
      show: () => true,
    },
  ];

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
      label: '',
      type: 'index',
    },
    { key: 'token_type', label: 'Token Type' },
    { key: 'project_name', label: 'Project Name' },
    {
      key: 'active_status',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.active_status_id === 1 ? 'green' : 'red',
    },
    { key: 'amount', label: 'Amount' },
    { key: 'token_start_no', label: 'Token Start ' },

    {
      key: 'flat_selection',
      label: 'Flat Selection',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.enforced_flat_selection === 1 ? 'green' : 'red',
    },
    {
      key: 'highest',
      label: 'Is Highest',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.is_highest === 1 ? 'green' : 'red',
    },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },

    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },
  ];
  projectActions = [
    {
      icon: 'edit_note',
      tooltip: 'Edit Token Type',
      action: 'leadAssign',
      color: 'primary',
    },
    {
      icon: 'delete',
      tooltip: 'Delete Token',
      action: 'deleteProject',
      color: 'warn',
      show: () => [1, 2, 4].includes(this.roleId), // Only show for specific roles
    },
    ,
  ];
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.openAddTokenType('edit', row);
        break;
      case 'deleteProject':
        this.deleteTokenType(row.token_type_id);
        break;
      default:
        break;
    }
  }
  openAddTokenType(action: 'add' | 'edit', row?: any): void {
    const dialogRef = this.dialog.open(AddTokenComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Token' : 'Edit Token',
        apiUrl: action === 'add' ? 'add_token_type' : 'edit_token_type',
        successMessage:
          action === 'add'
            ? 'Token Type added successfully'
            : 'Token Type  updated successfully',
        rowData: action === 'edit' ? row : null, // only pass row if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllTokenTypes(); // Refresh the list if data was modified
      }
    });
  }

  selectedTokenTypeID: any[] = [];

  toggleSelection(isChecked: boolean, row: any): void {
    if (!row || !row.project_id) {
      console.error('Invalid row data');
      return;
    }

    if (isChecked) {
      if (
        !this.selectedTokenTypeID.some(
          (p) => p.token_type_id === row.token_type_id
        )
      ) {
        this.selectedTokenTypeID.push({ ...row }); // Add a copy of the project
      }
    } else {
      this.selectedTokenTypeID = this.selectedTokenTypeID.filter(
        (p) => p.token_type_id !== row.token_type_id
      );
    }
  }

  deleteTokenType(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Token Type?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          token_type_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_token_type`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Token Type deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllTokenTypes(); // Ensure this is called here to update the teams
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
