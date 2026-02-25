import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { SelectOption, AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { environment } from '../../../../../../environments/environment';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { CancelTokenDialogComponent } from '../cancel-token-dialog/cancel-token-dialog.component';
import { RefundTokenPaymentComponent } from '../refund-token-payment/refund-token-payment.component';
import { SuccessDialogComponent } from '../../../../../Common/success-dialog/success-dialog.component';
import { UnifiedDocumentDialogComponent } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.component';
import { DocumentDialogType } from '../../../../../Common/Reusable/unified-document-dialog/unified-document-dialog.interfaces';
import { ConfigurableAgGridDataComponent } from '../../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  retry,
  shareReplay,
  switchMap
} from 'rxjs/operators';

// Constants for better maintainability
const DEFAULT_PAGE_SIZE = 30;
const DEBOUNCE_TIME_MS = 300;
const RETRY_ATTEMPTS = 2;
const CACHE_SIZE = 1;

interface TokenData {
  readonly token_id: number;
  readonly project_id: number;
  readonly [key: string]: unknown;
}

interface PaginationState {
  readonly offset: number;
  readonly limit: number;
  readonly sortBy: string;
  readonly sortOrder: 'asc' | 'desc';
  readonly search: string;
  readonly filters: Record<string, unknown>;
  readonly filteredCount: number;
}

interface TokenType {
  readonly token_type_id: number;
  readonly token_type: string;
  readonly [key: string]: unknown;
}

interface SalesExecutive {
  readonly user_id: number;
  readonly user_name: string;
  readonly [key: string]: unknown;
}

@Component({
  selector: 'app-all-tokens',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ConfigurableAgGridDataComponent,
    AutocompleteReusableComponent,
    TemplateComponent,
    BreadcrumbComponent
  ],
  templateUrl: './all-tokens.component.html',
  styleUrl: './all-tokens.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllTokensComponent implements OnInit, AfterViewInit {
  // Dependency Injection using inject() function
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  public readonly router = inject(Router);

  // Constants
  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly roleId = Number(sessionStorage.getItem('role_id')) || 0;
  readonly userId = Number(sessionStorage.getItem('session_id')) || 0;
  private readonly roleData = sessionStorage.getItem('role_id');

  // ViewChild references
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator | null;
  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent<TokenData>;

  // Reactive state using signals
  readonly loading = signal<boolean>(false);
  readonly dataSource = signal<MatTableDataSource<TokenData>>(new MatTableDataSource<TokenData>([]));
  readonly selectedTokens = signal<TokenData[]>([]);
  readonly isFiltered = signal<boolean>(false);

  // Dropdown data signals
  readonly projectsList = signal<SelectOption[]>([]);
  readonly allTokenType = signal<TokenType[]>([]);
  readonly allSalesExecutive = signal<SalesExecutive[]>([]);

  // Pagination state
  readonly paginationParams = signal<PaginationState>({
    offset: 0,
    limit: DEFAULT_PAGE_SIZE,
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: '',
    filters: {},
    filteredCount: 0,
  });

  // Form controls
  readonly addTokenForm = new FormGroup({
    project_id: new FormControl<number[]>([], [Validators.required]),
    token_type_id: new FormControl<number | null>(null),
    sales_executive_id: new FormControl<number[]>([]),
  });

  // Computed signals for derived state
  readonly canApplyFilter = computed(() => {
    const projectId = this.addTokenForm.get('project_id')?.value;
    return Array.isArray(projectId) && projectId.length > 0 && this.addTokenForm.get('project_id')?.valid;
  });

  // Search state
  readonly globalSearchTerm = signal<string>('');

  // CP Target Logged Data
  cpTargetLoggedData: any;

  // Column definitions - readonly for immutability
  readonly columnDefinitions = [
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      sticky: true,
      disabled: false,
    },

    { key: 'token_id', label: 'EOI ID' },
    { key: 'token_no', label: 'EOI No' },

    { key: 'token_date', label: 'EOI Date', type: 'mediumDate' },
    { key: 'customer_name', label: 'Client Name' },
    { key: 'property_name', label: 'Project Name' },
    { key: 'wing_name', label: 'Wing' },
    { key: 'unit_type', label: 'Unit Type' },
    { key: 'floor_unit', label: 'Unit No' },

    { key: 'preference_name', label: 'Configuration' },
    { key: 'token_type', label: 'EOI Type' },
    { key: 'token_amount', label: 'EOI Amount', isAmount: true },
    { key: 'balance', label: 'Balance', isAmount: true },
    { key: 'amount_paid', label: 'Pay Till Date', isAmount: true },
    { key: 'booked', label: 'Booking Status' },
    {
      key: 'token_status',
      label: 'Status',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.token_status_id === 1 ? 'red' : 'green',
    },
    {
      key: 'is_upgraded',
      label: 'Is Upgrade',
      applyChequeStatusColor: true,
      colorCondition: (element: any) =>
        element.is_upgraded === 'Upgraded' ? 'green' : 'red',

    },
    { key: 'mob_no', label: 'Mobile Number', type: 'sensitive' },
    { key: 'email_id', label: 'Email ID', type: 'sensitive' },
    { key: 'payment_status', label: 'Payment Status' },
    { key: 'sales_executive_name', label: 'Executive' },
    { key: 'source', label: 'Source' },
    { key: 'source_detail', label: 'Source Type' },
    { key: 'channel_partner', label: 'Channel Partner' },
    { key: 'source_description', label: 'Source Description' },
    { key: 'created_by_name', label: 'Created By' },
    { key: 'created_at', label: 'Created At', type: 'date' },
    { key: 'updated_at', label: 'Updated At', type: 'date' },
    { key: 'updated_by_name', label: 'Updated By' },
  ] as const;

  readonly columnKeys = this.columnDefinitions.map((col) => col.key);

  // Action buttons configuration
  readonly tokenActions = [
    {
      action: 'deleteToken',
      icon: 'delete',
      tooltip: 'Delete EOI',
      color: 'warn' as const,
      show: () => this.hasOnlyRoles([1, 2]),
    },
    {
      action: 'cancelToken',
      icon: 'close',
      tooltip: 'Cancel EOI',
      color: 'primary' as const,
      show: () => this.hasOnlyRoles([1, 2]),
    },
    {
      action: 'tokenReceipt',
      icon: 'receipt',
      tooltip: 'EOI Receipt',
      color: 'primary' as const,
    },
    {
      action: 'tokenForm',
      icon: 'article',
      tooltip: 'EOI Form',
      color: 'primary' as const,
    },
    {
      action: 'addBooking',
      icon: 'add_circle',
      tooltip: 'Punch Booking',
      color: 'primary' as const,
      disabled: (row: any) => row.is_booked === 1,
    },
    {
      action: 'viewTokenPayments',
      icon: 'receipt_long',
      tooltip: 'View All EOI Payments',
      color: 'primary' as const,
      disabled: false,
      show: () => true,
    },
    {
      action: 'refundTokenPayment',
      icon: 'recycling',
      tooltip: 'Refund EOI Payment',
      color: 'primary' as const,
      disabled: false,
      show: () => true,
    },
    {
      action: 'upgradeToken',
      icon: 'trending_up',
      tooltip: 'Upgrade EOI',
      color: 'primary' as const,
      disabled: (row: any) => row.is_highest === 1,
    },
    {
      action: 'payManually',
      icon: 'edit_square',
      tooltip: 'Pay Manually',
      color: 'primary' as const,
      show: () => true,
      disabled: (row: any) => row.payment_status_id === 1,
    },
    {
      action: 'tranferToken',
      icon: 'compare_arrows',
      tooltip: 'Transfer Unit',
      color: 'primary' as const,
      show: () => this.hasOnlyRoles([1, 2, 14]),
      disabled: (row: any) => row.is_highest === 0,
    },
  ] as const;

  readonly headerButtons = [
    {
      label: 'Cancelled EOI',
      icon: 'select_all',
      color: 'primary' as const,
      action: () => this.router.navigate(['/setup/tokens-allcancelled-tokens']),
      disabled: () => false,
      show: () => true,
    },
  ] as const;

  constructor() {
    // Setup reactive form listeners
    this.setupFormListeners();
  }

  ngOnInit(): void {
    this.cpTargetLoggedData = history.state.data;
    console.log('CP Target Logged Data:', this.cpTargetLoggedData);

    if (this.cpTargetLoggedData) {
      this.addTokenForm.patchValue({
        project_id: this.cpTargetLoggedData.project_id
          ? [this.cpTargetLoggedData.project_id]
          : [],
      });
    }

    // Fetch initial data
    this.fetchAllProjects();

    // Auto-patch and disable sales_executive_id if user has role 7
    if (this.hasOnlyRoles([7])) {
      const salesExecutiveControl = this.addTokenForm.get('sales_executive_id');
      if (salesExecutiveControl) {
        salesExecutiveControl.patchValue(this.userId ? [this.userId] : []);
        salesExecutiveControl.disable();
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.paginator.pageSize = DEFAULT_PAGE_SIZE;
      this.paginator.pageIndex = 0;
    }
  }

  private setupFormListeners(): void {
    // Project ID listener with debouncing
    this.addTokenForm
      .get('project_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(DEBOUNCE_TIME_MS),
        distinctUntilChanged(),
        filter((projectID): projectID is number[] =>
          Array.isArray(projectID) && projectID.length > 0
        )
      )
      .subscribe((projectID) => {
        this.fetchAllTokenTypes(projectID);
        this.fetchAllSalesExecutive(projectID);
      });
  }

  // Permission and role checking methods
  hasOnlyRoles(allowedRoles: number[]): boolean {
    if (!this.roleData) {
      return false;
    }
    const userRoles = this.roleData
      .split(',')
      .map((role) => Number(role.trim()))
      .filter((role) => !isNaN(role));

    return userRoles.some((role) => allowedRoles.includes(role));
  }

  // UI helper methods
  onSearchTermChange(searchTerm: string): void {
    this.globalSearchTerm.set(searchTerm);
    this.paginationParams.update(params => ({
      ...params,
      offset: 0,
      search: searchTerm
    }));
    this.fetchAllTokens();
  }

  fetchAllTokens(): void {
    const formValues = this.addTokenForm.value;

    // Validate that project_id is selected (required)
    if (!formValues.project_id || !Array.isArray(formValues.project_id) || formValues.project_id.length === 0) {
      this.snackBar.open('Please select at least one project to filter tokens.', 'Close', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
      return;
    }

    // Determine if filters are applied
    this.isFiltered.set(this.hasFiltersApplied(formValues));

    // Reset pagination when applying filters
    this.paginationParams.update(params => ({
      ...params,
      offset: 0
    }));

    // Trigger change detection to ensure apiPayload input is updated with latest form values
    this.cdr.detectChanges();

    // Refresh ag-grid data if component is available
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
    }
  }

  // Helper methods
  private hasFiltersApplied(formValues: unknown): boolean {
    const values = formValues as Record<string, unknown>;
    return !!(
      (values['project_id'] as unknown[] ?? []).length ||
      values['token_type_id'] ||
      (values['sales_executive_id'] as unknown[] ?? []).length
    );
  }

  private getTelecallerIdValue(formValues: unknown): number[] | null {
    const values = formValues as Record<string, unknown>;
    // If user has role 7 or 13 (or both), they can only see their own tokens
    if (this.hasOnlyRoles([7, 13])) {
      return this.userId ? [this.userId] : null;
    }

    // Default case: return sales_executive_id from form if specified
    const salesExecutiveId = values['sales_executive_id'];
    if (Array.isArray(salesExecutiveId) && salesExecutiveId.length > 0) {
      return salesExecutiveId.map((id: unknown) => Number(id));
    }

    return null;
  }

  private buildFiltersObject(formValues: unknown, telecallerIdValue: number[] | null): Record<string, unknown> {
    const values = formValues as Record<string, unknown>;

    // Get form values - ensure selected values are always passed
    const projectId = values['project_id'] as number[] | undefined;
    const tokenTypeId = values['token_type_id'] as number | null | undefined;
    const salesExecutiveId = values['sales_executive_id'];

    // Build filters object with all form values
    const filters: Record<string, unknown> = {
      project_id: Array.isArray(projectId) ? projectId : [],
      token_type_id: tokenTypeId ?? null,
      token_id: this.cpTargetLoggedData
        ? this.cpTargetLoggedData.total_token_id
        : null,
      user_id: this.userId
    };

    // Determine the final sales_executive_id value
    // Use telecallerIdValue if available (handles role-based filtering)
    // Otherwise, check form value directly as fallback
    let finalSalesExecutiveId: number[] | null = null;

    if (telecallerIdValue && Array.isArray(telecallerIdValue) && telecallerIdValue.length > 0) {
      finalSalesExecutiveId = telecallerIdValue;
    } else if (salesExecutiveId) {
      // Handle both array and single value cases
      if (Array.isArray(salesExecutiveId) && salesExecutiveId.length > 0) {
        finalSalesExecutiveId = salesExecutiveId.map((id: unknown) => Number(id));
      } else if (typeof salesExecutiveId === 'number') {
        finalSalesExecutiveId = [salesExecutiveId];
      }
    }

    // Include sales_executive_id if we have a valid value
    if (finalSalesExecutiveId && finalSalesExecutiveId.length > 0) {
      filters['sales_executive_id'] = finalSalesExecutiveId;
    }

    return filters;
  }

  // Fetch methods with caching and error handling
  fetchAllProjects(): void {
    this.loading.set(true);
    const payload = {
      user_id: this.userId,
    };

    this.http
      .post<SelectOption[]>(`${this.baseUrl}/user_project_dropdown`, payload)
      .pipe(
        retry(RETRY_ATTEMPTS),
        shareReplay({ bufferSize: CACHE_SIZE, refCount: true }),
        catchError(() => {
          this.snackBar.open('Unable to fetch projects.', 'Close', {
            duration: 3000,
          });
          return of<SelectOption[]>([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.projectsList.set(res);
            this.cdr.markForCheck();
          }
          this.loading.set(false);
        }
      });
  }

  fetchAllTokenTypes(projectID: number[]): void {
    if (!projectID || projectID.length === 0) {
      this.allTokenType.set([]);
      return;
    }

    this.http
      .post<TokenType[]>(`${this.baseUrl}/token_type_dropdown`, {
        project_id: projectID,
      })
      .pipe(
        retry(RETRY_ATTEMPTS),
        catchError(() => {
          this.snackBar.open('Failed to load token types', 'Close', {
            duration: 3000,
          });
          return of<TokenType[]>([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (tokenTypes) => {
          this.allTokenType.set(tokenTypes);
          this.cdr.markForCheck();
        }
      });
  }

  fetchAllSalesExecutive(projectID: number[]): void {
    if (!projectID || projectID.length === 0) {
      this.allSalesExecutive.set([]);
      return;
    }

    this.http
      .post<SalesExecutive[]>(`${this.baseUrl}/project_sales_executive_dropdown`, {
        project_id: projectID,
      })
      .pipe(
        retry(RETRY_ATTEMPTS),
        catchError(() => {
          this.snackBar.open('Unable to fetch sales executives.', 'Close', {
            duration: 3000,
          });
          return of<SalesExecutive[]>([]);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          this.allSalesExecutive.set(res || []);
          this.cdr.markForCheck();
        }
      });
  }

  // Action handlers
  onTokenAction(action: string, row: any): void {
    switch (action) {
      case 'cancelToken':
        this.cancelledToken(row.token_id);
        break;
      case 'deleteToken':
        this.deleteTokens(row.token_id);
        break;
      case 'addBooking':
        this.router.navigate(['/add-bookings'], {
          state: { data: row, extraText: 'TokenBooking' },
        });
        break;
      case 'tokenForm':
        this.tokenFormDialog(row);
        break;
      case 'tokenReceipt':
        this.tokenReceiptDialog(row);
        break;
      case 'addTokenPayment':
        this.router.navigate(['/setup/add-tokenPayments', row.token_id]);
        break;
      case 'viewTokenPayments':
        this.router.navigate(['/setup/all-tokenPayments', row.token_id]);
        break;
      case 'refundTokenPayment':
        this.openClaimEnquiryDialog(row);
        break;
      case 'upgradeToken':
        this.router.navigate(['/setup/upgrade-token', row.token_id], {
          state: { data: row },
        });
        break;
      case 'tranferToken':
        this.router.navigate(['/setup/transfer-token', row.token_id], {
          state: { data: row },
        });
        break;
      case 'payManually':
        this.router.navigate(
          ['/setup/tokens/pay-token-manually', row.token_id],
          {
            state: { data: row },
          }
        );
        break;
    }
  }

  // Dialog methods
  openClaimEnquiryDialog(row: any): void {
    const dialogRef = this.dialog.open(RefundTokenPaymentComponent, {
      minWidth: '25vw',
      data: row,
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchAllTokens();
        }
      });
  }

  tokenFormDialog(row: any): void {
    const dialogRef = this.dialog.open(UnifiedDocumentDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: {
        dialogType: DocumentDialogType.TOKEN_FORM,
        token_id: row.token_id,
        project_id: row.project_id,
        rowData: row
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchAllTokens();
        }
      });
  }

  tokenReceiptDialog(row: any): void {
    const dialogRef = this.dialog.open(UnifiedDocumentDialogComponent, {
      width: 'auto',
      height: 'auto',
      maxWidth: '90vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-container',
      data: {
        dialogType: DocumentDialogType.TOKEN_RECEIPT,
        token_id: row.token_id,
        project_id: row.project_id,
        rowData: row
      },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchAllTokens();
        }
      });
  }

  cancelledToken(tokenId: any): void {
    const dialogRef = this.dialog.open(CancelTokenDialogComponent, {
      width: 'auto',
      data: {
        token_id: tokenId,
        title: 'Cancel Token',
        message: 'Are you sure you want to cancel this Token?',
      },
    });

    dialogRef.afterClosed()
      .pipe(
        filter((result): result is boolean => result === true),
        switchMap(() => {
          const requestPayload = {
            token_id: tokenId,
            is_token_cancel: 1,
            user_id: this.userId,
          };

          return this.http.post(`${this.baseUrl}/cancel_token`, requestPayload).pipe(
            retry(RETRY_ATTEMPTS),
            catchError(() => {
              this.snackBar.open('Error cancelling token', 'Close', {
                duration: 3000,
              });
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data: any) => {
          if (data?.success) {
            this.dialog.open(SuccessDialogComponent, {
              data: {
                message: data.message || 'Token cancelled successfully!',
              },
            });
            this.fetchAllTokens();
          }
        }
      });
  }

  deleteTokens(tokenId: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete Tokens?' },
    });

    dialogRef.afterClosed()
      .pipe(
        filter((result): result is boolean => result === true),
        switchMap(() => {
          const requestPayload = {
            token_id: tokenId,
          };

          return this.http.post(`${this.baseUrl}/delete_token`, requestPayload).pipe(
            retry(RETRY_ATTEMPTS),
            catchError(() => {
              this.snackBar.open('Unable to Delete Token.', 'Close', {
                duration: 3000,
              });
              return of(null);
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (data) => {
          if (data) {
            this.snackBar.open('Tokens deleted successfully', 'Close', {
              duration: 3000,
            });
            this.fetchAllTokens();
          }
        }
      });
  }

  // Selection methods
  onTokenSelectionChange(checked: boolean, row: any): void {
    const selectedData: TokenData = {
      token_id: row.token_id,
      project_id: row.project_id,
    };

    if (checked) {
      this.selectedTokens.update(tokens => [...tokens, selectedData]);
    } else {
      this.selectedTokens.update(tokens =>
        tokens.filter(item => item.token_id !== selectedData.token_id)
      );
    }
  }

  // Method to get payload for ag-grid
  getAgGridPayload(): Record<string, unknown> {
    const formValues = this.addTokenForm.value;
    const telecallerIdValue = this.getTelecallerIdValue(formValues);
    const filters = this.buildFiltersObject(formValues, telecallerIdValue);
    const paginationState = this.paginationParams();

    // Ensure all form values are included in filters
    const payloadFilters: Record<string, unknown> = {
      ...filters,
      search: this.globalSearchTerm() || '',
    };

    return {
      offset: paginationState.offset,
      limit: paginationState.limit,
      sortBy: paginationState.sortBy,
      sortOrder: paginationState.sortOrder,
      filters: payloadFilters
    };
  }
}
