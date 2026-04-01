import { Component, ViewChild, signal, computed, inject, DestroyRef, OnInit } from '@angular/core';
import { EditLetterConfigComponent } from '../edit-letter-config/edit-letter-config.component';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
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
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

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
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-letter-config-list.component.html',
  styleUrl: './all-letter-config-list.component.scss'
})
export class AllLetterConfigListComponent implements OnInit {
  loadingState: boolean = true;
  baseUrl = environment.API_URL;
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<any[]>([]);
  selectedProjectId: any | null = null;
  userId = Number(sessionStorage.getItem('session_id'));
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  searchQuery: string = '';
  roleId: number = Number(sessionStorage.getItem('role_id'));
  dataSource = new MatTableDataSource<any>([]);

  private readonly destroyRef = inject(DestroyRef);
  readonly allWingsList = signal<any[]>([]);

  readonly addUnitBankerForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null),
  });

  // Signal to track form values for reactive computed signals
  private readonly formValues = signal<{
    project_id: number | null;
    wing_id: number | null;
  }>({
    project_id: null,
    wing_id: null,
  });

  readonly agGridPayload = computed(() => {
    const formValues = this.formValues();
    const filters: any = {};
    if (formValues.project_id) filters.project_id = formValues.project_id;
    if (formValues.wing_id) filters.wing_id = formValues.wing_id;

    return {
      filters: filters
    };
  });
  // Data properties
  columnData: any[] = [];
  rowData: any[] = [];
  filteredRowData: any[] = [];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  displayedColumns = [
    { key: 'actions', label: 'Action', type: 'actions', sticky: true, disabled: false },

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
  ) { }

  ngOnInit(): void {
    this.fetchAllProjects();
    this.setupFormSubscriptions();

    // Watch for form changes to update formValues signal
    this.addUnitBankerForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateFormValues();
      });
  }

  private setupFormSubscriptions(): void {
    this.addUnitBankerForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        this.addUnitBankerForm.get('wing_id')?.reset();
        this.allWingsList.set([]);
        if (projectId) this.fetchAllWings(projectId);
      });
  }

  private updateFormValues(): void {
    const formValue = this.addUnitBankerForm.value;
    this.formValues.set({
      project_id: (formValue.project_id as number) || null,
      wing_id: (formValue.wing_id as number) || null,
    });
  }

  fetchAllWings(projectId: number): void {
    this.loading.set(true);
    this.http.post<any[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectId })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (wings) => this.allWingsList.set(wings || []),
        error: () => this.snackBar.open('No wings available for selected project.', 'Close', { duration: 3000 }),
      });
  }

  fetchLetterConfig(): void {
    if (this.addUnitBankerForm.valid) {
      this.updateFormValues();
      this.agGridTable?.refreshData();
    } else {
      this.snackBar.open('Please select both Project and Wing.', 'Close', { duration: 3000 });
    }
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

  onProjectChange(projectId: number): void {
    if (projectId !== null && projectId !== undefined) {
      this.selectedProjectId = projectId;
      this.formValues.set({ ...this.formValues(), project_id: projectId });
      if (this.agGridTable) {
        this.agGridTable.refreshData();
      }
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
    this.loading.set(true);
    const payload = {
      user_id: this.userId,
    };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload).subscribe({
      next: (res: any) => {
        if (res) {
          this.projectsList.set(res);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error(err);
        this.loading.set(false);
        this.snackBar.open('Unable to fetch Enquiry.', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  addNewBak(action: string, row?: any): void {
    const dialogRef = this.dialog.open(EditLetterConfigComponent, {
      minWidth: '50vw',
      maxWidth: '50vw',
      maxHeight: '100vh',
      data: {
        rowData: row, // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridTable?.refreshData();
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
              this.agGridTable?.refreshData();
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
