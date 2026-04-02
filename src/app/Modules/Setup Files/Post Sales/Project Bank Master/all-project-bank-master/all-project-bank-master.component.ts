import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { BreadcrumbComponent } from '../../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../../Common/template/template.component';
import { UpdateBankDetailsComponent } from '../Update Bank Details/update-bank-details/update-bank-details.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  FormGroup,
  FormControl,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  EMPTY,
  startWith,
} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Project,
  Wing,
  ProjectBankData,
  ProjectBankResponse,
  BankDetail,
  DialogData,
} from './models/project-bank-master.models';
import { ConfirmDialogComponent } from '../../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { CommonService } from '../../../../../Service/common/common.service';

/**
 * Highly optimized Angular 17+ component using advanced patterns:
 * - Standalone component architecture
 * - OnPush change detection for maximum performance
 * - Signals for reactive state management
 * - Computed signals for derived state
 * - Effect() for side effects
 * - toSignal() for converting observables to signals
 * - Optimized RxJS operators (debounceTime, distinctUntilChanged, switchMap)
 * - Service layer for API calls with proper separation of concerns
 * - Proper subscription management with takeUntilDestroyed
 * - TrackBy functions for *ngFor performance
 * - Clean dependency injection
 */
@Component({
  selector: 'app-all-project-bank-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    UpdateBankDetailsComponent,
    AutocompleteReusableComponent,
  ],
  templateUrl: './all-project-bank-master.component.html',
  styleUrl: './all-project-bank-master.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllProjectBankMasterComponent {
  // ============================================================================
  // Dependency Injection
  // ============================================================================
  private readonly commonService = inject(CommonService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly roleId = Number(sessionStorage.getItem('role_id')) || 0;

  // ============================================================================
  // State Management with Signals
  // ============================================================================

  // Loading states
  private readonly isLoadingProjects = signal<boolean>(false);
  private readonly isLoadingWings = signal<boolean>(false);
  private readonly isLoadingBanks = signal<boolean>(false);

  // Data signals
  private readonly projectsListSignal = signal<Project[]>([]);
  private readonly wingsListSignal = signal<Wing[]>([]);
  private readonly projectsDataSignal = signal<ProjectBankData[]>([]);

  // Computed signals for template
  readonly loading = computed(() =>
    this.isLoadingProjects() || this.isLoadingWings() || this.isLoadingBanks()
  );
  readonly projects = this.projectsDataSignal.asReadonly();
  readonly projectsList = this.projectsListSignal.asReadonly();
  readonly allWingslist = this.wingsListSignal.asReadonly();

  // ============================================================================
  // Form Management
  // ============================================================================

  readonly addpaymentStages = new FormGroup({
    project_id: new FormControl<number | null>(null, Validators.required),
    wing_id: new FormControl<number | null>(null, Validators.required),
  });

  // Convert form values to signals for reactivity
  private readonly projectIdSignal = toSignal(
    this.addpaymentStages.get('project_id')!.valueChanges.pipe(
      startWith(this.addpaymentStages.get('project_id')!.value)
    ),
    { initialValue: null }
  );

  private readonly wingIdSignal = toSignal(
    this.addpaymentStages.get('wing_id')!.valueChanges.pipe(
      startWith(this.addpaymentStages.get('wing_id')!.value)
    ),
    { initialValue: null }
  );

  // Computed form validity
  readonly canAddBankData = computed(() => {
    const projectId = this.projectIdSignal();
    const wingId = this.wingIdSignal();
    return !!(projectId && wingId);
  });

  // ============================================================================
  // User Session Management
  // ============================================================================

  private get userId(): number | null {
    const sessionId = sessionStorage.getItem('session_id');
    return sessionId ? Number(sessionId) : null;
  }

  // ============================================================================
  // Constructor & Initialization
  // ============================================================================

  constructor() {
    // Initialize projects on component creation
    this.initializeProjects();

    // Setup reactive form listeners with debouncing
    this.setupFormListeners();
  }

  // ============================================================================
  // Initialization Methods
  // ============================================================================

  private initializeProjects(): void {
    const userId = this.userId;
    if (!userId) {
      this.handleError(new Error('User session not found'), 'Unable to fetch projects');
      return;
    }

    this.isLoadingProjects.set(true);

    this.commonService
      .fetchUserProjectDropdown(userId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.handleError(error, 'Unable to fetch projects');
          this.isLoadingProjects.set(false);
          return EMPTY;
        })
      )
      .subscribe({
        next: (projects) => {
          this.projectsListSignal.set(projects || []);
          this.isLoadingProjects.set(false);
        },
      });
  }

  // ============================================================================
  // Form Listeners with RxJS Operators
  // ============================================================================

  private setupFormListeners(): void {
    // Project selection listener with debouncing
    this.addpaymentStages
      .get('project_id')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((projectId) => {
          if (projectId) {
            this.isLoadingWings.set(true);
            this.wingsListSignal.set([]);
            this.addpaymentStages.get('wing_id')?.reset();
            this.projectsDataSignal.set([]);

            return this.commonService.fetchWingDropdown(projectId).pipe(
              map((wings) => {
                this.wingsListSignal.set(wings || []);
                this.isLoadingWings.set(false);
                return wings;
              }),
              catchError((error) => {
                this.handleError(error, 'No wings available for selection');
                this.wingsListSignal.set([]);
                this.isLoadingWings.set(false);
                return EMPTY;
              })
            );
          } else {
            this.wingsListSignal.set([]);
            this.projectsDataSignal.set([]);
            this.isLoadingWings.set(false);
            return EMPTY;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();

    // Wing selection listener with debouncing
    this.addpaymentStages
      .get('wing_id')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((wingId) => {
          const projectId = this.addpaymentStages.get('project_id')?.value;

          if (wingId && projectId) {
            this.isLoadingBanks.set(true);
            this.projectsDataSignal.set([]);

            return this.commonService.fetchProjectBanks(projectId, wingId).pipe(
              map((response) => {
                if (response.success && response.data) {
                  this.projectsDataSignal.set(this.processBankData(response.data));
                } else {
                  this.projectsDataSignal.set([]);
                }
                this.isLoadingBanks.set(false);
                return response;
              }),
              catchError((error) => {
                this.handleError(error, 'Unable to fetch project banks');
                this.projectsDataSignal.set([]);
                this.isLoadingBanks.set(false);
                return EMPTY;
              })
            );
          } else {
            this.projectsDataSignal.set([]);
            this.isLoadingBanks.set(false);
            return EMPTY;
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  // ============================================================================
  // Data Processing
  // ============================================================================

  private processBankData(data: ProjectBankData[]): ProjectBankData[] {
    return data.map((project) => ({
      project_name: project.project_name,
      wings: project.wings.map((wing) => ({
        wing_name: wing.wing_name,
        wing_id: wing.wing_id,
        wing_data: wing.wing_data || [],
      })),
    }));
  }

  // ============================================================================
  // Dialog Management
  // ============================================================================

  updateBankData(bankData?: BankDetail): void {
    if (bankData) {
      // Edit mode
      this.openBankDialog({
        mode: 'edit',
        bankData,
      });
    } else {
      // Add mode
      const projectId = this.addpaymentStages.get('project_id')?.value;
      const wingId = this.addpaymentStages.get('wing_id')?.value;

      if (!projectId || !wingId) {
        this.snackBar.open(
          'Please select both project and wing before adding bank details.',
          'Close',
          { duration: 3000 }
        );
        return;
      }

      this.openBankDialog({
        mode: 'add',
        projectId,
        wingId,
      });
    }
  }

  private openBankDialog(data: DialogData): void {
    const dialogRef = this.dialog.open(UpdateBankDetailsComponent, {
      width: '50vw',
      maxWidth: '90vw',
      data,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.refreshBankData();
        }
      });
  }

  private refreshBankData(): void {
    const projectId = this.addpaymentStages.get('project_id')?.value;
    const wingId = this.addpaymentStages.get('wing_id')?.value;

    if (!projectId || !wingId) {
      return;
    }

    this.isLoadingBanks.set(true);

    this.commonService
      .fetchProjectBanks(projectId, wingId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.handleError(error, 'Unable to refresh bank data');
          this.isLoadingBanks.set(false);
          return EMPTY;
        })
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.projectsDataSignal.set(this.processBankData(response.data));
          }
          this.isLoadingBanks.set(false);
        },
      });
  }

  // ============================================================================
  // Delete Operation
  // ============================================================================

  deleteBankData(bankData: BankDetail): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      minWidth: '25vw',
      data: { message: 'Are you sure you want to delete this bank data?' },
    });

    dialogRef
      .afterClosed()
      .pipe(
        switchMap((result) => {
          if (result) {
            return this.commonService.deleteProjectBank(bankData.project_bank_id);
          }
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          this.handleError(error, 'Unable to delete bank data');
          return EMPTY;
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Bank data deleted successfully', 'Close', {
            duration: 3000,
          });
          this.refreshBankData();
        },
      });
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  private handleError(error: unknown, defaultMessage: string): void {
    const message = error instanceof Error ? error.message : defaultMessage;
    this.snackBar.open(message, 'Close', { duration: 3000 });
    console.error('Error:', error);
  }

  // ============================================================================
  // TrackBy Functions for Performance
  // ============================================================================

  trackByProject(_index: number, project: ProjectBankData): string {
    return project.project_name || _index.toString();
  }

  trackByWing(_index: number, wing: { wing_id: number; wing_name: string }): number {
    return wing.wing_id;
  }

  trackByBankData(_index: number, bankData: BankDetail): number {
    return bankData.project_bank_id || _index;
  }

  trackByProjectId(_index: number, project: Project): number {
    return project.project_id;
  }

  trackByWingId(_index: number, wing: Wing): number {
    return wing.wing_id;
  }
}
