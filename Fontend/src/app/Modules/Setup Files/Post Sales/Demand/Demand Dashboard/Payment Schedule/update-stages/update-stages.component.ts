import { Component, ViewChild, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { CommonModule, DatePipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Components
import { EditPaymentstageDialogComponent } from '../edit-paymentstage-dialog/edit-paymentstage-dialog.component';

import { ConfirmDialogComponent } from '../../../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { SuccessDialogComponent } from '../../../../../../../Common/success-dialog/success-dialog.component';
import { ActionColumnComponent } from '../../../../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../../../Common/template/template.component';

// Modules and Services
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../../../angular-material.module';
import { environment } from '../../../../../../../../environments/environment';

// Pipes
import { IndianCurrencyPipe } from '../../../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { TruncatePipe } from '../../../../../../../Pipes/truncate.pipe';

// Constants
const DEFAULT_STAGE_COUNT = 10;
const DEFAULT_STAGE_PERCENTAGE = 0;
const MAX_PERCENTAGE = 100;
const SUCCESS_DURATION = 3000;
const ERROR_DURATION = 3000;

// Interfaces
interface PaymentStage {
  payment_stage_id: number;
  project_id: number;
  wing_id: number;
  payment_stage: string;
  percentage: number;
  stage_date: Date | string;
  status: number;
  status_string?: string;
  actual_date: Date | string | null;
  architecture_letter: string;
  site_work_progress: string;
}

interface ColumnDefinition {
  key: string;
  label: string;
  type?: string;
  sticky?: boolean;
  disabled?: boolean;
  editable?: boolean;
  editType?: string;
  isAmount?: boolean;
  applyChequeStatusColor?: boolean;
  colorCondition?: (element: any) => string;
}

interface ActionButton {
  action: string;
  icon: string;
  tooltip: string;
  color?: string;
  disabled?: boolean;
}

interface EditEvent {
  action: string;
  row: PaymentStage;
  field?: string;
  value?: any;
}

interface DefaultStage {
  payment_stage: string;
  percentage: number;
  stage_date: Date;
}

@Component({
  selector: 'app-update-stages',
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
    IndianCurrencyPipe,
    ActionColumnComponent,
    ReusableTableComponent
  ],
  templateUrl: './update-stages.component.html',
  styleUrls: ['./update-stages.component.scss'],
  providers: [DatePipe]
})
export class UpdateStagesComponent implements OnInit, OnDestroy {
  // Private properties
  private readonly destroy$ = new Subject<void>();
  private readonly datePipe = new DatePipe('en-US');

  // Public properties
  readonly baseUrl = environment.API_URL;

  // State variables
  loading = false;
  activeTabIndex = 0;
  totalPercentage = 0;
  isTotalPercentageFull = false;
  selectedBooking: PaymentStage | null = null;
  selectedProjectId: number | null = null;
  selectedStages: any[] = [];

  // Data lists
  allWingslist: any[] = [];
  allUnitNoList: any[] = [];
  projectsList: any[] = [];
  registrationOfficeList: any[] = [];
  agreementCopyStatusList: any[] = [];
  confiList: any[] = [];

  // Table configuration
  dataSource = new MatTableDataSource<PaymentStage>([]);

  readonly bookingDisplayedColumns: ColumnDefinition[] = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'sr_no',
      label: 'Sr.no',
      type: 'index',
    },
    {
      key: 'payment_stage',
      label: 'Particulars',
      editable: true,
      editType: 'text'
    },
    {
      key: 'percentage',
      label: 'Percentage (%)',
      editable: true,
      editType: 'text',
      isAmount: true
    },
    {
      key: 'stage_date',
      label: ' Date',
      type: 'short_date'
    },
    {
      key: 'status_string',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) => element.status === 1 ? 'green' : 'red',
    },
  ];

  readonly bookingActions: ActionButton[] = [
    {
      action: 'editPaymentStage',
      icon: 'edit_note',
      tooltip: 'Edit Stage',
      color: 'primary',
      disabled: false,
    },
    {
      action: 'deleteBooking',
      icon: 'delete',
      tooltip: 'Delete Stage',
      color: 'warn',
      disabled: false,
    },
  ];

  // Forms
  addpaymentStages = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
    clone_wing_id: new FormControl<number[] | null>(null),
  });

  addUpdateAgreementDetailsForm = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
    payment_stage: new FormControl<string>('', Validators.required),
    percentage: new FormControl<number>(0),
    stage_date: new FormControl<Date | null>(null, Validators.required),
    status: new FormControl<number>(0, Validators.required),
    actual_date: new FormControl<Date | null>(null, Validators.required),
    architecture_letter: new FormControl<File | string>('', Validators.required),
    site_work_progress: new FormControl<File | string>('', Validators.required),
    created_by: new FormControl<number>(this.userId),
  });

  // View children
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;


  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<UpdateStagesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  // Getters
  get roleId(): number {
    return Number(sessionStorage.getItem('role_id'));
  }

  get userId(): number {
    return Number(sessionStorage.getItem('session_id'));
  }

  ngOnInit(): void {
    this.initializeComponent();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialization methods
  private initializeComponent(): void {
    this.fetchAllProjects();
    this.setupFormSubscriptions();
  }

  private setupFormSubscriptions(): void {
    this.addpaymentStages.get('project_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((projectId) => {
        if (projectId) {
          this.selectedProjectId = projectId;
          this.fetchAllWings(projectId);
        }
      });

    this.addpaymentStages.get('wing_id')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((wingId) => {
        const projectId = this.addpaymentStages.get('project_id')?.value;
        if (wingId && projectId) {
          this.fetchPaymentStages(projectId, wingId);
        }
      });
  }

  // Data fetching methods
  fetchAllProjects(): void {
    this.setLoading(true);
    const payload = { user_id: this.userId };

    this.http.post(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.projectsList = res || [];
          this.setLoading(false);
        },
        error: (err: any) => {
          console.error('Error fetching projects:', err);
          this.showSnackBar('Unable to fetch projects.', 'error');
          this.setLoading(false);
        }
      });
  }

  fetchAllWings(projectId: number): void {
    this.setLoading(true);

    this.http.post(`${this.baseUrl}/wing_dropdown`, { project_id: projectId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.allWingslist = res || [];
          this.setLoading(false);
        },
        error: (err: any) => {
          console.error('Error fetching wings:', err);
          this.showSnackBar('No wings available for selection', 'error');
          this.setLoading(false);
        }
      });
  }

  fetchPaymentStages(projectId: any, wingId: any): void {
    if (!this.isValidProjectAndWing(projectId, wingId)) {
      this.clearTableData();
      return;
    }

    this.setLoading(true);

    this.http.post(`${this.baseUrl}/fetch_payment_stage`, { project_id: projectId, wing_id: wingId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          if (res) {
            this.processPaymentStagesResponse(res.data);
          }
          this.setLoading(false);
        },
        error: (err: any) => {
          console.error('Error fetching payment stages:', err);
          this.showSnackBar('Error fetching payment stages', 'error');
          this.setLoading(false);
        }
      });
  }

  // Private helper methods
  private isValidProjectAndWing(projectId: any, wingId: any): boolean {
    return !!(projectId && wingId);
  }

  private setLoading(loading: boolean): void {
    this.loading = loading;
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    const duration = type === 'success' ? SUCCESS_DURATION : ERROR_DURATION;
    this.snackBar.open(message, 'Close', { duration });
  }

  private processPaymentStagesResponse(data: PaymentStage[]): void {
    this.dataSource = new MatTableDataSource(data || []);
    this.calculateTotalPercentage(data);
  }

  private calculateTotalPercentage(stages: PaymentStage[]): void {
    this.totalPercentage = stages?.reduce((sum, stage) => sum + (Number(stage.percentage) || 0), 0) || 0;
    this.isTotalPercentageFull = this.totalPercentage >= MAX_PERCENTAGE;
  }

  private clearTableData(): void {
    this.dataSource = new MatTableDataSource<PaymentStage>([]);
    this.totalPercentage = 0;
    this.isTotalPercentageFull = false;
  }

  // File handling
  onFileChange(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.addUpdateAgreementDetailsForm.get(field)?.setValue(input.files[0]);
    }
  }

  // Action handlers
  onBookingAction(action: string, row: PaymentStage): void {
    const actionHandlers: { [key: string]: () => void } = {
      'deleteBooking': () => this.deleteBookings(row.payment_stage_id),
      'editPaymentStage': () => this.editPaymentStage(row),
    };

    const handler = actionHandlers[action];
    if (handler) {
      handler();
    } else {
      console.warn(`Unknown action: ${action}`);
    }
  }

  onBookingSelectionChange(checked: boolean, booking: PaymentStage): void {
    if (checked) {
      this.selectedStages.push(booking);
    } else {
      this.selectedStages = this.selectedStages.filter(
        item => item.payment_stage_id !== booking.payment_stage_id
      );
    }
  }

  // CRUD operations
  editPaymentStage(row: PaymentStage): void {
    const dialogRef = this.dialog.open(EditPaymentstageDialogComponent, {
      width: '600px',
      data: {
        paymentStage: row,
        projectId: this.addpaymentStages.get('project_id')?.value,
        wingId: this.addpaymentStages.get('wing_id')?.value,
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.refreshPaymentStages();
        }
      });
  }

  deleteBookings(id: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Stage?' },
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performDelete(id);
        }
      });
  }

  private performDelete(id: number): void {
    this.setLoading(true);

    this.http.post(`${this.baseUrl}/delete_payment_stage`, { payment_stage_id: id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSnackBar('Stage deleted successfully', 'success');
          this.refreshPaymentStages();
        },
        error: (err) => {
          console.error('Error deleting stage:', err);
          this.showSnackBar('Unable to delete stage', 'error');
          this.setLoading(false);
        }
      });
  }

  onEditEvent(event: EditEvent): void {
    if (!this.isValidEditEvent(event)) {
      return;
    }

    this.performEdit(event);
  }

  private isValidEditEvent(event: EditEvent): boolean {
    return event.action === 'save' && !!event.row && !!event.field && event.value !== undefined;
  }

  private performEdit(event: EditEvent): void {
    const formData = this.createEditFormData(event);
    this.setLoading(true);

    this.http.post(`${this.baseUrl}/edit_payment_stage`, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.showEditResult(res, true);
          this.fetchPaymentStages(event.row.project_id, event.row.wing_id);
        },
        error: (err) => {
          this.showEditResult({ status: false, message: err.error?.message || 'An error occurred while updating payment stage' }, false);
          this.fetchPaymentStages(event.row.project_id, event.row.wing_id);
        },
        complete: () => {
          this.setLoading(false);
        }
      });
  }

  private createEditFormData(event: EditEvent): FormData {
    const formData = new FormData();
    formData.append('payment_stage_id', event.row.payment_stage_id.toString());
    formData.append('project_id', event.row.project_id.toString());
    formData.append('wing_id', event.row.wing_id.toString());
    formData.append('status', event.row.status.toString());
    formData.append('stage_date', this.datePipe.transform(event.row.stage_date, 'yyyy-MM-dd') || '');

    if (event.field === 'payment_stage') {
      formData.append('payment_stage', event.value);
    } else if (event.field === 'percentage') {
      formData.append('percentage', event.value.toString());
      formData.append('payment_stage', event.row.payment_stage);
    }

    return formData;
  }

  private showEditResult(result: any, isSuccess: boolean): void {
    this.dialog.open(SuccessDialogComponent, {
      data: { status: result.status, message: result.message }
    });
  }

  // Main Add method
  onAdd(): void {
    const { projectId, wingId } = this.getProjectAndWingIds();

    if (this.dataSource.data.length === 0) {
      this.insertDefaultStages(projectId, wingId);
      return;
    }

    this.addSingleStage(projectId, wingId);
  }

  // Clone Stages method
  onCloneStages(): void {
    const selectedWingIds = this.addpaymentStages.get('clone_wing_id')?.value;
    const projectId = this.addpaymentStages.get('project_id')?.value;

    if (!selectedWingIds || selectedWingIds.length === 0 || !projectId || this.selectedStages.length === 0) {
      this.showSnackBar('Please select wings and ensure stages are selected', 'error');
      return;
    }

    const payload = {
      payment_stage_id: this.selectedStages.map(stage => stage.payment_stage_id),
      wing_id: selectedWingIds,
      project_id: projectId
    };

    this.setLoading(true);

    this.http.post(`${this.baseUrl}/clone_stages`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.showSnackBar('Stages cloned successfully', 'success');
          // Clear selections and refresh data
          this.selectedStages = [];
          this.addpaymentStages.get('clone_wing_id')?.setValue(null);
          this.refreshPaymentStages();
        },
        error: (err: any) => {
          console.error('Error cloning stages:', err);
          this.showSnackBar('Failed to clone stages', 'error');
          this.setLoading(false);
        },
        complete: () => {
          this.setLoading(false);
        }
      });
  }

  private getProjectAndWingIds(): { projectId: number | null; wingId: number | null } {
    return {
      projectId: this.addpaymentStages.get('project_id')?.value || null,
      wingId: this.addpaymentStages.get('wing_id')?.value || null
    };
  }

  private addSingleStage(projectId: number | null, wingId: number | null): void {
    const remainingPercentage = MAX_PERCENTAGE - this.totalPercentage;
    const defaultPercentage = Math.max(0, remainingPercentage);

    this.prepareFormForSingleStage(projectId, wingId, defaultPercentage);
    this.submitSingleStage(projectId, wingId);
  }

  private prepareFormForSingleStage(projectId: number | null, wingId: number | null, percentage: number): void {
    this.addUpdateAgreementDetailsForm.patchValue({
      project_id: projectId,
      wing_id: wingId,
      status: 0,
      stage_date: this.addUpdateAgreementDetailsForm.get('stage_date')?.value || new Date(),
      payment_stage: this.addUpdateAgreementDetailsForm.get('payment_stage')?.value || 'Particulars',
      percentage: percentage,
    });
  }

  private submitSingleStage(projectId: number | null, wingId: number | null): void {
    const formData = this.createFormData();
    this.setLoading(true);

    this.http.post(`${this.baseUrl}/add_payment_stage`, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.addUpdateAgreementDetailsForm.reset();
          this.dialog.open(SuccessDialogComponent, { data: { message: res.message } });
          this.fetchPaymentStages(projectId, wingId);
        },
        error: (err) => {
          console.error('Error adding payment stage:', err);
          this.showSnackBar('Failed to create agreement', 'error');
          this.setLoading(false);
        }
      });
  }

  // Default stages insertion
  private insertDefaultStages(projectId: number | null, wingId: number | null): void {
    if (!this.isValidProjectAndWing(projectId, wingId)) {
      this.showSnackBar('Please select project and wing first', 'error');
      return;
    }

    this.setLoading(true);
    const defaultStages = this.createDefaultStages();
    this.submitDefaultStages(defaultStages, projectId, wingId);
  }

  private createDefaultStages(): DefaultStage[] {
    return Array.from({ length: DEFAULT_STAGE_COUNT }, () => ({
      payment_stage: 'Particulars',
      percentage: DEFAULT_STAGE_PERCENTAGE,
      stage_date: new Date()
    }));
  }

  private submitDefaultStages(stages: DefaultStage[], projectId: number | null, wingId: number | null): void {
    let completedRequests = 0;
    const totalRequests = stages.length;

    const handleCompletion = () => {
      completedRequests++;
      if (completedRequests === totalRequests) {
        this.setLoading(false);
        this.showSnackBar('10 default stages added successfully', 'success');
        this.fetchPaymentStages(projectId, wingId);
      }
    };

    const handleError = (stage: DefaultStage, err: any) => {
      console.error(`Error adding default stage ${stage.payment_stage}:`, err);
      completedRequests++;
      if (completedRequests === totalRequests) {
        this.setLoading(false);
        this.showSnackBar('Some stages may not have been added successfully', 'error');
        this.fetchPaymentStages(projectId, wingId);
      }
    };

    stages.forEach((stage) => {
      const formData = this.createDefaultStageFormData(stage, projectId, wingId);

      this.http.post(`${this.baseUrl}/add_payment_stage`, formData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => handleCompletion(),
          error: (err) => handleError(stage, err)
        });
    });
  }

  private createDefaultStageFormData(stage: DefaultStage, projectId: number | null, wingId: number | null): FormData {
    const formData = new FormData();
    formData.append('project_id', projectId?.toString() || '');
    formData.append('wing_id', wingId?.toString() || '');
    formData.append('payment_stage', stage.payment_stage);
    formData.append('percentage', stage.percentage.toString());
    formData.append('stage_date', this.datePipe.transform(stage.stage_date, 'yyyy-MM-dd') || '');
    formData.append('status', '0');
    formData.append('created_by', this.userId.toString());
    return formData;
  }

  // Utility methods
  private refreshPaymentStages(): void {
    const projectId = this.addpaymentStages.get('project_id')?.value;
    const wingId = this.addpaymentStages.get('wing_id')?.value;
    this.fetchPaymentStages(projectId, wingId);
  }

  private createFormData(): FormData {
    const formValue = this.addUpdateAgreementDetailsForm.value;
    const formData = new FormData();

    const appendField = (key: string, value: any, isDate = false) => {
      const val = isDate && value ? this.datePipe.transform(value, 'yyyy-MM-dd') :
        value !== null && value !== undefined ? value.toString() : '';
      formData.append(key, val);
    };

    // Required fields
    appendField('project_id', formValue.project_id);
    appendField('wing_id', formValue.wing_id);
    appendField('payment_stage', formValue.payment_stage);
    appendField('percentage', formValue.percentage);
    appendField('stage_date', formValue.stage_date, true);
    appendField('status', formValue.status);

    // Optional fields
    if (formValue.actual_date) {
      appendField('actual_date', formValue.actual_date, true);
    }

    // File fields
    if (formValue.architecture_letter instanceof File) {
      formData.append('architecture_letter', formValue.architecture_letter);
    }

    if (formValue.site_work_progress instanceof File) {
      formData.append('site_work_progress', formValue.site_work_progress);
    }

    appendField('created_by', formValue.created_by);

    return formData;
  }
}