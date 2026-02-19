import { Injectable, signal, computed } from '@angular/core';
import { TableColumn } from '../../../../../Common/Reusable/reusable-table/reusable-table.component';

@Injectable({
    providedIn: 'root'
})
export class BookingUpdatedLogFacade {

    // State
    private readonly _bookingId = signal<string | null>(null);

    // Computeds
    readonly bookingId = this._bookingId.asReadonly();

    readonly gridPayload = computed(() => {
        const id = this._bookingId();
        return { booking_id: id };
    });

    // Actions
    setBookingId(data: any): void {
        const id = (typeof data === 'object' && data !== null) ? data.booking_id : data;
        if (id) {
            this._bookingId.set(id);
        }
    }

    readonly apiEndpoint = 'fetch_booking_logs';


    // Column Definitions
    readonly columns: readonly TableColumn[] = [

        {
            key: 'unit_details',
            label: 'Unit Details',
            headerClass: 'bg-project-info',
            cellClass: 'bg-project-info',
            children: [


                {
                    key: 'unit_type',
                    label: 'Unit Type',
                    headerClass: 'bg-project-info',
                    cellClass: 'bg-project-info',
                    children: [
                        { key: 'changed_fields.unit_type.old', label: 'Previous', headerClass: 'bg-project-info', cellClass: 'bg-project-info' },
                        { key: 'changed_fields.unit_type.new', label: 'Current', headerClass: 'bg-project-info', cellClass: 'bg-project-info' }
                    ]
                },
                {
                    key: 'carpet',
                    label: 'Carpet Area',
                    headerClass: 'bg-project-info',
                    cellClass: 'bg-project-info',
                    children: [
                        { key: 'changed_fields.carpet.old', label: 'Previous', headerClass: 'bg-project-info', cellClass: 'bg-project-info' },
                        { key: 'changed_fields.carpet.new', label: 'Current', headerClass: 'bg-project-info', cellClass: 'bg-project-info' }
                    ]
                }
            ]
        },
        {
            key: 'pricing',
            label: 'Pricing',
            headerClass: 'bg-booking-details',
            cellClass: 'bg-booking-details',
            children: [
                {
                    key: 'rate',
                    label: 'Rate',
                    headerClass: 'bg-booking-details',
                    cellClass: 'bg-booking-details',
                    children: [
                        { key: 'changed_fields.rate.old', label: 'Previous', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
                        { key: 'changed_fields.rate.new', label: 'Current', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' }
                    ]
                },
                {
                    key: 'basic_cost',
                    label: 'Basic Cost',
                    headerClass: 'bg-booking-details',
                    cellClass: 'bg-booking-details',
                    children: [
                        { key: 'changed_fields.basic_cost.old', label: 'Previous', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
                        { key: 'changed_fields.basic_cost.new', label: 'Current', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' }
                    ]
                },
                {
                    key: 'idc',
                    label: 'IDC',
                    headerClass: 'bg-booking-details',
                    cellClass: 'bg-booking-details',
                    children: [
                        { key: 'changed_fields.idc.old', label: 'Previous', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
                        { key: 'changed_fields.idc.new', label: 'Current', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' }
                    ]
                },
                {
                    key: 'agreement_cost',
                    label: 'Agreement Cost',
                    headerClass: 'bg-booking-details',
                    cellClass: 'bg-booking-details',
                    children: [
                        { key: 'changed_fields.agreement_cost.old', label: 'Previous', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
                        { key: 'changed_fields.agreement_cost.new', label: 'Current', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' }
                    ]
                },
                {
                    key: 'package_total',
                    label: 'Package Total',
                    headerClass: 'bg-booking-details',
                    cellClass: 'bg-booking-details',
                    children: [
                        { key: 'changed_fields.package_total.old', label: 'Previous', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
                        { key: 'changed_fields.package_total.new', label: 'Current', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' }
                    ]
                },
                {
                    key: 'floor_rise_amt',
                    label: 'Floor Rise Amount',
                    headerClass: 'bg-booking-details',
                    cellClass: 'bg-booking-details',
                    children: [
                        { key: 'changed_fields.floor_rise_amt.old', label: 'Previous', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' },
                        { key: 'changed_fields.floor_rise_amt.new', label: 'Current', isAmount: true, headerClass: 'bg-booking-details', cellClass: 'bg-booking-details' }
                    ]
                }
            ]
        },
        {
            key: 'govt_taxes',
            label: 'Government Taxes',
            headerClass: 'bg-gov-taxes',
            cellClass: 'bg-gov-taxes',
            children: [
                {
                    key: 'gst',
                    label: 'GST',
                    headerClass: 'bg-gov-taxes',
                    cellClass: 'bg-gov-taxes',
                    children: [
                        { key: 'changed_fields.gst.old', label: 'Previous', isAmount: true, headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
                        { key: 'changed_fields.gst.new', label: 'Current', isAmount: true, headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' }
                    ]
                },
                {
                    key: 'sd_per',
                    label: 'SD %',
                    headerClass: 'bg-gov-taxes',
                    cellClass: 'bg-gov-taxes',
                    children: [
                        { key: 'changed_fields.sd_per.old', label: 'Previous', isAmount: true, headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
                        { key: 'changed_fields.sd_per.new', label: 'Current', isAmount: true, headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' }
                    ]
                },
                {
                    key: 'stamp_duty',
                    label: 'Stamp Duty',
                    headerClass: 'bg-gov-taxes',
                    cellClass: 'bg-gov-taxes',
                    children: [
                        { key: 'changed_fields.stamp_duty.old', label: 'Previous', isAmount: true, headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
                        { key: 'changed_fields.stamp_duty.new', label: 'Current', isAmount: true, headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' }
                    ]
                },
                {
                    key: 'reg',
                    label: 'Registration',
                    headerClass: 'bg-gov-taxes',
                    cellClass: 'bg-gov-taxes',
                    children: [
                        { key: 'changed_fields.reg.old', label: 'Previous', isAmount: true, headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' },
                        { key: 'changed_fields.reg.new', label: 'Current', isAmount: true, headerClass: 'bg-gov-taxes', cellClass: 'bg-gov-taxes' }
                    ]
                }
            ]
        },
        {
            key: 'additional_charges',
            label: 'Additional Charges',
            headerClass: 'bg-additional-charges',
            cellClass: 'bg-additional-charges',
            children: [
                {
                    key: 'legal',
                    label: 'Legal Charges',
                    headerClass: 'bg-additional-charges',
                    cellClass: 'bg-additional-charges',
                    children: [
                        { key: 'changed_fields.legal.old', label: 'Previous', isAmount: true, headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
                        { key: 'changed_fields.legal.new', label: 'Current', isAmount: true, headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' }
                    ]
                },
                {
                    key: 'maintenance',
                    label: 'Maintenance',
                    headerClass: 'bg-additional-charges',
                    cellClass: 'bg-additional-charges',
                    children: [
                        { key: 'changed_fields.maintenance.old', label: 'Previous', isAmount: true, headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
                        { key: 'changed_fields.maintenance.new', label: 'Current', isAmount: true, headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' }
                    ]
                },
                {
                    key: 'society_for',
                    label: 'Society Formation',
                    headerClass: 'bg-additional-charges',
                    cellClass: 'bg-additional-charges',
                    children: [
                        { key: 'changed_fields.society_for.old', label: 'Previous', isAmount: true, headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' },
                        { key: 'changed_fields.society_for.new', label: 'Current', isAmount: true, headerClass: 'bg-additional-charges', cellClass: 'bg-additional-charges' }
                    ]
                }
            ]
        },
        {
            key: 'booking_info',
            label: 'Booking Info',
            headerClass: 'bg-other-summary',
            cellClass: 'bg-other-summary',
            children: [
                {
                    key: 'booking_date',
                    label: 'Booking Date',
                    headerClass: 'bg-other-summary',
                    cellClass: 'bg-other-summary',
                    children: [
                        { key: 'changed_fields.booking_date.old', label: 'Previous', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' },
                        { key: 'changed_fields.booking_date.new', label: 'Current', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' }
                    ]
                },
                {
                    key: 'remark',
                    label: 'Remark',
                    headerClass: 'bg-other-summary',
                    cellClass: 'bg-other-summary',
                    children: [
                        { key: 'changed_fields.remark.old', label: 'Previous', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' },
                        { key: 'changed_fields.remark.new', label: 'Current', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' }
                    ]
                },
                {
                    key: 'agreement_status_id',
                    label: 'Agreement Status',
                    headerClass: 'bg-other-summary',
                    cellClass: 'bg-other-summary',
                    children: [
                        { key: 'changed_fields.agreement_status_id.old', label: 'Previous', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' },
                        { key: 'changed_fields.agreement_status_id.new', label: 'Current', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' }
                    ]
                },
                {
                    key: 'updated_by_name',
                    label: 'Updated By',
                    headerClass: 'bg-other-summary',
                    cellClass: 'bg-other-summary',
                    children: [
                        { key: 'changed_fields.updated_by_name.old', label: 'Previous', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' },
                        { key: 'changed_fields.updated_by_name.new', label: 'Current', headerClass: 'bg-other-summary', cellClass: 'bg-other-summary' }
                    ]
                }
            ]
        }

    ] as const;

}
