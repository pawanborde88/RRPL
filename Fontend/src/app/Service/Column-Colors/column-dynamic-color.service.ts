import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ColumnDynamicColorService {
  // Common color constants
  private readonly LIGHT_GREEN = '#E6FFE6'; // soft mint green
  private readonly LIGHT_RED = '#FFD9D9';   // soft light red
  private readonly DARK_TEXT = '#1F2937';   // dark gray (better than pure black)


  constructor() { }

  /* -------------------- Helpers (INTERNAL) -------------------- */

  private normalize(value: unknown): string {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
  }

  private greenStyle() {
    return { backgroundColor: this.LIGHT_GREEN, color: this.DARK_TEXT };
  }

  private redStyle() {
    return { backgroundColor: this.LIGHT_RED, color: this.DARK_TEXT };
  }

  private matchValue(value: unknown, matches: (string | number | boolean)[]): boolean {
    const normalized = this.normalize(value);
    return matches.some(m => this.normalize(m) === normalized);
  }

  /* -------------------- Imported -------------------- */

  public getImportedCellStyle(value: string | unknown) {
    if (this.matchValue(value, ['yes'])) {
      return this.greenStyle();
    }
    return this.redStyle();
  }

  /* -------------------- Agreement Status -------------------- */

  public getAgreementStatusStyle(status?: number | string): Record<string, string> {
    if (this.matchValue(status, [1, '1', 'done'])) {
      return this.greenStyle();
    }

    if (this.matchValue(status, [0, '0', 'not done'])) {
      return this.redStyle();
    }

    return this.redStyle();
  }

  /* -------------------- Disbursement Status -------------------- */

  public getDisbursementStatusStyle(status?: number | string): Record<string, string> {
    if (this.matchValue(status, [1, '1', 'done'])) {
      return this.greenStyle();
    }

    if (this.matchValue(status, [2, '2', 'pending'])) {
      return this.redStyle();
    }

    return this.redStyle();
  }

  /* -------------------- MIS Agreement Status -------------------- */

  public getMISAgreementStatusStyle(statusId?: number): Record<string, string> {
    if (statusId === 1) {
      return this.greenStyle();
    }
    return this.redStyle();
  }

  /* -------------------- TDS Requirement -------------------- */

  public getTDSRequirementStyle(value: string | unknown): Record<string, string> {
    if (this.matchValue(value, ['yes'])) {
      return this.greenStyle();
    }
    return this.redStyle();
  }

  /* -------------------- MIS Disbursement Status -------------------- */

  public getMISDisbursementStatusStyle(statusId?: number): Record<string, string> {
    if (statusId === 1) {
      return this.greenStyle();
    }
    return this.redStyle();
  }

  /* -------------------- Cheque Status -------------------- */

  public getChequeStatusStyle(status?: number | string): Record<string, string> {
    // 1 = Cleared/Active (good), 0 = Bounced/Inactive (bad)
    if (this.matchValue(status, [1, '1', 'cleared', 'active'])) {
      return this.greenStyle();
    }

    if (this.matchValue(status, [0, '0', 'bounced', 'inactive', 'pending'])) {
      return this.redStyle();
    }

    return this.redStyle();
  }

  /* -------------------- Booking Status -------------------- */

  public getBookingStatusStyle(
    value: boolean | number | string | unknown
  ): Record<string, string> {
    if (
      this.matchValue(value, [true, 1, '1', 'yes'])
    ) {
      return this.greenStyle();
    }

    if (
      this.matchValue(value, [false, 0, '0', 'no'])
    ) {
      return this.redStyle();
    }

    return this.redStyle();
  }
}
