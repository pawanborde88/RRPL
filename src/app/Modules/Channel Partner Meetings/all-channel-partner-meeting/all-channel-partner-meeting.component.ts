import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, computed, signal, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { AutocompleteReusableComponent } from '../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../Common/template/template.component';
import { TruncatePipe } from '../../../Pipes/truncate.pipe';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, EMPTY, combineLatest, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PreviewImagesComponent } from '../../Setup Files/Projects/preview-images/preview-images.component';
import { ActionEvent } from '../../../Common/Reusable/reusable-table/reusable-table.component';
import { ChannelPartnerMeetingService, MeetingPayload } from './channel-partner-meeting.service';
interface HeaderButton {
  label: string;
  icon: string;
  color: string;
  action: () => void;
  show: () => boolean;
}
@Component({
  selector: 'app-all-channel-partner-meeting',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TemplateComponent,
    BreadcrumbComponent,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TruncatePipe,
    AutocompleteReusableComponent,
    ConfigurableAgGridDataComponent,
  ],
  templateUrl: './all-channel-partner-meeting.component.html',
  styleUrl: './all-channel-partner-meeting.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllChannelPartnerMeetingComponent implements OnInit, OnDestroy {
  private readonly service = inject(ChannelPartnerMeetingService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly roleId = Number(sessionStorage.getItem('role_id'));
  readonly userId = Number(sessionStorage.getItem('session_id'));
  private datePipe: DatePipe = new DatePipe('en-US');

  @ViewChild(ConfigurableAgGridDataComponent) agGridComponent!: ConfigurableAgGridDataComponent;

  // Signals for reactive state management
  readonly loading = signal(false);
  readonly searchText = signal('');
  readonly routeUrl = signal('');
  readonly allCPExecutiveList = signal<any[]>([]);
  readonly allChannelPartnerList = signal<any[]>([]);
  readonly allSalesExecutive = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);
  readonly allSalesExecutiveManager = signal<any[]>([]);
  readonly selectedBooking = signal<any>(null);

  // Refresh trigger for ag-grid
  private readonly refreshTrigger = new Subject<void>();

  // Computed properties for template optimization
  readonly isLoading = computed(() => this.loading());
  readonly hasRouteUrl = computed(() => !!this.routeUrl());
  readonly channelPartnerMeetingForm = new FormGroup({
    project_id: new FormControl<number[] | null>([], [Validators.required]),
    channel_partner_id: new FormControl<number[] | null>([]),
    cp_executive_id: new FormControl<number[] | null>([]),
    source_executive_id: new FormControl<number[] | null>([]),
    sales_executive_id: new FormControl<number[] | null>([]),
    start_date: new FormControl<Date | null>(null),
    end_date: new FormControl<Date | null>(
      new Date(),
    ),
  });

  readonly channelPartnerMeeting = [
    { key: 'created_by_name', label: 'Meeting By' },
    { key: 'created_at', label: 'Meeting At', type: 'date' },
    { key: 'channel_partner', label: 'Channel Partner' },
    { key: 'source_executive', label: 'Sourcing/Sales Executive' },
    { key: 'cp_executive', label: 'CP Executive' },
    { key: 'check_in_time', label: 'Check-In Time' },
    { key: 'check_out_time', label: 'Check-Out Time' },
    {
      key: 'meeting_photo',
      label: 'Meeting Photo',
      type: 'photo',
      nullImage: 'assets/Images/dummy.png',
      clickable: true,
      onClick: (item: any) => this.previewImages(item.meeting_photo),
    },
    { key: 'google_location', label: 'Location', type: 'truncate' },
    { key: 'description', label: 'Description' },
    { key: 'project_name', label: 'Project Name' },
  ];

  previewImages(imageData: any): void {
    const imagesToPreview = imageData
      ? [imageData]
      : ['assets/Images/dummy.png'];

    const dialogRef = this.dialog.open(PreviewImagesComponent, {
      minWidth: '40vw',
      maxWidth: '50vh',
      maxHeight: '100vh',
      data: {
        images: imagesToPreview,
        name: 'meeting_photo',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  constructor() {
    // Constructor is now minimal - reactive logic moved to setupFormSubscriptions
  }

  ngOnInit(): void {
    // Initialize form with default end date
    const defaultEndDate = new Date();
    this.channelPartnerMeetingForm
      .get('end_date')
      ?.setValue(defaultEndDate, { emitEvent: false });

    // Load initial data in parallel
    this.loadInitialData();

    // Setup reactive form subscriptions with proper cleanup
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.refreshTrigger.complete();
  }

  private loadInitialData(): void {
    this.loading.set(true);

    const userId = this.userId;

    // Load all dropdowns in parallel using combineLatest
    combineLatest([
      this.service.fetchProjects(userId),
      this.service.fetchSalesExecutives([7]),
      this.service.fetchSalesExecutives([18]),
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error loading initial data:', error);
          this.snackBar.open('Unable to fetch data. Please try again.', 'Close', {
            duration: 3000,
          });
          return EMPTY;
        }),
        tap(() => this.loading.set(false))
      )
      .subscribe(([projects, salesExecutives, salesManagers]) => {
        this.projectsList.set(projects || []);
        this.allSalesExecutive.set(salesExecutives || []);
        this.allSalesExecutiveManager.set(salesManagers || []);
        this.cdr.markForCheck();
      });
  }

  private setupFormSubscriptions(): void {
    // Channel partner selection with debounce and distinctUntilChanged
    this.channelPartnerMeetingForm
      .get('channel_partner_id')
      ?.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged((prev, curr) => {
          const prevStr = JSON.stringify(prev);
          const currStr = JSON.stringify(curr);
          return prevStr === currStr;
        })
      )
      .subscribe((ids) => {
        if (ids && ids.length > 0) {
          this.loadCPExecutives(ids);
        } else {
          this.allCPExecutiveList.set([]);
          this.channelPartnerMeetingForm.get('cp_executive_id')?.setValue([], { emitEvent: false });
          this.cdr.markForCheck();
        }
      });
  }

  private loadCPExecutives(channelPartnerIDs: number[]): void {
    if (!channelPartnerIDs || channelPartnerIDs.length === 0) {
      this.allCPExecutiveList.set([]);
      return;
    }

    this.loading.set(true);
    this.service
      .fetchCPExecutives(channelPartnerIDs)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error fetching CP executives:', error);
          this.snackBar.open('Unable to fetch CP executives.', 'Close', {
            duration: 3000,
          });
          return EMPTY;
        }),
        tap(() => this.loading.set(false))
      )
      .subscribe((executives) => {
        this.allCPExecutiveList.set(executives || []);
        this.cdr.markForCheck();
      });
  }

  applyFilter(searchText: string): void {
    this.searchText.set(searchText);
    this.fetchMeeting();
  }

  fetchMeeting(): void {
    if (this.agGridComponent) {
      this.agGridComponent.refreshData();
      this.refreshTrigger.next();
    }
  }

  // Memoized payload computation - only recalculates when form values change
  getAgGridPayload(): any {
    const formValue = this.channelPartnerMeetingForm.value;

    // Build filters object - only include non-null/non-empty values
    const filters: any = {};

    if (formValue.project_id && formValue.project_id.length > 0) {
      filters.project_id = formValue.project_id;
    }
    if (formValue.channel_partner_id && formValue.channel_partner_id.length > 0) {
      filters.channel_partner_id = formValue.channel_partner_id;
    }
    if (formValue.cp_executive_id && formValue.cp_executive_id.length > 0) {
      filters.cp_executive_id = formValue.cp_executive_id;
    }
    if (formValue.sales_executive_id && formValue.sales_executive_id.length > 0) {
      filters.sales_executive_id = formValue.sales_executive_id;
    }
    if (formValue.source_executive_id && formValue.source_executive_id.length > 0) {
      filters.source_executive_id = formValue.source_executive_id;
    }
    if (formValue.start_date) {
      const startDate = this.datePipe.transform(formValue.start_date, 'yyyy-MM-dd');
      if (startDate) {
        filters.start_date = startDate;
      }
    }
    if (formValue.end_date) {
      const endDate = this.datePipe.transform(formValue.end_date, 'yyyy-MM-dd');
      if (endDate) {
        filters.end_date = endDate;
      }
    }

    // Return payload structure with filters object
    // Note: offset, limit, and search will be added by the ag-grid component
    return {
      filters: filters,
    };
  }

  onActionClick(action: string, row: any): void {
    if (action === 'preview' && row.meeting_photo) {
      this.previewImages(row.meeting_photo);
    }
  }

  // Computed header buttons to avoid recreating on every change detection
  readonly headerButtons = computed<HeaderButton[]>(() => [
    {
      label: 'Location',
      icon: 'approval',
      color: 'primary',
      disabled: () => this.channelPartnerMeetingForm.get('project_id')?.invalid ?? true,
      action: () => this.fetchRouteUrl(),
      show: () => true,
    },
  ]);

  fetchRouteUrl(): void {
    const payload = { ...this.getAgGridPayload(), route_url: 1 };
    this.loading.set(true);

    this.service
      .fetchRouteUrl(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error fetching route URL:', error);
          this.snackBar.open('Unable to fetch location.', 'Close', {
            duration: 3000,
          });
          return EMPTY;
        }),
        tap(() => this.loading.set(false))
      )
      .subscribe((res) => {
        if (res.route_url) {
          this.routeUrl.set(res.route_url);
          window.open(res.route_url, '_blank');
          this.cdr.markForCheck();
        }
      });
  }

  onselectedMeetingChange(checked: boolean, booking: any): void {
    if (checked) {
      this.selectedBooking.set(booking);
    } else if (this.selectedBooking()?.booking_id === booking.booking_id) {
      this.selectedBooking.set(null);
    }
  }

  onPartnerSearch(searchText: string): void {
    const trimmedSearch = searchText.trim();

    if (trimmedSearch.length <= 3) {
      this.allChannelPartnerList.set([]);
      return;
    }

    this.service
      .searchChannelPartners(trimmedSearch)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((error) => {
          console.error('Error searching channel partners:', error);
          this.snackBar.open('Unable to fetch channel partners.', 'Close', {
            duration: 3000,
          });
          return EMPTY;
        })
      )
      .subscribe((partners) => {
        this.allChannelPartnerList.set(partners || []);
        this.cdr.markForCheck();
      });
  }

  // Getters for template compatibility with signals
  get projectsListValue(): any[] {
    return this.projectsList();
  }

  get allChannelPartnerListValue(): any[] {
    return this.allChannelPartnerList();
  }

  get allCPExecutiveListValue(): any[] {
    return this.allCPExecutiveList();
  }

  get allSalesExecutiveValue(): any[] {
    return this.allSalesExecutive();
  }

  get allSalesExecutiveManagerValue(): any[] {
    return this.allSalesExecutiveManager();
  }

  get loadingValue(): boolean {
    return this.loading();
  }

  get headerButtonsValue(): HeaderButton[] {
    return this.headerButtons();
  }
}
