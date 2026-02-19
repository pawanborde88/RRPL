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

import { AngularMaterialModule } from '../../../../../../../../angular-material.module';
import { environment } from '../../../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../../../Common/template/template.component';
import { IndianCurrencyPipe } from '../../../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../../../Pipes/truncate.pipe';
import { ConfirmDialogComponent } from '../../../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { UnifiedDocumentDialogComponent } from '../../../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { AddDemandGenerationComponent } from '../add-demand-generation/add-demand-generation.component';
import { ConfigurableAgGridDataComponent } from '../../../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../../../../../Common/Reusable/reusable-table/reusable-table-refactored.types';

interface Project {
  project_id: number;
  property_name: string;
}

interface Wing {
  wing_id: number;
  wing_name: string;
}
interface DemandInfo {
  demand_id: number;
  demand_number: string;
}
@Component({
  selector: 'app-all-demand-generated-list',
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
    AddDemandGenerationComponent,
    IndianCurrencyPipe,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-demand-generated-list.component.html',
  styleUrl: './all-demand-generated-list.component.scss',
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllDemandGeneratedListComponent implements OnInit {
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly datePipe = inject(DatePipe);
  selectedDemand = signal<any[]>([]);
  readonly baseUrl = environment.API_URL;
  readonly roleId = signal(Number(sessionStorage.getItem('role_id')));
  readonly userId = signal(Number(sessionStorage.getItem('session_id')));

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<Project[]>([]);
  readonly allWingsList = signal<Wing[]>([]);

  readonly addUnitBankerForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
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
    { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing Name' },
    { key: 'floor_unit', label: 'Unit' },
    { key: 'applicant_name', label: 'Applicant Name' },
    { key: 'agreement_status', label: 'Agreement Status' },
    { key: 'agreement_date', label: 'Agreement Date', type: 'mediumDate' },
    { key: 'stage_date', label: 'Stage Date', type: 'mediumDate' },
    { key: 'stage_name', label: 'Stage Name' },
    { key: 'booking_date', label: 'Booking Date', type: 'mediumDate' },
    { key: 'agreement_cost', label: 'Agreement Cost', isAmount: true },
    { key: 'till_date_due_percentage', label: 'Till Date Due %', type: 'number' },
    { key: 'total_installment_due_till', label: 'Total Installment Due Till', isAmount: true },
    { key: 'total_due', label: 'Total Due', isAmount: true },
    { key: 'total_balance', label: 'Total Balance', isAmount: true },
    { key: 'current_due_percentage', label: 'Current Due %', type: 'number' },
    { key: 'current_particular_due', label: 'Current Particular Due', isAmount: true },
    { key: 'current_gst', label: 'Current GST', isAmount: true },
    { key: 'gst', label: 'GST', isAmount: true },
    { key: 'received_gst', label: 'Received GST', isAmount: true },
    { key: 'balance_gst', label: 'Balance GST', isAmount: true },
    { key: 'installment_date', label: 'Installment Date', type: 'mediumDate' },
    { key: 'received_amount', label: 'Received Amount', isAmount: true },
    { key: 'balance_amount', label: 'Balance Amount', isAmount: true },
    { key: 'other_charges', label: 'Other Charges', isAmount: true },
    { key: 'other_charges_gst', label: 'Other Charges GST', isAmount: true },
    { key: 'total_pending_amount_with_gst', label: 'Total Pending (GST)', isAmount: true },
    { key: 'total_received', label: 'Total Received', isAmount: true },
    { key: 'applicable_scheme', label: 'Scheme' },
    { key: 'status', label: 'Status' },
    { key: 'bank_name', label: 'Bank Name' },
    { key: 'applicant_mobile', label: 'Applicant Mobile' },
    { key: 'applicant_email', label: 'Applicant Email' },
    { key: 'created_by_string', label: 'Created By' },
    { key: 'updated_by_string', label: 'Updated By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' }
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

  readonly enquiryActions: readonly any[] = [
    { action: 'demandLetter', tooltip: 'Demand Letter', icon: 'receipt_long', color: 'primary' },
    { action: 'deleteEnquiry', icon: 'delete', tooltip: 'Delete Demand', color: 'warn' },
  ] as const;

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
      project_id: formValue.project_id || null,
      wing_id: formValue.wing_id || null,
    });
  }

  fetchAllProjectDemands(): void {
    if (this.addUnitBankerForm.valid) {
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

  readonly onDemandSelectionChange = (checked: boolean, demand: any): void => {
    this.selectedDemand.set(checked ? [demand] : []);
  };

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

  openAddDemandDialog(): void {
    const dialogRef = this.dialog.open(AddDemandGenerationComponent, {
      width: '60vw',
      data: { row: null },
    });
    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.refreshAgGridData();
      }
    });
  }

  onDemandAction(action: string, row: any): void {
    if (action === 'deleteEnquiry') this.deleteDemand(row.demand_id);
    if (action === 'demandLetter') this.openDemandLetter(row);
  }
  readonly headerButtons = [
    {
      label: 'Add Demand',
      icon: 'receipt_long',
      color: 'primary',
      disabled: () => false,
      action: () => this.openAddDemandDialog(),

    },
    {
      label: 'whatsapp',
      icon: 'business_messages',
      color: 'primary',
      disabled: () => this.selectedDemand().length === 0,
      action: () => this.whatsappDemand(this.selectedDemand().map((demand) => demand.demand_id)),
    },
    {
      label: 'Email',
      icon: 'email',
      color: 'primary',
      disabled: () => this.selectedDemand().length === 0,
      action: () => this.emailDemand(this.selectedDemand()[0]),
    },

  ];
  whatsappDemand(demandIds: number[]): void {

  }
  emailDemand(row: any): void {

  }


  private openDemandLetter(row: any): void {
    this.dialog.open(UnifiedDocumentDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: {
        dialogType: DocumentDialogType.DEMAND_LETTER,
        rowData: row,
      },
    });
  }

  private deleteDemand(demandId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this demand?' },
    });

    dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
      if (result) {
        this.http.post(`${this.baseUrl}/delete_demand`, {
          demand_id: demandId,
          reason: result.reason,
          created_by: this.userId(),
        }).subscribe({
          next: () => {
            this.showSnackBar('Demand deleted successfully');
            this.refreshAgGridData();
          },
          error: () => this.showSnackBar('Unable to delete demand.'),
        });
      }
    });
  }

  refreshAgGridData(): void {
    this.agGridComponent?.refreshData();
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }
}
