import { Injectable, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { AuthService } from '../../../../../../Service/auth.service';
import { BookingFilterPayload } from '../all-bookings.component';

/**
 * Service responsible for building and managing booking filters
 * Follows Single Responsibility Principle
 */
@Injectable({ providedIn: 'root' })
export class BookingFilterService {
  private readonly authService = inject(AuthService);
  private readonly datePipe = new DatePipe('en-US');
  private readonly channelPartnerId = signal<number | null>(null);

  constructor() {
    this.loadChannelPartnerId();
  }

  /**
   * Loads channel partner ID from session storage
   */
  private loadChannelPartnerId(): void {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('channel_partner_id');
      this.channelPartnerId.set(stored ? Number(stored) : null);
    }
  }

  /**
   * Builds filter payload from form values
   * Handles both Date objects (from form) and string dates (from API)
   */
  buildFilterPayload(
    formValues: Partial<Omit<BookingFilterPayload, 'start_date' | 'end_date'> & { start_date?: Date | string | null; end_date?: Date | string | null }>,
    preservedBookingId: number | null
  ): BookingFilterPayload {
    const filters: BookingFilterPayload = {
      ...formValues,
      booking_id: preservedBookingId,
      start_date: formValues.start_date
        ? (typeof formValues.start_date === 'string'
          ? formValues.start_date
          : this.datePipe.transform(formValues.start_date, 'yyyy-MM-dd') ?? null)
        : null,
      end_date: formValues.end_date
        ? (typeof formValues.end_date === 'string'
          ? formValues.end_date
          : this.datePipe.transform(formValues.end_date, 'yyyy-MM-dd') ?? null)
        : null,
    };

    // Add channel partner ID for role 5 users
    if (this.authService.hasOnlyRoles([5])) {
      filters.channel_partner_id = this.channelPartnerId()
        ? [this.channelPartnerId()!]
        : null;
      filters.source_id = 3;
    }
    if (this.authService.hasOnlyRoles([7])) {
      filters.sales_executive_id = this.authService.userId() ? [this.authService.userId()] : null;
    } else {
      filters.sales_executive_id = Array.isArray(formValues.sales_executive_id)
        ? formValues.sales_executive_id
        : (formValues.sales_executive_id ? [formValues.sales_executive_id] : null);
    }
    // Add source ID for role 6 users
    if (this.authService.hasOnlyRoles([6])) {
      filters.source_id = 3;
    }

    return filters;
  }

  /**
   * Builds API payload for ag-grid component
   * Handles both Date objects (from form) and string dates (from API)
   */
  buildAgGridApiPayload(
    formValues: Partial<Omit<BookingFilterPayload, 'start_date' | 'end_date'> & { start_date?: Date | string | null; end_date?: Date | string | null }>,
    preservedBookingId: number | null
  ): { filters: BookingFilterPayload } {
    return {
      filters: this.buildFilterPayload(formValues, preservedBookingId)
    };
  }

  /**
   * Normalizes project ID to array format
   */
  normalizeProjectId(projectId: number | number[] | null): number[] {
    if (!projectId) return [];
    return Array.isArray(projectId)
      ? projectId.filter((id): id is number => id !== null && typeof id === 'number')
      : [projectId];
  }
}

