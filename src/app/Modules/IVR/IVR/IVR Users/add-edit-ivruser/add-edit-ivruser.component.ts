import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  Inject,
  inject,
  OnInit,
  signal
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { HttpClient } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  of,
  switchMap
} from 'rxjs';
import { catchError, retry, shareReplay, tap } from 'rxjs/operators';

// Constants
const RETRY_ATTEMPTS = 2;
const DEBOUNCE_TIME_MS = 300;
const SNACKBAR_DURATION_MS = 3000;
const CACHE_SIZE = 1;

// Type definitions
interface Project {
  project_id: number;
  property_name: string;
  [key: string]: unknown;
}

interface Source {
  source: string;
  [key: string]: unknown;
}

interface SourceDetail {
  firm_name: string;
  cp_owner: string;
  source_details: number;
  full_name?: string;
  [key: string]: unknown;
}

interface IVRUser {
  ivr_id?: number;
  project_id: number;
  user_id: number;
  call_no?: number | string;
  active_status_id: number;
  provider_name: string;
  did_no: string;
  phone_no: string;
  cli_no: string;
  source?: number | null;
  source_detail_id?: number | null;
  source_details?: string;
  created_by?: number;
  updated_by?: number;
  [key: string]: unknown;
}

interface IVRUserFormValue {
  project_id: number | null;
  user_id: number | null;
  call_no: number | null;
  active_status_id: number;
  provider_name: string;
  did_no: string;
  phone_no: string;
  cli_no: string;
  source: number | null;
  source_detail_id: number | null;
}

interface DialogData {
  mode: 'add' | 'edit';
  ivrUser?: IVRUser;
}
  interface User {
    user_id: number;
    full_name: string;
    [key: string]: unknown;
  }
@Component({
  selector: 'app-add-edit-ivruser',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
  ],
  templateUrl: './add-edit-ivruser.component.html',
  styleUrl: './add-edit-ivruser.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddEditIVRUserComponent implements OnInit {
  // Dependency Injection
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  // Constants
  readonly baseUrl = environment.API_URL;
  readonly userId = this.getUserId();

  // Reactive state using signals
  readonly loading = signal<boolean>(false);
  readonly projectsList = signal<Project[]>([]);
  readonly usersList = signal<User[]>([]);
  readonly sourceDetailedList = signal<SourceDetail[]>([]);

  // Mode and ID
  readonly mode: 'add' | 'edit' = this.data.mode;
  readonly ivrUserId = signal<number | null>(
    this.data.ivrUser?.ivr_id ?? null
  );

  // Source ID subject for reactive updates
  private readonly sourceIdSubject = new BehaviorSubject<number | null>(null);

  // Form definition
  readonly ivrUserForm = new FormGroup<{
    project_id: FormControl<number | null>;
    user_id: FormControl<number | null>;
    call_no: FormControl<number | null>;
    active_status_id: FormControl<number>;
    provider_name: FormControl<string>;
    did_no: FormControl<string>;
    phone_no: FormControl<string>;
    cli_no: FormControl<string>;
    source: FormControl<number | null>;
    source_detail_id: FormControl<number | null>;
  }>({
    project_id: new FormControl<number | null>(null, [Validators.required]),
    user_id: new FormControl<number | null>(null, [Validators.required]),
    call_no: new FormControl<number | null>(null),
    active_status_id: new FormControl<number>(1, { nonNullable: true }),
    provider_name: new FormControl<string>('', { nonNullable: true }),
    did_no: new FormControl<string>('', { nonNullable: true }),
    phone_no: new FormControl<string>('', { nonNullable: true }),
    cli_no: new FormControl<string>('', { nonNullable: true }),
    source: new FormControl<number | null>(null),
    source_detail_id: new FormControl<number | null>(null),
  });

  // Computed values
  readonly isEditMode = computed(() => this.mode === 'edit');
  readonly isFormValid = computed(() => this.ivrUserForm.valid);
  readonly hasSourceDetails = computed(() =>
    this.ivrUserForm.get('source')?.value !== 3
  );
  readonly submitButtonText = computed(() =>
    this.isEditMode() ? 'Update' : 'Add'
  );
  readonly dialogTitle = computed(() =>
    this.isEditMode() ? 'Update IVR User' : 'Add New IVR User'
  );

  // Cached observables for API calls
  private projectsCache$ = this.fetchProjects().pipe(
    shareReplay(CACHE_SIZE),
    takeUntilDestroyed(this.destroyRef)
  );

  private sourcesCache$ = this.fetchSources().pipe(
    shareReplay(CACHE_SIZE),
    takeUntilDestroyed(this.destroyRef)
  );

  constructor(
    public dialogRef: MatDialogRef<AddEditIVRUserComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
 

    // Setup reactive source changes with debouncing
    this.setupSourceIdReactiveUpdates();
  }

  ngOnInit(): void {
    console.log(this.data);
    
    this.initializeData();
    this.loadInitialData();
    this.setupProjectChangeListener();

    if (this.isEditMode() && this.data.ivrUser) {
      this.patchFormWithEditData(this.data.ivrUser);
    }
  }

  /**
   * Get user ID from session storage with memoization
   */
  private getUserId(): number {
    return Number(sessionStorage.getItem('session_id')) || 0;
  }

  /**
   * Setup reactive updates for source changes with debouncing
   */
  private setupSourceIdReactiveUpdates(): void {
    this.ivrUserForm.get('source')?.valueChanges
      .pipe(
        debounceTime(DEBOUNCE_TIME_MS),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((sourceId) => {
        this.sourceIdSubject.next(sourceId ?? null);
      });
  }

  /**
   * Initialize component data
   */
  private initializeData(): void {
    // Set initial source if in edit mode
    if (this.isEditMode() && this.data.ivrUser?.source) {
      this.sourceIdSubject.next(this.data.ivrUser.source);
    }
  }

  /**
   * Load initial data (projects and sources) in parallel
   */
  private loadInitialData(): void {
    this.loading.set(true);

    // Load projects and sources in parallel
    this.projectsCache$.subscribe({
      next: (projects) => {
        this.projectsList.set(projects);
      },
    });

   
  }


  /**
   * Fetch projects with caching
   */
  private fetchProjects() {
    const payload = {
      user_id: this.getProjectUserId(),
    };

    return this.http.post<Project[]>(
      `${this.baseUrl}/user_project_dropdown`,
      payload
    ).pipe(
      retry(RETRY_ATTEMPTS),
      catchError((err) => {
        this.handleError('projects', err);
        return of([]);
      })
    );
  }
  private fetchUsers(projectId: number | null) {
    if (!projectId) {
      this.usersList.set([]);
      return of([]);
    }

    const payload = {
      project_id: projectId,
    };

    return this.http.post<any[]>(
      `${this.baseUrl}/fetch_assigned_projects`,
      payload
    ).pipe(
      retry(RETRY_ATTEMPTS),
      tap((users) => {
        // Map users to include full_name
        const mappedUsers = users.map((user: any) => ({
          ...user,
          full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.user_name || ''
        }));
        this.usersList.set(mappedUsers);
        this.cdr.markForCheck();
      }),
      catchError((err) => {
        this.handleError('users', err);
        this.usersList.set([]);
        return of([]);
      })
    );
  }

  /**
   * Setup listener for project changes to fetch users
   */
  private setupProjectChangeListener(): void {
    this.ivrUserForm.get('project_id')?.valueChanges
      .pipe(
        debounceTime(DEBOUNCE_TIME_MS),
        distinctUntilChanged(),
        switchMap((projectId) => {
          // Reset user_id when project changes
          this.ivrUserForm.patchValue({ user_id: null }, { emitEvent: false });
          return this.fetchUsers(projectId);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
  /**
   * Get project user ID based on role
   */
  private getProjectUserId(): number | null {
    const roleId = Number(sessionStorage.getItem('role_id'));
    return roleId === 2
      ? null
      : Number(sessionStorage.getItem('session_id'));
  }

  /**
   * Fetch sources with caching
   */
  private fetchSources() {
    return this.http.get<Source[]>(`${this.baseUrl}/source_dropdown`).pipe(
      retry(RETRY_ATTEMPTS),
      catchError((err) => {
        this.handleError('sources', err);
        return of([]);
      })
    );
  }

  /**
   * Patch form with edit data
   */
  private patchFormWithEditData(ivrUser: IVRUser): void {
    this.ivrUserForm.patchValue({
      project_id: ivrUser.project_id ?? null,
      user_id: ivrUser.user_id ?? this.userId,
      call_no: ivrUser.call_no ? Number(ivrUser.call_no) : null,
      active_status_id: ivrUser.active_status_id ?? 1,
      provider_name: ivrUser.provider_name ?? '',
      did_no: ivrUser.did_no ?? '',
      phone_no: ivrUser.phone_no ?? '',
      cli_no: ivrUser.cli_no ?? '',
    }, { emitEvent: false });

    // Fetch users for the selected project in edit mode
    if (ivrUser.project_id) {
      this.fetchUsers(ivrUser.project_id).subscribe();
    }
  }

  /**
   * Handle API errors
   */
  private handleError(dataType: string, err?: unknown): void {
    console.error(`Error fetching ${dataType}:`, err);
    this.snackBar.open(
      `Unable to fetch ${dataType}.`,
      'Close',
      { duration: SNACKBAR_DURATION_MS }
    );
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (!this.isFormValid()) {
      this.ivrUserForm.markAllAsTouched();
      this.snackBar.open(
        'Please fill all required fields.',
        'Close',
        { duration: SNACKBAR_DURATION_MS }
      );
      this.cdr.markForCheck();
      return;
    }

    this.loading.set(true);
    const formValues = this.ivrUserForm.value as IVRUserFormValue;
    const ivrId = this.isEditMode() ? this.ivrUserId() : null;
    const payload: Partial<IVRUser> = {
      project_id: formValues.project_id ?? undefined,
      user_id: formValues.user_id ?? undefined,
      call_no: formValues.call_no ?? undefined,
      active_status_id: formValues.active_status_id,
      provider_name: formValues.provider_name,
      did_no: formValues.did_no,
      phone_no: formValues.phone_no,
      cli_no: formValues.cli_no,
      source: formValues.source ?? undefined,
      ivr_id: ivrId ?? undefined,
      created_by: this.userId,
      updated_by: this.userId,
    };

    const apiEndpoint = this.isEditMode() ? 'update_ivr' : 'add_ivr';

    this.http
      .post<{ success: boolean;[key: string]: unknown }>(
        `${this.baseUrl}/${apiEndpoint}`,
        payload
      )
      .pipe(
        retry(RETRY_ATTEMPTS),
        catchError((err) => {
          this.loading.set(false);
          const action = this.isEditMode() ? 'update' : 'add';
          this.snackBar.open(
            `Unable to ${action} IVR User.`,
            'Close',
            { duration: SNACKBAR_DURATION_MS }
          );
          this.cdr.markForCheck();
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.loading.set(false);
            const formValues = this.ivrUserForm.value as IVRUserFormValue;
            this.dialogRef.close({
              success: true,
              message: this.isEditMode() ? 'IVR User updated successfully' : 'IVR User added successfully',
              project_id: formValues.project_id
            });
          }
        }
      });
  }

  /**
   * Handle cancel action
   */
  onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * TrackBy function for source details list
   */
  trackBySourceDetailId(_index: number, item: SourceDetail): number {
    return item.source_details;
  }

  /**
   * TrackBy function for projects list
   */
  trackByProjectId(_index: number, item: Project): number {
    return item.project_id;
  }

  /**
   * TrackBy function for sources list
   */
  trackBySourceId(_index: number, item: Source): string {
    return String(item.source);
  }
}
