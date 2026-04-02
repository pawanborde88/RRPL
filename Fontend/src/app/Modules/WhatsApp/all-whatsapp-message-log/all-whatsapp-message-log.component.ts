import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, Input, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { environment } from '../../../../environments/environment';
import { ConfigurableAgGridDataComponent } from '../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TableColumn } from '../../../Common/Reusable/reusable-table/reusable-table-refactored.types';
import { AuthService } from '../../../Service/auth.service';
import { CommonService } from '../../../Service/common/common.service';
import { TemplateComponent } from '../../../Common/template/template.component';
import { BreadcrumbComponent } from '../../../Common/breadcrumb/breadcrumb.component';
import { FetchFunctionsService } from '../../../Service/fetch-functions.service';

@Component({
  selector: 'app-all-whatsapp-message-log',
  standalone: true,
  imports: [CommonModule,
    RouterModule,
    CommonModule,
    RouterModule,
    ConfigurableAgGridDataComponent,
    TemplateComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './all-whatsapp-message-log.component.html',
  styleUrl: './all-whatsapp-message-log.component.scss'
})
export class AllWhatsappMessageLogComponent {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fetch = inject(FetchFunctionsService);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);
  private readonly destroyRef = inject(DestroyRef);

  readonly baseUrl = environment.API_URL;
  readonly storageUrl = environment.STORAGE_URL;
  readonly userId = this.authService.userId();
  @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

  // Signals for state management
  readonly loading = signal<boolean>(false);
  readonly allWingslist = signal<any[]>([]);
  readonly projectsList = signal<any[]>([]);
  readonly FloorUnitDropdown = signal<any[]>([]);

  // Form signal for reactive payload
  private readonly formValues = signal<any>({});

  @Input() agreementStatus: number = 1;
  @Input() active: boolean = false;

  readonly bookingForm = new FormGroup({
    project_id: new FormControl(null, Validators.required),
    wing_id: new FormControl(null, Validators.required),

  });

  readonly whatsappMessageColumns: (TableColumn & { claimedOnly?: boolean })[] = [

    // 👤 Customer / Sender Info
    { key: 'customer_name', label: 'Customer Name' },

    { key: 'sender_name', label: 'Sender Name' },

    // 📞 WhatsApp Details

    // 💬 Message Content
    { key: 'message_type', label: 'Message Type' },
    {
      key: 'message_text',
      label: 'Message',
    },

    // ⏱ Dates & Time
    {
      key: 'message_timestamp',
      label: 'Message Time',
    },
    {
      key: 'date',
      label: 'Message Date',
      type: 'mediumDate'
    },


    // 🏷 Source & Module
    { key: 'module', label: 'Module' },
    { key: 'source', label: 'Source' },
    { key: 'source_detail', label: 'Source Detail' },

    // 👮 System
    {
      key: 'created_at',
      label: 'Created At',
      type: 'date'
    },
  ];




  // Computed signal for AG Grid payload
  readonly agGridPayload = computed(() => {
    const values = this.formValues();
    const filters: any = {};

    if (values.project_id) filters.project_id = values.project_id;
    if (values.wing_id) filters.wing_id = values.wing_id;

    return { filters };
  });







  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();

    this.bookingForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateFormValues());
  }

  fetchAllBookings(): void {
    this.updateFormValues();
    this.agGridTable?.refreshData();
  }

  private updateFormValues(): void {
    this.formValues.set(this.bookingForm.value);
  }

  private loadInitialData(): void {
    this.commonService.fetchUserProjectDropdown(this.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res: any) => {
          if (res) this.projectsList.set(res);
        },
        error: () => this.showError('Unable to fetch projects.')
      });
  }

  private setupFormSubscriptions(): void {
    this.bookingForm.get('project_id')?.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(id => !!id)
      )
      .subscribe(projectID => {
        this.fetchAllWings(projectID);
        // Reset wing when project changes
        this.bookingForm.get('wing_id')?.setValue(null);
      });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', { duration: 3000 });
  }




  fetchAllWings(projectID: any): void {
    this.commonService.fetchWingDropdown(projectID)
      .subscribe({
        next: (res: any) => {
          this.allWingslist.set(res);
        },
        error: () => {
          this.showError('Unable to fetch wings.');
        },
      });
  }
  selectedBooking: any = null; // Change from selectedBookingId to selectedBooking

  onBookingSelectionChange(checked: boolean, booking: any) {
    if (checked) {
      this.selectedBooking = booking;
      console.log('Selected booking:', this.selectedBooking);
    } else {
      // Deselect if the currently selected booking is unchecked
      if (
        this.selectedBooking &&
        this.selectedBooking.floor_rise_id === booking.floor_rise_id
      ) {
        this.selectedBooking = null;
      }
    }
  }


}
