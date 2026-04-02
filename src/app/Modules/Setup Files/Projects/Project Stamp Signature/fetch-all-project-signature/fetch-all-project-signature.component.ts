import { CommonModule } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../../environments/environment';
import { ProjectStampSignatureDialogComponent } from '../project-stamp-signature-dialog/project-stamp-signature-dialog.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  EMPTY,
  finalize,
  Subscription,
  tap,
} from 'rxjs';

interface ProjectStampSignature {
  project_stamp: string;
  project_signature: string;
}

interface ApiResponse {
  status: boolean;
  data: ProjectStampSignature;
}

interface DialogData {
  title: string;
  apiUrl: string;
  projectId: string;
  imageType?: string;
  currentImage: string | null;
  action: string;
}

@Component({
  selector: 'app-fetch-all-project-signature',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],
  templateUrl: './fetch-all-project-signature.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FetchAllProjectSignatureComponent {
  // Dependency injection using inject()
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // Environment configuration
  private readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;

  // Input signal for project ID
  projectID = input.required<string>();

  // State signals
  readonly loading = signal<boolean>(false);
  private readonly error = signal<string | null>(null);
  readonly projectData = signal<ProjectStampSignature | null>(null);
  
  // Subscription tracking for cleanup
  private currentSubscription: Subscription | null = null;

  // Computed signals for derived state
  readonly hasProjectData = computed(() => this.projectData() !== null);
  readonly hasStamp = computed(() => !!this.projectData()?.project_stamp);
  readonly hasSignature = computed(() => !!this.projectData()?.project_signature);
  readonly stampImageUrl = computed(() => {
    const data = this.projectData();
    return data?.project_stamp
      ? `${this.storageUrl}/${data.project_stamp}`
      : null;
  });
  readonly signatureImageUrl = computed(() => {
    const data = this.projectData();
    return data?.project_signature
      ? `${this.storageUrl}/${data.project_signature}`
      : null;
  });

  // Effect to fetch data when projectID changes with optimized RxJS
  constructor() {
    // Clean up subscription on destroy
    this.destroyRef.onDestroy(() => {
      if (this.currentSubscription) {
        this.currentSubscription.unsubscribe();
      }
    });

    effect(
      () => {
        const projectId = this.projectID();
        
        // Cancel previous subscription if exists
        if (this.currentSubscription) {
          this.currentSubscription.unsubscribe();
          this.currentSubscription = null;
        }

        if (!projectId) {
          this.projectData.set(null);
          return;
        }

        this.loading.set(true);
        this.error.set(null);

        this.currentSubscription = this.http
          .post<ApiResponse>(`${this.baseUrl}/fetch_project_stamp_signature`, {
            project_id: projectId,
          })
          .pipe(
            tap((res) => {
              this.projectData.set(res.status && res.data ? res.data : null);
            }),
            catchError((error) => {
              console.error('Error fetching stamp/signature:', error);
              const errorMessage = 'Unable to fetch project stamp and signature.';
              this.error.set(errorMessage);
              this.snackBar.open(errorMessage, 'Close', {
                duration: 3000,
              });
              this.projectData.set(null);
              return EMPTY;
            }),
            finalize(() => {
              this.loading.set(false);
              this.currentSubscription = null;
            })
          )
          .subscribe();
      },
      { allowSignalWrites: true }
    );
  }

  fetchProjectStampSignatures(): void {
    const projectId = this.projectID();
    if (!projectId) return;

    this.loading.set(true);
    this.error.set(null);

    this.http
      .post<ApiResponse>(`${this.baseUrl}/fetch_project_stamp_signature`, {
        project_id: projectId,
      })
      .pipe(
        tap((res) => {
          this.projectData.set(res.status && res.data ? res.data : null);
        }),
        catchError((error) => {
          console.error('Error fetching stamp/signature:', error);
          const errorMessage = 'Unable to fetch project stamp and signature.';
          this.error.set(errorMessage);
          this.snackBar.open(errorMessage, 'Close', {
            duration: 3000,
          });
          this.projectData.set(null);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe();
  }

  addProjectLink(
    action: string,
    imageType?: string,
    currentImagePath?: string
  ): void {
    const dialogData: DialogData = {
      title:
        action === 'add' ? 'Add Stamp/Signature' : 'Edit Stamp/Signature',
      apiUrl: 'add_project_stamp_signature',
      projectId: this.projectID(),
      imageType,
      currentImage: currentImagePath
        ? `${this.storageUrl}/${currentImagePath}`
        : null,
      action,
    };

    const dialogRef = this.dialog.open(ProjectStampSignatureDialogComponent, {
      minWidth: '30vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: dialogData,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed())
      .subscribe((result) => {
        if (result) {
          this.fetchProjectStampSignatures();
        }
      });
  }
}
