import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { AngularMaterialModule } from '../../../../angular-material.module';
import { ClipboardModule } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-view-info-mob-email',
  standalone: true,
  imports: [
    CommonModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    ClipboardModule,
  ],
  templateUrl: './view-info-mob-email.component.html',
  styleUrl: './view-info-mob-email.component.scss',
})
export class ViewInfoMobEmailComponent implements OnInit {
  errorMessage: string | null = null;
  icon = 'info';
  displayValue: string = '';
  isEmpty: boolean = false;
  rawValue: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { title: string; value: string | number; call_masking_id?: number | string; data?: any },
    private dialogRef: MatDialogRef<ViewInfoMobEmailComponent>
  ) { }

  ngOnInit(): void {
    // Convert value to string to handle both string and number types
    const valueStr = this.data.value != null ? String(this.data.value) : '';
    this.rawValue = valueStr;
    console.log(this.data);

    // Get roleId from sessionStorage
    const roleId = Number(sessionStorage.getItem('role_id'));

    // If roleId is not 2, check for required assignments (telecaller_id or source_executive_id)
    if (roleId !== 2 && this.data.data) {
      const data = this.data.data;

      // Hide if telecaller_id is present but empty
      const isTelecallerEmpty = data.telecaller_id !== undefined &&
        Array.isArray(data.telecaller_id) &&
        data.telecaller_id.length === 0;

      // Hide if source_executive_id is present and is 0 or null
      const isSourceExecutiveEmpty = data.sales_executive_id !== undefined &&
        (data.sales_executive_id === null || Number(data.sales_executive_id) === 0);

      if (isTelecallerEmpty || isSourceExecutiveEmpty) {
        this.isEmpty = true;
        this.displayValue = '';
        return;
      }
    }

    // Check if value is empty, null, or undefined
    if (!valueStr || valueStr.trim() === '') {
      this.isEmpty = true;
      this.displayValue = '';
      return;
    }

    // Determine appropriate icon based on title.
    const title = this.data.title.toLowerCase();
    if (title.includes('mobile') || title.includes('phone') || title.includes('whatsapp')) {
      this.icon = 'smartphone';
    } else if (title.includes('email')) {
      this.icon = 'mail';
    }

    // If roleId is 2, display value directly without masking
    if (roleId === 2) {
      this.displayValue = valueStr;
    } else {
      // Apply masking if call_masking_id is 1 (check both number and string)
      const maskingId = Number(this.data.call_masking_id);
      const shouldMask = maskingId === 1;

      if (shouldMask) {
        if (title.includes('mobile') || title.includes('phone') || title.includes('whatsapp')) {
          this.displayValue = this.maskMobileNumber(valueStr);
        } else if (title.includes('email')) {
          this.displayValue = this.maskEmail(valueStr);
        } else {
          this.displayValue = valueStr;
        }
      } else {
        this.displayValue = valueStr;
      }
    }

    // Check if displayValue is empty after processing
    if (!this.displayValue || this.displayValue.trim() === '') {
      this.isEmpty = true;
    }
  }

  /**
   * Masks mobile number in format: +91 80XXXXXX45 or 80XXXXXX45
   * Handles different country codes and number formats
   */
  maskMobileNumber(mobile: string): string {
    if (!mobile) return '';

    const mobileStr = mobile.toString();
    const hasPlusPrefix = mobileStr.startsWith('+');

    // Remove any existing formatting but preserve + if present
    const cleaned = mobileStr.replace(/\D/g, '');

    // If number is 10 digits or less, mask it directly
    if (cleaned.length <= 10) {
      if (cleaned.length < 4) {
        return mobile; // Return original if too short to mask
      }
      const firstTwo = cleaned.substring(0, 2);
      const lastTwo = cleaned.substring(cleaned.length - 2);
      const prefix = hasPlusPrefix ? '+' : '';
      return `${prefix}${firstTwo}XXXXXX${lastTwo}`;
    }

    // For numbers longer than 10 digits, likely has country code
    // Show first 2 digits (could be country code start), then mask, then last 2 digits
    const firstTwo = cleaned.substring(0, 2);
    const lastTwo = cleaned.substring(cleaned.length - 2);
    const maskedLength = cleaned.length - 4;
    const prefix = hasPlusPrefix ? '+' : '';

    // For numbers with country code, try to show country code + first 2 of local number
    // Common country codes: 1-3 digits, so if length > 12, likely has country code
    if (cleaned.length > 12) {
      // Likely format: country code (1-3 digits) + local number
      // Show country code + first 2 of local number, then mask, then last 2
      const countryCodeLength = cleaned.length > 13 ? 3 : cleaned.length > 11 ? 2 : 1;
      const countryCode = cleaned.substring(0, countryCodeLength);
      const localFirstTwo = cleaned.substring(countryCodeLength, countryCodeLength + 2);
      const localLastTwo = cleaned.substring(cleaned.length - 2);
      return `${prefix}${countryCode} ${localFirstTwo}XXXXXX${localLastTwo}`;
    }

    // For 11-12 digit numbers, show first 2 and last 2 with masking
    return `${prefix}${firstTwo}XXXXXX${lastTwo}`;
  }

  /**
   * Masks email in format: pa****@gmail.com
   * Shows first 2 characters, then asterisks, then @domain
   */
  maskEmail(email: string): string {
    if (!email) return '';

    const emailStr = email.toString();
    const atIndex = emailStr.indexOf('@');

    if (atIndex === -1) {
      // Not a valid email format, mask the whole thing
      if (emailStr.length <= 2) {
        return emailStr;
      }
      return emailStr.substring(0, 2) + '****';
    }

    const localPart = emailStr.substring(0, atIndex);
    const domain = emailStr.substring(atIndex);

    if (localPart.length <= 2) {
      return localPart + '****' + domain;
    }

    return localPart.substring(0, 2) + '****' + domain;
  }

  isCopied: boolean = false;

  /**
   * Handle copy event to show feedback
   */
  onCopied() {
    this.isCopied = true;
    setTimeout(() => {
      this.isCopied = false;
    }, 2000);
  }


}
