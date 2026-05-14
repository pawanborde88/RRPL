import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject, signal, DestroyRef, computed } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { AddBrokerageSlabsComponent } from '../add-brokerage-slabs/add-brokerage-slabs.component';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { ReusableTableComponent } from '../../../../Common/Reusable/reusable-table/reusable-table.component';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllBrokerageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly userId = Number(sessionStorage.getItem('session_id')) || null;
  
  // State Signals
  readonly loading = signal(false);
  readonly projectsList = signal<any[]>([]);
  readonly allBrokerageList = signal<any[]>([]);
  readonly selectedProjectID = signal<any>(null);
  
  readonly dataSource = computed(() => new MatTableDataSource<any>(this.allBrokerageList()));

  readonly myForm = this.fb.group({
    project_id: ['']
  });

  readonly displayedColumns = [
    { key: 'actions', label: '', type: 'actions', sticky: true },
    { key: 'sr_no', label: 'Sr. No.', type: 'index' },
    { key: 'project_name', label: 'Project' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'brokerage_slab_from', label: 'Slab From' },
    { key: 'brokerage_slab_to', label: 'Slab To' },
    { key: 'valid_from', label: 'Valid From', type: 'date' },
    { key: 'valid_till', label: 'Valid Till', type: 'date' },
    { key: 'brokerage_unit', label: 'Unit' },
    { key: 'value', label: 'Value' },
    { key: 'brokerage_value_unit', label: 'Value Unit' },
  ];

  readonly projectActions = [
    { icon: 'edit_note', tooltip: 'Edit Brokerage', action: 'editProject', color: 'primary' },
    { icon: 'delete', tooltip: 'Delete Brokerage', action: 'deleteProject', color: 'warn' },
  ];

  readonly headerButtons = computed(() => [
    {
      label: 'Add Brokerage',
      icon: 'add_circle',
      color: 'primary',
      action: () => this.openBrokerage('add'),
      show: () => true,
      disabled: () => !this.selectedProjectID(),
    },
  ]);

  get projectID() {
    return this.myForm.get('project_id')?.value;
  }

  ngOnInit(): void {
    this.fetchAllProjects();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.myForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedProjectID.set(value);
        if (value) this.fetchBrokerageSlabs();
      });
  }

  fetchBrokerageSlabs(): void {
    if (!this.projectID) return;
    
    this.loading.set(true);
    this.http.post(`${this.baseUrl}/fetch_brokerage_slab`, { project_id: this.projectID })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.allBrokerageList.set(Array.isArray(res) ? res : []),
        error: () => this.snackBar.open('Unable to fetch brokerage slabs.', 'Close', { duration: 3000 }),
        complete: () => this.loading.set(false)
      });
  }

  fetchAllProjects(): void {
    this.loading.set(true);
    this.http.post(`${this.baseUrl}/user_project_dropdown`, { user_id: this.userId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => this.projectsList.set(res || []),
        error: () => this.snackBar.open('Unable to fetch projects.', 'Close', { duration: 3000 }),
        complete: () => this.loading.set(false)
      });
  }

  onProjectAction(action: string, row: any): void {
    if (action === 'deleteProject') {
      this.deleteBrokerageSlab(row.brokerage_slab_id);
    } else if (action === 'editProject') {
      this.openBrokerage('edit', row);
    }
  }

  openBrokerage(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddBrokerageSlabsComponent, {
      minWidth: '50vw',
      maxWidth: '50vw',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Brokerage' : 'Edit Brokerage',
        apiUrl: action === 'add' ? 'add_brokerage_slab' : 'edit_brokerage_slab',
        successMessage: action === 'add' ? 'Brokerage added successfully' : 'Brokerage updated successfully',
        rowData: row,
        projectid: this.projectID,
      }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) this.fetchBrokerageSlabs();
      });
  }

  deleteBrokerageSlab(brokerageSlabID: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this Brokerage Slab?' }
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.http.post(`${this.baseUrl}/delete_brokerage_slab`, { brokerage_slab_id: brokerageSlabID })
            .subscribe({
              next: () => {
                this.snackBar.open('Brokerage Slab deleted successfully', 'Close', { duration: 3000 });
                this.fetchBrokerageSlabs();
              },
              error: () => this.snackBar.open('Unable to delete slab.', 'Close', { duration: 3000 })
            });
        }
      });
  }
}
