import { CommonModule, DatePipe } from '@angular/common';
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
import { AddPhaseComponent } from '../add-phase/add-phase.component';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Interface for Project Phase data structure
 */
export interface ProjectPhase {
  phase_id: number;
  phase_name: string;
  project_id: string;
  sequence?: number;
  active_status_id: number;
  rera_no?: string;
  start_date?: string;
  launch_date?: string;
  specification_icon?: string;
  user_id?: number;
  updated_by?: number;
}

/**
 * Interface for API response
 */
interface PhaseApiResponse extends Array<ProjectPhase> {}

/**
 * Interface for Dialog action types
 */
type DialogAction = 'add' | 'edit';

@Component({
  selector: 'app-all-phases',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  templateUrl: './all-phases.component.html',
  styleUrl: './all-phases.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllPhasesComponent implements OnInit {
  // Dependency injection using inject() function
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private datePipe: DatePipe = new DatePipe('en-US');
  // Input for project ID
  @Input({ required: true }) projectID!: string;

  // Base URL from environment
  private readonly baseUrl = environment.API_URL;

  // State signals
  readonly phases = signal<ProjectPhase[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed signals for derived state
  readonly hasPhases = computed(() => this.phases().length > 0);
  readonly activePhases = computed(() => 
    this.phases().filter(phase => phase.active_status_id === 1)
  );

  /**
   * Lifecycle hook - fetches phases on component initialization
   */
  ngOnInit(): void {
    if (this.projectID) {
      this.fetchProjectPhases();
    }
  }

  /**
   * Fetches project phases from the API
   * Uses optimized RxJS operators for error handling and cleanup
   */
  fetchProjectPhases(): void {
    if (!this.projectID) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.http
      .post<PhaseApiResponse>(`${this.baseUrl}/fetch_phases`, {
        project_id: this.projectID,
      })
      .pipe(
        tap((response) => {
          this.phases.set(response || []);
        }),
        catchError((error) => {
          console.error('Error fetching phases:', error);
          this.error.set('Unable to fetch project phases.');
          this.snackBar.open(
            'Unable to fetch project phases.',
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
   * Opens the phase dialog for adding or editing
   * @param action - 'add' or 'edit'
   * @param phase - Optional phase data for editing
   */
  openPhaseComponent(action: DialogAction, phase?: ProjectPhase): void {
    const dialogRef = this.dialog.open(AddPhaseComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Phase' : 'Edit Phase',
        apiUrl: action === 'add' ? 'add_phase' : 'edit_phase',
        successMessage:
          action === 'add'
            ? 'Phase added successfully'
            : 'Phase updated successfully',
        rowData: phase,
        projectid: this.projectID,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchProjectPhases();
        }
      });
  }

  /**
   * Formats date using DatePipe
   * @param date - Date string or null
   * @returns Formatted date string or '-'
   */
  formatDate(date: string | null | undefined): string {
    if (!date) {
      return '-';
    }
    return this.datePipe.transform(date, 'shortDate') || '-';
  }

  /**
   * Checks if phase is active
   * @param phase - Phase object
   * @returns True if phase is active
   */
  isActivePhase(phase: ProjectPhase): boolean {
    return phase.active_status_id === 1;
  }
}
