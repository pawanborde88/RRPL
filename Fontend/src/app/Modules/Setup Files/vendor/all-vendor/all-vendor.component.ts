import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { HttpClient } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AddVendorComponent } from '../add-vendor/add-vendor.component';
import { environment } from '../../../../../environments/environment';
import { MatTableDataSource } from '@angular/material/table';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';


import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-all-vendor',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReusableTableComponent,
    TemplateComponent,
    BreadcrumbComponent,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './all-vendor.component.html',
  styleUrl: './all-vendor.component.scss',
})
export class AllVendorComponent implements OnInit, AfterViewInit {
  baseUrl = environment.API_URL;
  vendorsList: any[] = [];
  dataSource = new MatTableDataSource<any>();


  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService
  ) { }
  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;

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
      type: 'index',
    },
    { key: 'vendor_name', label: 'Vendor Name' },
    { key: 'contact_person_name', label: 'Contact Person' },
    { key: 'active_status', label: 'Active Status' },
    { key: 'contact_no', label: 'Contact Number' },
    { key: 'gst_number', label: 'GST Number' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by_name', label: 'Updated By' },

  ];
  loading: boolean = false; // Initialize loading state

  ngOnInit(): void {
    this.fetchAllVendors();
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  fetchAllVendors(): void {
    this.loading = true;

    this.http.get(`${this.baseUrl}/fetch_vendors`).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res);

        this.dataSource.data = res;
        this.loading = false;

      },
      error: () => {
        this.loading = false;

        this.snackBar.open('Unable to fetch vendors.', 'Close', {
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
        this.openEditVendor(row);

        break;
      case 'deleteProject':
        this.deleteVendor(row.vendor_id);
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
      if (!this.selectedProjects.some((p) => p.vendor_id === row.vendor_id)) {
        this.selectedProjects.push({ ...row }); // Add a copy of the project
      }
    } else {
      this.selectedProjects = this.selectedProjects.filter(
        (p) => p.vendor_id !== row.vendor_id
      );
    }

    console.log('Selected Projects:', this.selectedProjects);
  }
  onAddVendors(): void {
    this.dialog
      .open(AddVendorComponent, {
        autoFocus: false,
        minWidth: '40vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
      })
      .afterClosed()
      .subscribe(() => {
        this.fetchAllVendors(); // Fetch vendors after dialog close
      });
  }

  openEditVendor(item: any): void {
    this.dialog
      .open(AddVendorComponent, {
        autoFocus: false,
        minWidth: '40vw',
        maxWidth: '50vh',
        maxHeight: '100vh',
        data: { item },
      })
      .afterClosed()
      .subscribe(() => {
        this.fetchAllVendors(); // Fetch vendors after edit
      });
  }

  deleteVendor(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Vendor?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          vendor_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_vendor`, requestPayload)
          .subscribe({
            next: () => {
              this.snackBar.open('Vendor deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllVendors(); // Ensure this is called here to update the vendors
            },
            error: (err: any) => {
              console.log(err);
              this.snackBar.open('Unable to Delete Vendor.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
