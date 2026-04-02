import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { 
  Component, 
  Input, 
  OnInit,
  signal, 
  computed, 
  ChangeDetectionStrategy,
  inject,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { AddwingsComponent } from '../addwings/addwings.component';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Interface for Project Wing data structure
 */
export interface ProjectWing {
  wing_id: number;
  wing_name: string;
  project_id: string;
  phase_id: number;
  phase_name?: string;
  active_status_id: number;
  user_id?: number;
  updated_by?: number;
}

/**
 * Interface for API response
 */
interface WingApiResponse extends Array<ProjectWing> {}

/**
 * Interface for Dialog action types
 */
type DialogAction = 'add' | 'edit';

@Component({
  selector: 'app-all-project-wings',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  templateUrl: './all-project-wings.component.html',
  styleUrl: './all-project-wings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllProjectWingsComponent implements OnInit {
  // Dependency injection using inject() function
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Input for project ID
  @Input({ required: true }) projectID!: string;

  // Base URL from environment
  private readonly baseUrl = environment.API_URL;

  // State signals
  readonly wings = signal<ProjectWing[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed signals for derived state
  readonly hasWings = computed(() => this.wings().length > 0);
  readonly activeWings = computed(() => 
    this.wings().filter(wing => wing.active_status_id === 1)
  );

  /**
   * Lifecycle hook - fetches wings on component initialization
   */
  ngOnInit(): void {
    if (this.projectID) {
      this.fetchAllProjectWings();
    }
  }

  /**
   * Fetches project wings from the API
   * Uses optimized RxJS operators for error handling and cleanup
   */
  fetchAllProjectWings(): void {
    if (!this.projectID) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.http
      .post<WingApiResponse>(`${this.baseUrl}/fetch_wing`, {
        project_id: this.projectID,
      })
      .pipe(
        tap((response) => {
          this.wings.set(response || []);
        }),
        catchError((error) => {
          console.error('Error fetching wings:', error);
          this.error.set('Unable to fetch project wings.');
          this.snackBar.open(
            'Unable to fetch project wings.',
            'Close',
            { duration: 3000 }
          );
          return of([]);
        }),
        finalize(() => {
          this.loading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Opens the wing dialog for adding or editing
   * @param action - 'add' or 'edit'
   * @param wing - Optional wing data for editing
   */
  openwingComponent(action: DialogAction, wing?: ProjectWing): void {
    const dialogRef = this.dialog.open(AddwingsComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Wing' : 'Edit Wing',
        apiUrl: action === 'add' ? 'add_wing' : 'edit_wing',
        successMessage:
          action === 'add'
            ? 'Wing added successfully'
            : 'Wing updated successfully',
        rowData: wing,
        projectid: this.projectID,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchAllProjectWings();
        }
      });
  }

  /**
   * Checks if wing is active
   * @param wing - Wing object
   * @returns True if wing is active
   */
  isActiveWing(wing: ProjectWing): boolean {
    return wing.active_status_id === 1;
  }
}
