import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';

import { Router, RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { TruncatePipe } from '../../../../Pipes/truncate.pipe';
import { FetchFunctionsService } from '../../../../Service/fetch-functions.service';
import { ConfirmDialogComponent } from '../../../../Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { AddhUpcomingEventsComponent } from '../addh-upcoming-events/addh-upcoming-events.component';
import { AuthService } from '../../../../Service/auth.service';

@Component({
  selector: 'app-fetch-upcoming-events',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe, // Add the pipe here
  ],
  templateUrl: './fetch-upcoming-events.component.html',
  styleUrl: './fetch-upcoming-events.component.scss',
})
export class FetchUpcomingEventsComponent implements OnInit {
  baseUrl = environment.API_URL;
  loading: boolean = false; // Initialize loading state
  storageUrl = environment.STORAGE_URL;
  allEvents: any[] = [];
  filteredEvents: any[] = [];
  roleId = Number(sessionStorage.getItem('role_id'));
  userId = Number(sessionStorage.getItem('session_id'));
  accountID = Number(sessionStorage.getItem('account_id'));
  pipe = new DatePipe('en-US');
  private readonly authService = inject(AuthService);

  filterForm = new FormGroup({
    start_date: new FormControl(null),
    end_date: new FormControl(null),
    searchTerm: new FormControl(''),
  });

  @ViewChild(MatSort)
  sort!: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator | null = null;
  filteredCount: number = 0;
  constructor(
    private http: HttpClient,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fetch: FetchFunctionsService,
    private router: Router
  ) { }
  ngOnInit(): void {
    this.filterForm
      .get('searchTerm')
      ?.valueChanges.pipe(debounceTime(200), distinctUntilChanged())
      .subscribe(() => this.filterEvents());

    // Auto-fetch when dates change
    this.filterForm.get('start_date')?.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
      if (this.filterForm.get('start_date')?.value) {
        this.fetchAllUpcomingEvents();
      }
    });

    this.filterForm.get('end_date')?.valueChanges.pipe(debounceTime(500), distinctUntilChanged()).subscribe(() => {
      if (this.filterForm.get('end_date')?.value) {
        this.fetchAllUpcomingEvents();
      }
    });

    this.fetchAllUpcomingEvents();
  }

  fetchAllUpcomingEvents(): void {
    try {
      this.loading = true;
      const payload: any = {
        account_id: this.accountID,
      };

      const startDate = this.filterForm.get('start_date')?.value;
      const endDate = this.filterForm.get('end_date')?.value;

      if (startDate) {
        payload.start_date = this.pipe.transform(startDate, 'yyyy-MM-dd');
      }
      if (endDate) {
        payload.end_date = this.pipe.transform(endDate, 'yyyy-MM-dd');
      }

      this.http
        .post(`${this.baseUrl}/fetch_event`, {
          ...payload,
        })
        .subscribe({
          next: (res: any) => {
            console.log('Event Response:', res);
            this.loading = false;
            let events: any[] = [];

            if (res?.data && Array.isArray(res.data)) {
              events = res.data;
            } else if (Array.isArray(res)) {
              events = res;
            } else if (res?.data) {
              events = [res.data];
            } else if (res && typeof res === 'object' && !res.status) {
              events = [res];
            }

            this.allEvents = events
              .filter(Boolean)
              .map((event) => ({
                ...event,
                is_highlight:
                  event?.is_highlight === 1 || event?.is_highlight === '1',
              }));
            this.filterEvents();
          },
          error: (err: any) => {
            console.error('Fetch Event Error:', err);
            this.loading = false;
            this.snackBar.open('Unable to fetch Event.', 'Close', {
              duration: 3000,
            });
          },
        });
    } catch (error) {
      console.error('Error in fetchAllUpcomingEvents:', error);
      this.loading = false;
    }
  }

  applyFilter(): void {
    this.fetchAllUpcomingEvents();
  }

  resetFilter(): void {
    this.filterForm.reset();
    this.fetchAllUpcomingEvents();
  }

  private filterEvents(): void {
    const searchTerm = (
      this.filterForm.get('searchTerm')?.value ?? ''
    )
      .toString()
      .toLowerCase()
      .trim();

    let events = [...this.allEvents];

    if (searchTerm) {
      events = events.filter((event) => {
        const title = event?.event_title?.toString().toLowerCase() ?? '';
        const venue = event?.event_venue?.toString().toLowerCase() ?? '';
        return title.includes(searchTerm) || venue.includes(searchTerm);
      });
    }

    this.filteredEvents = events;
  }


  addEvent(action: string, row?: any): void {
    const dialogRef = this.dialog.open(AddhUpcomingEventsComponent, {
      minWidth: '50vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        title: action === 'add' ? 'Add Event' : 'Edit Event',
        apiUrl: action === 'add' ? 'add_event' : 'edit_event',
        successMessage: action === 'add' ? 'Event added successfully' : 'Event updated successfully',
        rowData: row,  // Pass row data if editing
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.fetchAllUpcomingEvents(); // Refresh the list if data was modified
      }
    });
  }
  goToEventRegistration(eventId: number) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/events/event-registration', eventId])
    );
    window.open(url, '_blank');
  }

  goToEventLog(eventId: number) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/events/all-events-user-log'], {
        queryParams: { event_id: eventId }
      })
    );

    window.open(url, '_blank');
  }
  readonly hasPermission = (permission: string): boolean =>
    this.authService.hasPermission(permission);

  readonly hasOnlyRoles = (allowedRoles: number[]): boolean =>
    this.authService.hasOnlyRoles(allowedRoles);
}
