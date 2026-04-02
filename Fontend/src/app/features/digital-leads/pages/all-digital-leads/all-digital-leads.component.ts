import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal, ViewChild, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { AngularMaterialModule } from '../../../../../angular-material.module';
import { environment } from '../../../../../environments/environment';
import { ActionColumnComponent } from '../../../../Common/action-column/action-column.component';
import { AutocompleteReusableComponent } from '../../../../Common/autocomplete-reusable-component/autocomplete-reusable-component.component';
import { BreadcrumbComponent } from '../../../../Common/breadcrumb/breadcrumb.component';
import { ConfigurableAgGridDataComponent } from '../../../../Common/Reusable/AG-GRID-TABLE/Reusable Table/configurable-ag-grid-data/configurable-ag-grid-data.component';
import { TemplateComponent } from '../../../../Common/template/template.component';
import { AuthService } from '../../../../Service/auth.service';
import { AddDigitalLeadDialogComponent } from '../../../../Modules/Facebook/Digital Lead/add-digital-lead-dialog/add-digital-lead-dialog.component';
import { DigitalLeadsStore } from '../../store/digital-leads.store';

@Component({
    selector: 'app-all-digital-leads',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TemplateComponent,
        BreadcrumbComponent,
        AngularMaterialModule,
        FormsModule,
        ReactiveFormsModule,
        AutocompleteReusableComponent,
        ConfigurableAgGridDataComponent,
        ActionColumnComponent,
    ],
    templateUrl: './all-digital-leads.component.html',
    styleUrl: './all-digital-leads.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DatePipe],
})
export class AllDigitalLeadsComponent implements OnInit {
    private readonly dialog = inject(MatDialog);
    private readonly snackBar = inject(MatSnackBar);
    private readonly authService = inject(AuthService);
    private readonly store = inject(DigitalLeadsStore);
    private readonly destroyRef = inject(DestroyRef);

    readonly baseUrl = environment.API_URL;
    readonly storageUrl = environment.STORAGE_URL;
    readonly userId = this.authService.userId();

    @ViewChild(ConfigurableAgGridDataComponent) agGridTable!: ConfigurableAgGridDataComponent<any>;

    // Store Signals
    readonly projectsList = this.store.projects;
    readonly loading = this.store.isLoading;

    // Local State Signals
    readonly formValues = signal<any>({});
    readonly selectedBooking = signal<any>(null);

    readonly bookingForm = new FormGroup({
        project_id: new FormControl(null, Validators.required),
        wing_id: new FormControl(null),
    });

    readonly agreementDetailsColumnsNames = [
        { key: 'property_name', label: 'Property Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'link', label: 'API Link' },
        { key: 'request_data', label: 'Request Data' },
        { key: 'total_lead', label: 'Total Lead' },
        { key: 'created_at', label: 'Created At', type: 'date' }
    ] as const;

    // Computed signal for AG Grid payload
    readonly agGridPayload = computed(() => {
        const values = this.formValues();
        const filters: any = {};

        if (values.project_id) filters.project_id = values.project_id;
        if (values.wing_id) filters.wing_id = values.wing_id;

        return { filters };
    });

    readonly headerButtons = [
        {
            label: 'Add Digital Lead',
            icon: 'add_circle',
            color: 'primary',
            disabled: () => false,
            action: () => this.openAddEditFloorRiseDialog(),
            show: () => true,
        },
    ];

    constructor() {
        // Effect to log selection changes if needed
        effect(() => {
            // any side effects
        });
    }

    ngOnInit(): void {
        this.store.loadProjects(this.userId);
    }

    fetchAllBookings(): void {
        this.updateFormValues();
        this.agGridTable?.refreshData();
    }

    private updateFormValues(): void {
        this.formValues.set(this.bookingForm.value);
        this.store.updateFilters(this.bookingForm.value);
    }

    openAddEditFloorRiseDialog(data: any = null): void {
        const dialogRef = this.dialog.open(AddDigitalLeadDialogComponent, {
            maxWidth: '50vw',
            disableClose: false,
            data: data ? { floorRiseID: data } : null,
        });

        dialogRef.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((result) => {
            if (result) {
                this.agGridTable.refreshData();
            }
        });
    }

    onBookingSelectionChange(checked: boolean, booking: any) {
        if (checked) {
            this.selectedBooking.set(booking);
            console.log('Selected booking:', booking);
        } else {
            const current = this.selectedBooking();
            if (current && current.floor_rise_id === booking.floor_rise_id) {
                this.selectedBooking.set(null);
            }
        }
    }

    // kept for compatibility if used by template
    onBookingAction(action: string, row: any): void {
        // ... implementation if needed
    }
}
