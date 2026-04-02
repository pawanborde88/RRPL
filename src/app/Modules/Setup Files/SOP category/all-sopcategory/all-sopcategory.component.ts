import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LoaderComponent } from '../../../../Common/laoder/loader/loader.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../environments/environment';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';

@Component({
  selector: 'app-all-sopcategory',
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
  templateUrl: './all-sopcategory.component.html',
  styleUrl: './all-sopcategory.component.scss',
})
export class AllSOPCategoryComponent implements OnInit, AfterViewInit {
  loading: boolean = false; // Initialize loading state
  baseUrl = environment.API_URL;
  domainUrl = environment.domainUrl;
  // Initialize dataSource as a MatTableDataSource
  dataSource = new MatTableDataSource<any>();

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
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
    { key: 'sop_category', label: 'SOP Category' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];
  newSopCategory: string = ''; // To hold the value for new SOP category
  isAddingSopCategory: boolean = false;
  editingCategoryId: string | null = null;
  searchQuery: string = '';
  filteredData: any[] = [];
  userIdData: number | null =
     this.userId ?? null;
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
    this.fetchAllSOPcategoryList();
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  resetForm() {
    this.newSopCategory = '';
    this.editingCategoryId = null;
  }
  toggleAddSopCategory() {
    this.isAddingSopCategory = !this.isAddingSopCategory;
    if (!this.isAddingSopCategory) {
      this.resetForm();
    }
  }
  applyFilter(): void {
    // Apply filter to the table's data source
    this.dataSource.filter = this.searchQuery.trim().toLowerCase();
  }
  headerButtons = [
  {
    label: 'Add SOP Category',
    icon: 'add_circle',
    color: 'primary',
    disabled: () => false,
    action: () => this.toggleAddSopCategory()
  }
];
  editSopCategory(category: any) {
    console.log('category', category);

    this.newSopCategory = category.sop_category;
    this.editingCategoryId = category.sop_category_id; // Store the ID of the category being edited
    this.isAddingSopCategory = true;
  }
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'leadAssign':
        this.editSopCategory(row);

        break;
      case 'deleteProject':
        this.deleteSop(row.sop_category_id);
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
          (p) => p.sop_category_id === row.sop_category_id
        )
      ) {
        this.selectedProjects.push({ ...row }); // Add a copy of the project
      }
    } else {
      this.selectedProjects = this.selectedProjects.filter(
        (p) => p.sop_category_id !== row.sop_category_id
      );
    }

    console.log('Selected Projects:', this.selectedProjects);
  }
  fetchAllSOPcategoryList(): void {
    this.loading = true;
    this.http.get(`${this.baseUrl}/fetch_sop_category`).subscribe({
      next: (res: any) => {
        this.dataSource = new MatTableDataSource(res);

        this.dataSource.data = res; // Populate data in MatTableDataSource
        this.loading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Unable to fetch SOP details.', 'Close', {
          duration: 3000,
        });
      },
    });
  }
  onSubmit() {
    if (this.newSopCategory.trim()) {
      const requestData = {
        sop_category: this.newSopCategory.trim(),
        updated_by: this.userId,
        created_by: this.userId,
        sop_category_id: this.editingCategoryId || null, // Add sop_category_id only if editing
      };

      // Determine the appropriate URL and method based on whether we're editing or adding
      const url = this.editingCategoryId
        ? `${this.baseUrl}/edit_sop_category`
        : `${this.baseUrl}/add_sop_category`;

      this.http.post(url, requestData).subscribe({
        next: () => {
          const successMessage = this.editingCategoryId
            ? 'SOP category updated successfully'
            : 'SOP category added successfully';
          this.snackBar.open(successMessage, 'Close', { duration: 3000 });
          this.fetchAllSOPcategoryList(); // Refresh the SOP category list
          this.resetForm();
          this.isAddingSopCategory = false; // Reset the form and hide the input field
        },
        error: (err) => {
          console.error('Error processing SOP category:', err);
          this.snackBar.open('Failed to save SOP category', 'Close', {
            duration: 3000,
          });
        },
      });
    } else {
      this.snackBar.open('Please enter a valid SOP category', 'Close', {
        duration: 3000,
      });
    }
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
  deleteSop(sopId: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
       minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this SOP Category?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          sop_category_id: sopId,
        };
        this.http
          .post(`${this.baseUrl}/delete_sop_category`, requestPayload)
          .subscribe({
            next: (data: any) => {
              console.log(data);
              this.snackBar.open('SOP deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllSOPcategoryList(); // Ensure this is called here to update the plans
            },
            error: (err: any) => {
              console.log(err);
              this.snackBar.open('Unable to Delete Records.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }
}
