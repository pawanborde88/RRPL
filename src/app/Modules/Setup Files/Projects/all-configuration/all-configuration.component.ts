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
import { AddConfigurationComponent } from '../add-configuration/add-configuration.component';
import { PreviewImagesComponent } from '../preview-images/preview-images.component';
import { catchError, finalize, of, tap } from 'rxjs';

/**
 * Interface for Project Configuration data structure
 */
export interface ProjectConfiguration {
  project_configuration_id: number;
  configuration: string;
  bhk?: string;
  bhk_id?: number;
  carpet_area?: number | string;
  feet?: string;
  feet_id?: number;
  price_starts?: number | string;
  price_ends?: number | string;
  start_price_unit?: string;
  price_unit?: string;
  end_price_unit?: string;
  start_price_id?: number;
  end_price_id?: number;
  phase_id?: number;
  phase_name?: string;
  variant_name?: string;
  active_status_id: number;
  config_image?: string | string[];
  valid_from_date?: string;
  valid_till_date?: string;
  project_id?: string;
  user_id?: number;
  updated_by?: number;
}

/**
 * Interface for API response
 */
interface ConfigurationApiResponse extends Array<ProjectConfiguration> {}

/**
 * Interface for Dialog action types
 */
type DialogAction = 'add' | 'edit';

@Component({
  selector: 'app-all-configuration',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
  ],
  templateUrl: './all-configuration.component.html',
  styleUrl: './all-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AllConfigurationComponent implements OnInit {
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
  readonly configurations = signal<ProjectConfiguration[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // Computed signals for derived state
  readonly hasConfigurations = computed(() => this.configurations().length > 0);
  readonly activeConfigurations = computed(() => 
    this.configurations().filter(config => config.active_status_id === 1)
  );

  /**
   * Lifecycle hook - fetches configurations on component initialization
   */
  ngOnInit(): void {
    if (this.projectID) {
      this.fetchProjectConfiguration();
    }
  }

  /**
   * Fetches project configurations from the API
   * Uses optimized RxJS operators for error handling and cleanup
   */
  fetchProjectConfiguration(): void {
    if (!this.projectID) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.http
      .post<ConfigurationApiResponse>(`${this.baseUrl}/fetch_project_configuration`, {
        project_id: this.projectID,
      })
      .pipe(
        tap((response) => {
          this.configurations.set(response || []);
        }),
        catchError((error) => {
          console.error('Error fetching configurations:', error);
          this.error.set('Unable to fetch project configurations.');
          this.snackBar.open(
            'Unable to fetch project configurations.',
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
   * Opens the configuration dialog for adding or editing
   * @param action - 'add' or 'edit'
   * @param config - Optional configuration data for editing
   */
  openConfiguration(action: DialogAction, config?: ProjectConfiguration): void {
    const dialogRef = this.dialog.open(AddConfigurationComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Configuration' : 'Edit Configuration',
        apiUrl: action === 'add' ? 'add_project_configuration' : 'edit_project_configurations',
        successMessage:
          action === 'add'
            ? 'Configuration added successfully'
            : 'Configuration updated successfully',
        rowData: config,
        projectid: this.projectID,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.fetchProjectConfiguration();
        }
      });
  }

  /**
   * Opens preview dialog for configuration images
   * @param imageData - Image data to preview
   */
  previewImages(imageData: any): void {
    const dialogRef = this.dialog.open(PreviewImagesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        images: imageData,
        name: 'value',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  /**
   * Formats price range for display
   * @param config - Configuration object
   * @returns Formatted price string
   */
  formatPriceRange(config: ProjectConfiguration): string {
    if (!config.price_starts && !config.price_ends) {
      return '-';
    }

    const start = config.price_starts || '';
    const end = config.price_ends || '';
    const startUnit = config.start_price_unit || '';
    const endUnit = config.end_price_unit || '';

    if (start && end) {
      return `${start} ${startUnit} to ${end} ${endUnit}`;
    } else if (start) {
      return `${start} ${startUnit}`;
    } else if (end) {
      return `${end} ${endUnit}`;
    }
    return '-';
  }

  /**
   * Formats area for display
   * @param config - Configuration object
   * @returns Formatted area string
   */
  formatArea(config: ProjectConfiguration): string {
    if (!config.carpet_area) {
      return '-';
    }
    const unit = config.feet || '';
    return `${config.carpet_area} ${unit}`.trim();
  }

  /**
   * Checks if configuration is active
   * @param config - Configuration object
   * @returns True if configuration is active
   */
  isActiveConfiguration(config: ProjectConfiguration): boolean {
    return config.active_status_id === 1;
  }
}
