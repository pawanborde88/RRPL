import { CommonModule, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { environment } from '../../../../../environments/environment';
import { SuccessDialogComponent } from '../../../../Common/success-dialog/success-dialog.component';
import { CustomValidators } from '../../../../Common/customValidators';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import {
  MatTreeModule,
  MatTreeFlatDataSource,
  MatTreeFlattener,
} from '@angular/material/tree';
import { FlatTreeControl } from '@angular/cdk/tree';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { UserService, TreeNode, UserProfile } from '../services/user.service';
import { UserFacade } from '../services/user.facade';

/** Flat node with expandable and level information */
interface FlatNode {
  expandable: boolean;
  name: string;
  id: number;
  level: number;
}

// Constants
const SNACKBAR_DURATION_MS = 3000;
const DEFAULT_PROFILE_IMAGE = 'assets/Images/null_image.png';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    AutocompleteReusableComponent,
    MatTreeModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddUserComponent implements OnInit {
  // Dependency Injection
  private readonly userService = inject(UserService);
  private readonly facade = inject(UserFacade);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private datePipe: DatePipe = new DatePipe('en-US'); readonly dialogRef = inject(MatDialogRef<AddUserComponent>);
  readonly data = inject(MAT_DIALOG_DATA);

  // Constants
  readonly storageUrl = environment.STORAGE_URL;
  readonly userId = Number(sessionStorage.getItem('session_id') ?? '0');

  // State signals
  readonly hidePassword = signal<boolean>(true);
  readonly profileImage = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly selectedUser = signal<FlatNode | null>(null);
  readonly userProfileID = signal<string>('');
  readonly submitting = signal<boolean>(false);

  // Form state from facade
  readonly roles = this.facade.roles;
  readonly assignedUsers = this.facade.assignedUsers;
  readonly loading = this.facade.loading;

  // Computed signals
  readonly isEditMode = computed(() => !!this.userProfileID());
  readonly dialogTitle = computed(() =>
    this.isEditMode() ? 'Update User' : 'Add New User'
  );
  readonly submitButtonText = computed(() =>
    this.isEditMode() ? 'Update' : 'Add User'
  );
  readonly submitButtonIcon = computed(() =>
    this.isEditMode() ? 'save' : 'add_circle'
  );
  readonly hasAssignedUsers = computed(() => this.assignedUsers().length > 0);

  // Tree properties
  private readonly transformer = (node: TreeNode, level: number): FlatNode => ({
    expandable: !!node.children && node.children.length > 0,
    name: node.name,
    id: node.id,
    level,
  });

  readonly treeControl = new FlatTreeControl<FlatNode>(
    (node) => node.level,
    (node) => node.expandable
  );

  private readonly treeFlattener = new MatTreeFlattener(
    this.transformer,
    (node) => node.level,
    (node) => node.expandable,
    (node) => node.children
  );

  readonly dataSource = new MatTreeFlatDataSource(
    this.treeControl,
    this.treeFlattener
  );

  // Form definition
  readonly addUserForm = new FormGroup({
    role_id: new FormControl<number[]>([]),
    first_name: new FormControl<string | null>(null, Validators.required),
    last_name: new FormControl<string | null>(null),
    user_email: new FormControl<string>('', [
      Validators.required,
      Validators.email,
    ]),
    created_by: new FormControl<number>(this.userId),
    user_phone: new FormControl<string>('', [
      Validators.required,
      Validators.pattern(/^\d{10}$/),
      Validators.minLength(10),
      Validators.maxLength(10),
    ]),
    dob: new FormControl<string | null>(null),
    gender: new FormControl<number | null>(null),
    address: new FormControl<string | null>(null),
    caller_id: new FormControl<string | null>(null),
    password: new FormControl<string>('', [
      Validators.required,
      CustomValidators.PasswordStrength(),
    ]),
    profile_image: new FormControl<File | null>(null),
    manager_id: new FormControl<number | null>(null),
  });

  // Computed signal for selected manager name
  readonly selectedManagerName = computed(() => {
    const selected = this.selectedUser();
    if (selected) {
      return selected.name;
    }

    const managerId = this.addUserForm.get('manager_id')?.value;
    const users = this.assignedUsers();

    if (managerId && users.length > 0) {
      const foundNode = this.findNodeById(users, managerId);
      if (foundNode) {
        return foundNode.name;
      }
    }

    return '';
  });

  // Effect to update tree data source and selected user when assigned users change
  private readonly updateTreeDataSource = effect(() => {
    const users = this.assignedUsers();
    if (users.length > 0) {
      this.dataSource.data = users;

      // If manager_id exists, set the selected user
      const managerId = this.addUserForm.get('manager_id')?.value;
      if (managerId) {
        this.setSelectedUserById(managerId);
      }

      this.cdr.markForCheck();
    }
  }, { allowSignalWrites: true });

  constructor() {
    // Subscribe to manager_id changes using RxJS
    // This handles form control changes which are not reactive signals
    this.addUserForm
      .get('manager_id')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((managerId) => {
        const users = this.assignedUsers();
        if (managerId && users.length > 0) {
          this.setSelectedUserById(managerId);
        } else if (!managerId) {
          this.selectedUser.set(null);
        }
        this.cdr.markForCheck();
      });

    // Effect to update selected user when assigned users signal changes
    // This ensures selected user is set when users data loads
    effect(
      () => {
        const users = this.assignedUsers();
        if (users.length > 0) {
          const managerId = this.addUserForm.get('manager_id')?.value;
          if (managerId) {
            this.setSelectedUserById(managerId);
            this.cdr.markForCheck();
          }
        }
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    // Load initial data
    this.loadRoles();
    this.loadAssignedUsers();

    // Handle edit mode
    if (this.data?.userId) {
      this.userProfileID.set(this.data.userId);
      this.loadUserProfile(this.data.userId);
      this.addUserForm.get('password')?.clearValidators();
      this.addUserForm.get('password')?.updateValueAndValidity();
    }
  }

  /**
   * Load roles from state service
   */
  private loadRoles(): void {
    this.facade.loadRoles().catch((error: Error | any) => {
      this.showError('Unable to fetch roles');
      console.error('Error loading roles:', error);
    });
  }

  /**
   * Load assigned users from facade
   */
  private loadAssignedUsers(): void {
    this.facade.loadAssignedUsers().catch((error: Error | any) => {
      this.showError('Error fetching assigned users');
      console.error('Error loading assigned users:', error);
    });
  }

  /**
   * Load user profile for edit mode
   */
  private loadUserProfile(userId: string): void {
    this.userService
      .fetchUserProfile(userId)
      .pipe(
        tap((profile) => {
          const imageUrl = profile.profile_image
            ? `${this.storageUrl}/${profile.profile_image}`
            : DEFAULT_PROFILE_IMAGE;

          this.profileImage.set(imageUrl);

          this.addUserForm.patchValue({
            ...profile,
            profile_image: imageUrl as unknown as File,
            password: (profile as { password?: string }).password || '',
          });

          // Set selected user if manager_id exists
          if (profile.manager_id && this.assignedUsers().length > 0) {
            this.setSelectedUserById(profile.manager_id);
          }
        }),
        catchError(() => {
          this.showError('Error fetching user profile');
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe();
  }

  /**
   * Handle file selection
   */
  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = () => {
      this.profileImage.set(reader.result as string);
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);

    this.addUserForm.patchValue({ profile_image: file });
    this.addUserForm.get('profile_image')?.updateValueAndValidity();
  }

  /**
   * Remove selected file
   */
  removeFile(): void {
    this.profileImage.set(null);
    this.selectedFile.set(null);
    this.addUserForm.patchValue({ profile_image: null });
    this.cdr.markForCheck();
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.addUserForm.invalid) {
      this.markFormGroupTouched(this.addUserForm);
      return;
    }

    // Check if at least one field is filled
    const hasAnyValue = Object.values(this.addUserForm.value).some(
      (value) => value !== null && value !== undefined && value !== ''
    );

    if (!hasAnyValue) {
      this.showError('Please fill at least one field before submitting.');
      return;
    }

    this.submitting.set(true);
    const formData = this.buildFormData();

    const request$ = this.isEditMode()
      ? this.userService.updateUser(formData)
      : this.userService.addUser(formData);

    request$
      .pipe(
        tap((response) => {
          if (response.success) {
            this.dialog.open(SuccessDialogComponent, {
              autoFocus: false,
              data: { message: response.message },
            });
            this.dialogRef.close(true);
          } else {
            this.showError(
              response.message || 'Operation was not successful'
            );
          }
        }),
        catchError((error) => {
          this.showError(
            error.error?.message || 'Something went wrong. Please try again.'
          );
          return EMPTY;
        }),
        finalize(() => {
          this.submitting.set(false);
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Build FormData from form values
   */
  private buildFormData(): FormData {
    const formData = new FormData();
    const formValue = this.addUserForm.value;

    Object.keys(formValue).forEach((key) => {
      const control = this.addUserForm.get(key);
      let value = control?.value;

      // Format date
      if (key === 'dob' && value) {
        value = this.datePipe.transform(value, 'yyyy-MM-dd') ?? '';
      }

      // Handle role_id array
      if (key === 'role_id' && Array.isArray(value)) {
        value.forEach((role: number) => {
          formData.append('role_id[]', role.toString());
        });
      } else if (value !== null && value !== undefined) {
        // Handle manager_id and other fields
        if (key === 'manager_id' || value !== '') {
          formData.append(key, value.toString());
        }
      }
    });

    // Append file if selected
    const file = this.selectedFile();
    if (file) {
      formData.append('profile_image', file);
    }

    // Append user_id for editing
    if (this.isEditMode()) {
      formData.append('user_id', this.userProfileID());
      formData.append('updated_by', this.userId.toString());
    }

    return formData;
  }

  /**
   * Get selected manager name (computed signal is used instead)
   * This method is kept for backward compatibility but uses the computed signal
   */
  getSelectedManagerName(): string {
    return this.selectedManagerName();
  }

  /**
   * Select node from tree
   */
  selectNode(node: FlatNode): void {
    this.selectedUser.set(node);
    this.addUserForm.patchValue({ manager_id: node.id });
    this.cdr.markForCheck();
  }

  /**
   * Check if node has children
   */
  hasChild = (_: number, node: FlatNode): boolean => node.expandable;

  /**
   * Find node by ID in tree
   */
  private findNodeById(nodes: TreeNode[], id: number): TreeNode | null {
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      if (node.children?.length) {
        const found = this.findNodeById(node.children, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * Set selected user by ID
   */
  private setSelectedUserById(id: number): void {
    const users = this.assignedUsers();
    const foundNode = this.findNodeById(users, id);
    if (foundNode) {
      const level = this.getNodeLevel(users, id, 0);
      const flatNode = this.transformer(foundNode, level);
      this.selectedUser.set(flatNode);
    }
  }

  /**
   * Get node level in tree
   */
  private getNodeLevel(
    nodes: TreeNode[],
    id: number,
    currentLevel: number
  ): number {
    for (const node of nodes) {
      if (node.id === id) {
        return currentLevel;
      }
      if (node.children?.length) {
        const found = this.getNodeLevel(node.children, id, currentLevel + 1);
        if (found !== -1) {
          return found;
        }
      }
    }
    return -1;
  }

  /**
   * Mark all form controls as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: SNACKBAR_DURATION_MS,
    });
  }
}
