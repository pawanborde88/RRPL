import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ActionColumnComponent } from '../../../../../Common/action-column/action-column.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../../Pipes/truncate.pipe';
import { ReciptBankMasterSComponent } from '../../Project Bank Master/Receipt Bank Master List/recipt-bank-master-s/recipt-bank-master-s.component';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { environment } from '../../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { catchError, of } from 'rxjs';
import { CommonService } from '../../../../../Service/common/common.service';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { IndianCurrencyPipe } from '../../../../../Pipes/currency/indianCurrency/pipes/indian-currency.pipe';
import { ReusableTableComponent } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ReceiptPreviewDialogComponent } from '../../Recovery/receipt-preview-dialog/receipt-preview-dialog.component';
import { UnitBankerComponent } from '../unit-banker.component';
interface HeaderButton {
  label: string;
  icon: string;
  color: string;
  disabled: () => boolean;
  action: () => void;
  show: () => boolean;
}

@Component({
  selector: 'app-all-unit-banker-list',
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
    ActionColumnComponent,

    ReciptBankMasterSComponent,
    AutocompleteReusableComponent,
    IndianCurrencyPipe,
    ReusableTableComponent
  ],
  templateUrl: './all-unit-banker-list.component.html',
  styleUrl: './all-unit-banker-list.component.scss',
})
export class AllUnitBankerListComponent implements OnInit {
  loading: boolean = false;
  projectsList: any[] = [];
  allWingslist: any[] = [];
  searchText: string = '';

  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource = new MatTableDataSource<any>([]);

  constructor(
    private fb: FormBuilder,
    private commonService: CommonService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  displayedColumns = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions', // Make sure this is set to 'actions'
      sticky: true, // boolean, not string
      disabled: false, // Should be false to show actions
    }, {
      key: 'sr_no',
      label: 'Sr.no',
      type: 'index',
    }, { key: 'project_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'floor_unit', label: 'Unit No' },
    { key: 'applicant_name', label: 'Client Name' },
    { key: 'applicant_mobile', label: 'Mobile No', type: 'sensitive' },
    { key: 'applicant_email', label: 'Email ID', type: 'sensitive' },

    { key: 'agreement_cost', label: 'Agreement Amt.', isAmount: true },
    {
      key: 'agreement_status',
      label: 'Agreement Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.agreement_status_id === 1 ? 'green' : 'red',
    },

    { key: 'gst_per', label: 'GST %' },
    { key: 'gst', label: 'GST Amt.', isAmount: true },

    { key: 'sanction_amount', label: 'Sanction Amt.', isAmount: true },
    { key: 'funding_amount', label: 'Funding Amt.', isAmount: true },
    { key: 'own_contribution_agr', label: 'Own Contribution (Agr.)', isAmount: true },
    { key: 'own_contribution_pack', label: 'Own Contribution (Packg.)', isAmount: true },

    { key: 'bank_name', label: 'Bank Name' },
    { key: 'loan_status_name', label: 'Loan Status' },

    { key: 'sanction_date', label: 'Sanction Date' },
    { key: 'banker_type_name', label: 'Banker Type' },
    { key: 'banker_name', label: 'Banker Name' },
    { key: 'branch_name', label: 'Branch' },

    { key: 'banker_email', label: 'Banker Email' },
    { key: 'banker_mobile_no', label: 'Banker Mobile ' },


    { key: 'created_at', label: 'Created At', type: 'date' },
  ];

  storageUrl = environment.STORAGE_URL;

  columnKeys: string[] = this.displayedColumns.map((col) => col.key);
  ngOnInit(): void {
    this.fetchAllProjects();

    this.bookingForm.get('project_id')?.valueChanges.subscribe((projectID) => {
      if (projectID) {
        this.fetchWings(projectID); // Corrected this line
      }
    });
  }
  fetchWings(projectID: any): void {
    this.commonService
      .fetchWingDropdown(projectID)
      .subscribe({
        next: (res: any) => {
          this.allWingslist = res;
        },
        error: () => {
          this.snackBar.open('Unable to fetch project wings.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
  applyFilter(searchText: string): void {
    this.searchText = searchText;
    this.fetchAllUnitBankers();
  }
  bookingForm = new FormGroup({
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl(null),
    agreement_status_id: new FormControl(null),
  });

  fetchAllUnitBankers(): void {
    this.loading = true;

    const projectId = this.bookingForm.get('project_id')?.value || null;
    const wingId = this.bookingForm.get('wing_id')?.value || null;

    this.commonService
      .fetchUnitBanker(projectId, wingId)
      .subscribe({
        next: (res: any) => {
          this.dataSource = new MatTableDataSource(res);

          this.dataSource.data = res;
          this.loading = false;
        },
        error: () => {
          this.snackBar.open('Unable to fetch project banks.', 'Close', {
            duration: 3000,
          });
          this.loading = false;
        },
      });
  }
  bookingActions = [
    {
      action: 'editUnitBanker', // Must match what you check in onBookingAction
      icon: 'edit', // Material icon name
      tooltip: 'Edit Unit Banker', // Tooltip text
      color: 'primary', // Optional button color
      disabled: false, // Optional disabled state
    },
    {
      action: 'downloadUnitBankerDoc', // Must match what you check in onBookingAction
      icon: 'arrow_circle_down', // Material icon name
      tooltip: 'Download ', // Tooltip text
      color: 'primary', // Optional button color
      disabled: false, // Optional disabled state
    },
    {
      action: 'deleteBooking',
      icon: 'delete',
      tooltip: 'Delete Unit Banker',
      color: 'warn',
      disabled: false,
    },
  ];
  onProjectAction(action: string, row: any): void {
    switch (action) {
      case 'editUnitBanker':
        this.editUnitBanker(row);
        break;
      case 'deleteBooking':
        this.deleteProject(row.unit_banker_id);
        break;
      case 'downloadUnitBankerDoc':
        this.openReceiptDialog(row);
        break;
      default:
        break;
    }
  }
  openReceiptDialog(receiptData: any): void {
    if (receiptData && receiptData.sanction_letter) {
      const fileUrl = `${this.storageUrl}/${receiptData.sanction_letter}`;

      this.dialog.open(ReceiptPreviewDialogComponent, {
        width: '80%',
        maxWidth: '900px',
        data: {
          title: 'Sanction Letter',
          fileUrl: fileUrl,
        },
      });
    } else {
      this.snackBar.open('Receipt sanction_letter not found', 'Close', {
        duration: 3000,
      });
    }
  }

  deleteProject(unitBankerList: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Project?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const reason = result.reason; // Get the reason from the dialog response

        let requestPayload = {
          unit_banker_id: unitBankerList,
          reason: reason, // Set the reason from the dialog
          created_by: this.userId, // Set created_by value here
        };

        this.commonService
          .deleteUnitBanker(requestPayload)
          .subscribe({
            next: (data: any) => {
              this.snackBar.open('Project deleted successfully', 'Close', {
                duration: 3000,
              });
              this.fetchAllUnitBankers(); // Ensure this is called here to update the teams
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
  fetchAllProjects(): void {
    this.commonService
      .fetchProjectsDropdown()
      .pipe(
        catchError((error) => {
          console.error('Error fetching projectsList:', error);
          return of([]);
        })
      )
      .subscribe((response) => {
        this.projectsList = response as any[];
      });
  }
  getColumnKeys(): string[] {
    return this.displayedColumns.map(col => col.key);
  }
  getTotal(columnKey: string): number {
    if (!this.dataSource?.data) return 0;
    return this.dataSource.data
      .map(t => +t[columnKey] || 0)
      .reduce((acc, value) => acc + value, 0);
  }

  headerButtons: HeaderButton[] = [
    {
      label: 'Add Unit Banker',
      icon: 'drafts',
      color: 'primary',
      disabled: () => false,
      action: () => this.resendEmail(),
      show: () => true
    },

  ];
  resendEmail(): void {
    const dialogRef = this.dialog.open(UnitBankerComponent, {
      minWidth: '70vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchAllUnitBankers();
      }
    });
  }

  editUnitBanker(row: any): void {
    const dialogRef = this.dialog.open(UnitBankerComponent, {
      minWidth: '70vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: { unit_banker_id: row.unit_banker_id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.fetchAllUnitBankers();
      }
    });
  }
}
