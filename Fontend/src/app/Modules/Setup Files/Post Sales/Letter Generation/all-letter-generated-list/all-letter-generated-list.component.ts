import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { FetchFunctionsService } from '../../../../../Service/fetch-functions.service';
import { AddLetterGenerationDialogComponent } from '../add-letter-generation-dialog/add-letter-generation-dialog.component';
import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { AuthService } from '../../../../../Service/auth.service';
import { CommonService } from '../../../../../Service/common/common.service';
import { ReceiptsService, type LetterType } from '../../Recovery/Recipts/receipts.service';
import { DocxWorldviewDialog } from '../../../../../Common/Reusable/unified-document-dialog/docx-worldview-dialog/docx-worldview-dialog';

@Component({
  selector: 'app-all-letter-generated-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,

    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,

    ActionColumnComponent,
    DocxWorldviewDialog,
  ], templateUrl: './all-letter-generated-list.component.html',
  styleUrl: './all-letter-generated-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class AllLetterGeneratedListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly receiptsService = inject(ReceiptsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly userId = this.authService.userId();
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;
  private readonly datePipe = inject(DatePipe);

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly allWingslist = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);
  readonly FloorUnitDropdown = signal<any[]>([]);
  readonly letterTypes = signal<LetterType[]>([]);

  // Form signal for reactive payload
  private readonly formValues = signal<any>({});

  @Input() agreementStatus: number = 1;
  @Input() active: boolean = false;

  readonly bookingForm = new FormGroup({
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl(null),
    letter_type_id: new FormControl(null),
  });

  readonly agreementDetailsColumnsNames = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },
    {
      key: 'letter_date',
      label: 'Letter Date',
      type: 'mediumDate',
    },
    {
      key: 'agreement_date',
      label: 'Agreement Date',
      type: 'mediumDate',
    },
    {
      key: 'agreement_no',
      label: 'Agreement No',
    },
    {
      key: 'project_name',
      label: 'Project Name',
    },
    {
      key: 'wing_name',
      label: 'Wing',
    },
    {
      key: 'floor_unit',
      label: 'Unit No',
    },
    {
      key: 'letter_type',
      label: 'Letter Type',
    },

    {
      key: 'applicant_name',
      label: 'Client Name',
    },
    {
      key: 'applicant_mobile',
      label: 'Mobile No',
      type: 'sensitive',
    },
    {
      key: 'applicant_email',
      label: 'Email',
      type: 'sensitive',
    },
    {
      key: 'bank_name',
      label: 'Bank Name',
    },
    {
      key: 'remark',
      label: 'Remark',
    },
    {
      key: 'created_by_name',
      label: 'Created By',
    },
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date',
    },

  ] as const;


  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};

    if (values.project_id) filters.project_id = values.project_id;
    if (values.wing_id) filters.wing_id = values.wing_id;
    if (values.letter_type_id) filters.letter_type_id = values.letter_type_id;

    return { filters };
  });




  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();

    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValues());
  }

  fetchAllBookings(): void {
    this.updateFormValues();
    // Ensure the table refreshes after form values are updated
    if (this.agGridTable) {
      this.agGridTable.refreshData();
    }
  }

  private updateFormValues(): void {
    this.formValues.set(this.bookingForm.value);
  }

  private loadInitialData(): void {
    this.commonService.fetchUserProjectDropdown(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) this.projectsList.set(res);
        },
        error: () => this.showError('Unable to fetch projects.')
      });

    this.receiptsService.fetchLetterTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (letterTypes) => {
          this.letterTypes.set(letterTypes);
        },
        error: () => this.showError('Unable to fetch letter types.')
      });
  }
  headerButtons = [

    {
      label: 'Add Document',
      icon: 'add_circle',
      color: 'primary',
      action: () => this.openAddBookingVisitorDialog(null),
      disabled: () => false,
      show: () => true,
    },
  ];
  openAddBookingVisitorDialog(row: any): void {
    const dialogRef = this.dialog.open(AddLetterGenerationDialogComponent, {
      width: '50vw',
      data: { row },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.agGridTable?.refreshData();
      }
    });
  }

  openLetterConfigDialog(row: any): void {
    if (row.letter_type_id === 5) {
      this.dialog.open(DocxWorldviewDialog, {

        maxWidth: '90vw',
        maxHeight: '80vh',
        panelClass: 'custom-dialog-container',
        data: {
          ...row
        },
      });
      return;
    }

    const dialogRef = this.dialog.open(UnifiedDocumentDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: {
        dialogType: DocumentDialogType.LETTER_CONFIG_PREVIEW,
        letter_generation_id: row.letter_generation_id,
        ...row
      },
    });
  }



  private setupFormSubscriptions(): void {
    this.bookingForm.get('project_id')?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(id => !!id)
      )
      .subscribe(projectID => {
        this.fetchAllWings(projectID);
      });

    this.bookingForm.get('wing_id')?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(id => !!id)
      )
      .subscribe(wingID => {
        const projectId = this.bookingForm.get('project_id')?.value;

      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }



  openAddEditFloorRiseDialog(row: any): void {
    const dialogRef = this.dialog.open(UnifiedDocumentDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: {
        dialogType: DocumentDialogType.LEDGER_REPORT,
        rowData: {
          booking_id: row.booking_id,
          project_id: row.project_id || this.bookingForm.get('project_id')?.value || null,
        },
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {

      });
  }


  fetchAllWings(projectID: any): void {
    this.commonService.fetchWingDropdown(projectID)
      .subscribe({
        next: (res: any) => {
          this.allWingslist.set(res);
        },
        error: () => {
          this.showError('Unable to fetch wings.');
        },
      });
  }
  selectedBooking: any = null; // Change from selectedBookingId to selectedBooking

  onBookingSelectionChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedBooking = booking;
      console.log('Selected booking:', this.selectedBooking);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedBooking &&
        this.selectedBooking.floor_rise_id === booking.floor_rise_id
      ) {
        this.selectedBooking = null;
      }
    }
  }
  onTokenAction(action: string, row: any): void {
    switch (action) {
      case 'deleteToken':
        this.deleteTokens(row.letter_generation_id);
        break;
      case 'letterConfig':
        this.openLetterConfigDialog(row);
        break;
      case 'addToken':
        this.openAddBookingVisitorDialog(row);
        break;
      case 'viewLedger':
        this.openAddEditFloorRiseDialog(row);
        break;
    }
  }
  deleteTokens(Id: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete letter?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        let requestPayload = {
          letter_generation_id: Id,
        };
        this.http
          .post(`${this.baseUrl}/delete_letter`, requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Letter deleted successfully', 'Close', {
                duration: 3000,
              });
              // Refresh the table after successful delete
              this.fetchAllBookings();
            },
            error: (err: any) => {
              this.snackBar.open('Unable to Delete Letter.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }

  projectActions = [
    {
      action: 'deleteToken',
      icon: 'delete',
      tooltip: 'Delete Document',
      color: 'warn',
    },
    {
      action: 'letterConfig',
      icon: 'description',
      tooltip: 'Letter ',
      color: 'primary',
    },
    // {
    //   action: 'viewLedger',
    //   icon: 'visibility',
    //   tooltip: 'View Ledger Report',
    //   color: 'accent',
    // }
  ];

}

