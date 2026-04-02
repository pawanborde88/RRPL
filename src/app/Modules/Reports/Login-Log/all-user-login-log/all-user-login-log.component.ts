import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, Input, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { UnifiedDocumentDialogComponent } from '../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AuthService } from '../../../../Service/auth.service';
import { CommonService } from '../../../../Service/common/common.service';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { UserStateService } from '../../../Setup Files/USERS/services/user.state.service';

@Component({
  selector: 'app-all-user-login-log',
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
  ],
  templateUrl: './all-user-login-log.component.html',
  styleUrl: './all-user-login-log.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe],
})
export class AllUserLoginLogComponent {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly userId = this.authService.userId();
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;
  private readonly datePipe = inject(DatePipe);
  private readonly stateService = inject(UserStateService);
  readonly roles = this.stateService.roles;

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly allWingslist = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);
  readonly FloorUnitDropdown = signal<any[]>([]);

  // Form signal for reactive payload
  private readonly formValues = signal<any>({});

  @Input() agreementStatus: number = 1;
  @Input() active: boolean = false;

  readonly bookingForm = new FormGroup({
    role_id: new FormControl(null, Validators.required),
    from_date: new FormControl<Date | null>(null),
    to_date: new FormControl<Date | null>(null),

  });

  readonly loginLogDisplayedColumns = [

    { key: 'name', label: 'User Name' },
    { key: 'login_time', label: 'Login Date & Time', type: 'date' },
    { key: 'role_names', label: 'Role' },

    { key: 'ip_address', label: 'IP Address' },
    { key: 'user_email', label: 'Email ID', type: 'sensitive' },
    {
      key: 'google_map_url', label: 'Location', clickable: true,
      onClick: (row: any) => this.routetoLocation(row),
    },
  ];


  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const today = this.datePipe.transform(new Date(), 'yyyy-MM-dd');

    return {
      filters: {
        role_id: values.role_id,
        from_date: this.datePipe.transform(values.from_date, 'yyyy-MM-dd') || today,
        to_date: this.datePipe.transform(values.to_date, 'yyyy-MM-dd') || today,
      },
      from_date: this.datePipe.transform(values.from_date, 'yyyy-MM-dd') || today,
      to_date: this.datePipe.transform(values.to_date, 'yyyy-MM-dd') || today,
    };
  });

  readonly bookingActions = [
    {
      action: 'OpenViewLadgerReport', // Must match what you check in onBookingAction
      icon: 'visibility', // Material icon name
      tooltip: 'View Ledger Report', // Tooltip text
      color: 'primary', // Optional button color

    },

  ];




  ngOnInit(): void {
    this.loadRoles()

    const date = new Date();
    this.bookingForm.patchValue({
      from_date: date,
      to_date: date
    });

    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValues());
  }
  routetoLocation(row: any): void {
    const url = row?.google_map_url;

    if (!url) {
      this.showError('Location not available');
      return;
    }

    // Ensure it opens in a new tab safely
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  fetchAllBookings(): void {
    this.updateFormValues();
    this.agGridTable?.refreshData();
  }

  private updateFormValues(): void {
    this.formValues.set(this.bookingForm.value);
  }

  private loadRoles(): void {
    this.stateService.loadRoles().catch((error) => {
      this.showError('Unable to fetch roles');
      console.error('Error loading roles:', error);
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



}
