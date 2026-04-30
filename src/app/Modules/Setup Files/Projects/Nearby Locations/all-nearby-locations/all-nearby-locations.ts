import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription, tap, catchError, EMPTY, finalize } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { AngularMaterialModule } from '../../../../../../angular-material.module';
import { ApiResponse } from '../../../comment-log/comment-log.models';
import { CommonModule } from '@angular/common';
import { AddEditNearbyLocations } from '../add-edit-nearby-locations/add-edit-nearby-locations';

interface NearbyLocationDialogData {
  title: string;
  apiUrl: string;
  projectId: string;
  locationData?: any;
  action: string;
}

@Component({
  selector: 'app-all-nearby-locations',
  standalone: true,
  imports: [CommonModule, AngularMaterialModule],

  templateUrl: './all-nearby-locations.html',
  styleUrl: './all-nearby-locations.scss',
})
export class AllNearbyLocations implements OnInit {
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
  readonly projectData = signal<any>(null);

  // Subscription tracking for cleanup
  private currentSubscription: Subscription | null = null;



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
          .post<ApiResponse>(`${this.baseUrl}/fetch_nearby_area`, {
            project_id: projectId,
          })
          .pipe(
            tap((res) => {
              this.projectData.set(res.data ? res.data : null);
            }),
            catchError((error) => {
              console.error('Error fetching nearby area:', error);
              const errorMessage = 'Unable to fetch nearby area data.';
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
  ngOnInit(): void {
    // Initialization logic if needed
  }

  fetchProjectStampSignatures(): void {
    const projectId = this.projectID();
    if (!projectId) return;

    this.loading.set(true);
    this.http
      .post<ApiResponse>(`${this.baseUrl}/fetch_nearby_area`, {
        project_id: projectId,
      })
      .pipe(
        tap((res) => {
          this.projectData.set(res.data ? res.data : null);
        }),
        catchError((error) => {
          console.error('Error fetching nearby locations:', error);
          this.projectData.set(null);
          return EMPTY;
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe();
  }


  addProjectLink(
    action: string,
    locationItem?: any
  ): void {
    const dialogData: NearbyLocationDialogData = {
      title:
        action === 'add' ? 'Add Nearby Location' : 'Edit Nearby Location',
      apiUrl: action === 'add' ? 'add_nearby_area' : 'edit_nearby_area',
      projectId: this.projectID(),
      locationData: locationItem,
      action,
    };

    const dialogRef = this.dialog.open(AddEditNearbyLocations, {
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
