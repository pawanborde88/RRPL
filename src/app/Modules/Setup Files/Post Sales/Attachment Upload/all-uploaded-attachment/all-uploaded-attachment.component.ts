import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal, ViewChild, computed } from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { AddUploaedAttachmentComponent } from '../add-uploaed-attachment/add-uploaed-attachment.component';
import { ReceiptPreviewDialogComponent } from '../../Recovery/receipt-preview-dialog/receipt-preview-dialog.component';

interface Project {
  project_id: number;
  property_name: string;
}

interface Wing {
  wing_id: number;
  wing_name: string;
}

@Component({
  selector: 'app-all-uploaded-attachment',
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
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-uploaded-attachment.component.html',
  styleUrl: './all-uploaded-attachment.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllUploadedAttachmentComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly roleId = signal(Number(sessionStorage.getItem('role_id')));
  readonly userId = signal(Number(sessionStorage.getItem('session_id')));

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<Project[]>([]);
  readonly allWingsList = signal<Wing[]>([]);
  readonly selectedAttachment = signal<any[]>([]);

  readonly addAttachmentFilterForm = new FormGroup({
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

  readonly columnDefinitions: readonly TableColumn[] = [
    { key: 'actions', label: 'Actions', type: 'actions', sticky: true, disabled: false },
    { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing Name' },
    { key: 'unit_no', label: 'Unit No' },
    { key: 'applicant_name', label: 'Client Name' },
    { key: 'applicant_mobile', label: 'Customer Mobile', type: 'sensitive' },
    { key: 'applicant_email', label: 'Customer Email', type: 'sensitive' },

    { key: 'document_name', label: 'Document Name' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'updated_by', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
  ];

  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const formValues = this.formValues();
    const filters: any = {};
    if (formValues.project_id) filters.project_id = formValues.project_id;
    if (formValues.wing_id) filters.wing_id = formValues.wing_id;

    return {
      user_id: this.userId(),
      filters: filters
    };
  });

  readonly attachmentActions: readonly any[] = [
    { action: 'editUploadedAttachment', icon: 'edit_note', tooltip: 'Edit File', color: 'primary' },
    {
      action: 'attachmentReceipt',
      icon: 'attach_file',
      tooltip: 'View Attachment',
      color: 'primary',
      disabled: false,

    },
  ] as const;

  readonly headerButtons = [
    {
      label: 'Add Attachment',
      icon: 'add_circle',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddAttachmentDialog(null),
    },
  ];

  ngOnInit(): void {
    this.fetchAllProjects();
    this.setupFormSubscriptions();

    // Watch for form changes to update formValues signal
    this.addAttachmentFilterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.updateFormValues();
      });
  }

  private setupFormSubscriptions(): void {
    this.addAttachmentFilterForm.get('project_id')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((projectId) => {
        this.addAttachmentFilterForm.get('wing_id')?.reset();
        this.allWingsList.set([]);
        if (projectId) this.fetchAllWings(projectId);
      });
  }

  private updateFormValues(): void {
    const formValue = this.addAttachmentFilterForm.value;
    this.formValues.set({
      project_id: formValue.project_id || null,
      wing_id: formValue.wing_id || null,
    });
  }

  applyFilters(): void {
    if (this.addAttachmentFilterForm.valid) {
      this.updateFormValues();
      this.agGridComponent?.refreshData();
    } else {
      this.showSnackBar('Please select both Project and Wing.');
    }
  }

  private fetchAllProjects(): void {
    this.loading.set(true);
    this.http.post<Project[]>(`${this.baseUrl}/user_project_dropdown`, { user_id: this.userId() })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (projects) => this.projectsList.set(projects || []),
        error: () => this.showSnackBar('Unable to fetch projects.'),
      });
  }

  private fetchAllWings(projectId: number): void {
    this.loading.set(true);
    this.http.post<Wing[]>(`${this.baseUrl}/wing_dropdown`, { project_id: projectId })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (wings) => this.allWingsList.set(wings || []),
        error: () => this.showSnackBar('No wings available for selected project.'),
      });
  }

  openAddAttachmentDialog(row: any): void {
    const dialogRef = this.dialog.open(AddUploaedAttachmentComponent, {
      width: '50vw',
      data: { row },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.refreshAgGridData();
      }
    });
  }

  onAttachmentAction(action: string, row: any): void {
    if (action === 'editUploadedAttachment') {
      this.openAddAttachmentDialog(row);
    } else if (action === 'attachmentReceipt') {
      this.openReceiptDialog(row);
    }
  }
  openReceiptDialog(receiptData: any): void {
    if (!receiptData?.attachment) {
      this.snackBar.open('Receipt attachment not found', 'Close', {
        duration: 3000,
      });
      return;
    }

    const fileUrl = `${this.storageUrl}/${receiptData.attachment}`;

    this.dialog.open(ReceiptPreviewDialogComponent, {
      width: '80%',
      maxWidth: '900px',
      data: {
        title: 'Receipt Details',
        fileUrl: fileUrl,
      },
    });
  }


  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
