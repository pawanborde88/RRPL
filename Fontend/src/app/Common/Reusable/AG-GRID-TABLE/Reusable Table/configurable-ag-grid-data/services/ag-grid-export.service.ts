import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../../../../../environments/environment';
import * as XLSX from 'xlsx';
import { TableColumn, TableRowData } from '../../../../reusable-table/reusable-table.component';

export interface ExportOptions {
  endpoint: string;
  method: 'GET' | 'POST';
  payload: Record<string, unknown>;
  columns: readonly TableColumn<any>[];
  filename?: string;
}

/**
 * Service for handling data export functionality
 * Separates export concerns from the main grid component
 */
@Injectable({ providedIn: 'root' })
export class AgGridExportService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /**
   * Export data from server API
   * Returns Observable with HttpResponse containing blob and headers
   */
  exportFromServer(options: ExportOptions): Observable<HttpResponse<Blob>> {
    const url = `${environment.API_URL}/${options.endpoint}`;
    const exportPayload = {
      ...options.payload,
      is_export: true
    };

    const request = options.method === 'GET'
      ? this.http.get(url, { params: exportPayload, responseType: 'blob', observe: 'response' as const })
      : this.http.post(url, exportPayload, { responseType: 'blob', observe: 'response' as const });

    return request.pipe(
      takeUntilDestroyed(this.destroyRef)
    ) as Observable<HttpResponse<Blob>>;
  }

  /**
   * Convert JSON data to CSV and download
   * Uses CSV format with UTF-8 BOM for proper Excel compatibility
   */
  exportJsonToExcel<T extends TableRowData>(
    dataArray: T[],
    columns: readonly TableColumn<T>[],
    filename?: string
  ): void {
    if (!this.isBrowser) {
      console.warn('Export is only available in browser environment');
      return;
    }

    if (!dataArray || !Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('Export failed: No data to export');
    }

    if (!columns || columns.length === 0) {
      throw new Error('Export failed: No columns defined for export');
    }

    const recordCount = dataArray.length;
    console.log(`Exporting ${recordCount.toLocaleString()} records using CSV format with UTF-8 BOM for Excel.`);

    // Use XLSX for better compatibility and proper column width control
    // Ensure filename has .xlsx extension
    let xlsxFilename = filename || this.generateFilename('xlsx');
    if (xlsxFilename) {
      // Replace any existing extension with .xlsx
      xlsxFilename = xlsxFilename.replace(/\.(xlsx|xls|csv|json)$/i, '.xlsx');
      if (!xlsxFilename.toLowerCase().endsWith('.xlsx')) {
        xlsxFilename = xlsxFilename + '.xlsx';
      }
    }
    this.exportToXLSX(dataArray, columns, xlsxFilename);
  }

  /**
   * Export to XLSX format with auto-fitted column widths
   * Provides better formatting control and proper cell fitting
   */
  private exportToXLSX<T extends TableRowData>(
    dataArray: T[],
    columns: readonly TableColumn<T>[],
    filename?: string
  ): void {
    try {
      const exportableColumns = columns.filter(col => col.type !== 'actions');

      if (exportableColumns.length === 0) {
        throw new Error('Export failed: No exportable columns found');
      }

      // Prepare headers
      const headers = exportableColumns.map(col => col.label || col.key);

      // Prepare data rows
      const rows: any[][] = [];
      const maxColumnWidths: number[] = new Array(exportableColumns.length).fill(0);

      // Initialize max widths with header lengths
      headers.forEach((header, idx) => {
        maxColumnWidths[idx] = Math.max(header.length, 10); // Minimum width 10
      });

      // Process data and calculate column widths
      for (let i = 0; i < dataArray.length; i++) {
        const row = dataArray[i];
        const rowData: any[] = [];

        exportableColumns.forEach((col, colIdx) => {
          let value = row[col.key];
          if (value !== undefined && value !== null) {
            value = this.formatExportValue(value, col, i);
          } else {
            value = '';
          }


          // For XLSX, preserve numeric values for amount columns
          if (col.isAmount && typeof value === 'number') {
            rowData.push(value);
          } else {
            // For other columns, format as string and remove tab characters
            let stringValue = String(value);
            if (stringValue.startsWith('\t')) {
              stringValue = stringValue.substring(1); // Remove tab prefix
            }
            rowData.push(stringValue);
          }

          // Update max width for this column (use actual content length)
          const cellLength = String(value).length;
          maxColumnWidths[colIdx] = Math.max(maxColumnWidths[colIdx], cellLength);
        });

        rows.push(rowData);
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Set column widths (auto-fit based on content)
      const columnWidths = maxColumnWidths.map((width, idx) => {
        const col = exportableColumns[idx];
        const key = col.key.toLowerCase();

        // Use a multiplier (1.2) to account for variable font widths and add padding
        // This prevents ######## in Excel
        let calculatedWidth = Math.max(width * 1.2 + 2, 10);

        // Special handling for different column types
        if (col.isPhone || this.isPhoneColumn(col.key)) {
          calculatedWidth = Math.max(calculatedWidth, 18); // Phone numbers need more space
        } else if (col.isAmount) {
          calculatedWidth = Math.max(calculatedWidth, 16); // Amounts need more space
        } else if (col.type === 'date' || col.isDate || key.includes('date') || key.includes('time')) {
          calculatedWidth = Math.max(calculatedWidth, 15); // Dates need consistent width to avoid #######
        } else if (key.includes('email')) {
          calculatedWidth = Math.max(calculatedWidth, 35); // Emails need more space
        } else if (key.includes('remark') || key.includes('status') || key.includes('call') ||
          key.includes('follow') || key.includes('source') || key.includes('detail') || key.includes('comment')) {
          // Long text columns - allow up to 70 characters for better readability
          calculatedWidth = Math.min(Math.max(calculatedWidth, 30), 70);
        } else if (key.includes('name') || key.includes('customer') || key.includes('client') || key.includes('project')) {
          calculatedWidth = Math.max(calculatedWidth, 25); // Names and Project names need adequate space
        } else if (key.includes('config') || key.includes('bhk') || key.includes('type')) {
          calculatedWidth = Math.max(calculatedWidth, 20); // Configuration info
        } else {
          // Default max width for other columns
          calculatedWidth = Math.min(calculatedWidth, 50);
        }

        return { wch: calculatedWidth };
      });

      ws['!cols'] = columnWidths;

      // Set cell styles for phone numbers and large numbers (force text format)
      exportableColumns.forEach((col, colIdx) => {
        const isPhone = col.isPhone || this.isPhoneColumn(col.key);
        const isLargeNumber = exportableColumns[colIdx] && this.isLargeNumericColumn(exportableColumns[colIdx], rows, colIdx);

        if (isPhone || isLargeNumber) {
          // Format header
          const headerCell = XLSX.utils.encode_cell({ r: 0, c: colIdx });
          if (ws[headerCell]) {
            ws[headerCell].z = '@'; // Text format
            ws[headerCell].t = 's'; // String type
          }

          // Format data cells - ensure they're treated as text
          for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
            const cell = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
            if (ws[cell]) {
              // Force text format to prevent scientific notation
              ws[cell].z = '@'; // Number format: @ = text
              ws[cell].t = 's'; // Cell type: s = string
              // Ensure value is stored as string
              if (typeof ws[cell].v === 'number') {
                ws[cell].v = String(ws[cell].v);
                ws[cell].t = 's';
              }
            }
          }
        } else if (col.isAmount) {
          // Format amount columns as numbers with 2 decimal places
          for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
            const cell = XLSX.utils.encode_cell({ r: rowIdx + 1, c: colIdx });
            if (ws[cell]) {
              ws[cell].t = 'n'; // Number type
              ws[cell].z = '#,##0.00'; // Numeric format with 2 decimals
            }
          }
        }
      });

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Generate filename
      const xlsxFilename = filename || this.generateFilename('xlsx');
      const finalFilename = xlsxFilename.toLowerCase().endsWith('.xlsx')
        ? xlsxFilename
        : xlsxFilename.replace(/\.[^/.]+$/, '') + '.xlsx';

      // Write file
      XLSX.writeFile(wb, finalFilename);

      const fileSizeMB = (JSON.stringify(rows).length / 1024 / 1024).toFixed(2);
      console.log(`XLSX export completed: ${dataArray.length.toLocaleString()} records, columns auto-fitted`);
    } catch (error) {
      console.error('Error exporting to XLSX:', error);
      throw new Error(error instanceof Error ? error.message : 'Export failed: Error converting data to XLSX format.');
    }
  }

  /**
   * Export to CSV format with UTF-8 BOM for Excel compatibility
   * Properly handles encoding, quoting, and special characters
   */
  private exportToCSV<T extends TableRowData>(
    dataArray: T[],
    columns: readonly TableColumn<T>[],
    filename?: string
  ): void {
    try {
      const exportableColumns = columns.filter(col => col.type !== 'actions');

      if (exportableColumns.length === 0) {
        throw new Error('Export failed: No exportable columns found');
      }

      // Prepare headers
      const headers = exportableColumns.map(col => col.label || col.key);

      // Build CSV content
      const csvRows: string[] = [];

      // Add header row
      csvRows.push(headers.map(h => this.escapeCSV(h, false)).join(','));

      // Add data rows
      for (let i = 0; i < dataArray.length; i++) {
        const row = dataArray[i];
        const rowData: string[] = [];

        exportableColumns.forEach((col) => {
          let value = row[col.key];
          if (value !== undefined && value !== null) {
            value = this.formatExportValue(value, col, i);
          } else {
            value = '';
          }

          // Format value for CSV
          let stringValue = String(value);

          // Check if this is a phone number or large numeric column
          const isPhone = col.isPhone || this.isPhoneColumn(col.key);
          const isLargeNumber = this.isLargeNumericValue(value);

          // For phone numbers and large numbers, add ="value" to force Excel to treat as text
          if (isPhone || isLargeNumber) {
            // Remove tab prefix if present (from formatPhoneNumber)
            if (stringValue.startsWith('\t')) {
              stringValue = stringValue.substring(1);
            }
            // Use Excel formula to force text: ="value"
            stringValue = `="${stringValue}"`;
          } else {
            // Regular CSV escaping
            stringValue = this.escapeCSV(stringValue, false);
          }

          rowData.push(stringValue);
        });

        csvRows.push(rowData.join(','));
      }

      // Join all rows with newline
      const csvContent = csvRows.join('\r\n');

      // Add UTF-8 BOM for Excel to recognize encoding correctly
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create blob with UTF-8 encoding
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });

      // Generate filename
      const csvFilename = filename || this.generateFilename('csv');
      const finalFilename = csvFilename.toLowerCase().endsWith('.csv')
        ? csvFilename
        : csvFilename.replace(/\.[^/.]+$/, '') + '.csv';

      // Download file
      this.downloadBlob(blob, finalFilename);

      console.log(`CSV export completed: ${dataArray.length.toLocaleString()} records exported with UTF-8 BOM`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error(error instanceof Error ? error.message : 'Export failed: Error converting data to CSV format.');
    }
  }



  /**
   * Escape CSV values (handle commas, quotes, newlines, tabs)
   * @param value - The value to escape
   * @param forceQuote - Force quoting (for phone numbers to prevent Excel scientific notation)
   */
  private escapeCSV(value: string, forceQuote: boolean = false): string {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);

    // Always quote phone numbers to force Excel to treat as text
    // Also quote if value contains comma, quote, newline, or tab
    if (forceQuote ||
      stringValue.includes(',') ||
      stringValue.includes('"') ||
      stringValue.includes('\n') ||
      stringValue.includes('\r') ||
      stringValue.includes('\t')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }


  /**
   * Determine file type from response headers or blob content
   * Prioritizes Content-Type header, then falls back to blob sniffing
   */
  async determineFileType(response: HttpResponse<Blob>): Promise<{ type: 'xlsx' | 'xls' | 'csv' | 'json'; extension: 'xlsx' | 'xls' | 'csv' | 'json' }> {
    const contentType = response.headers.get('content-type')?.toLowerCase();

    // Check Content-Type header first
    if (contentType) {
      if (contentType.includes('csv') || contentType.includes('text/plain')) {
        return { type: 'csv', extension: 'csv' };
      }
      if (contentType.includes('json')) {
        return { type: 'json', extension: 'json' };
      }
      if (contentType.includes('spreadsheetml.sheet')) {
        return { type: 'xlsx', extension: 'xlsx' };
      }
      if (contentType.includes('ms-excel')) {
        return { type: 'xls', extension: 'xls' };
      }
    }

    // Check Content-Disposition header for filename extension
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      if (/\.csv(["';]|$)/i.test(contentDisposition)) return { type: 'csv', extension: 'csv' };
      if (/\.json(["';]|$)/i.test(contentDisposition)) return { type: 'json', extension: 'json' };
      if (/\.xlsx(["';]|$)/i.test(contentDisposition)) return { type: 'xlsx', extension: 'xlsx' };
      if (/\.xls(["';]|$)/i.test(contentDisposition)) return { type: 'xls', extension: 'xls' };
    }

    // Fallback to blob sniffing if headers are inconclusive
    if (response.body) {
      return this.detectFileType(response.body);
    }

    return { type: 'xlsx', extension: 'xlsx' };
  }

  /**
   * Detect file type from blob content
   */
  async detectFileType(blob: Blob): Promise<{ type: 'xlsx' | 'xls' | 'csv' | 'json'; extension: 'xlsx' | 'xls' | 'csv' | 'json' }> {
    try {
      const arrayBuffer = await blob.slice(0, 8).arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // XLSX files start with PK (ZIP format)
      if (uint8Array[0] === 0x50 && uint8Array[1] === 0x4B) {
        return { type: 'xlsx', extension: 'xlsx' };
      }
      // XLS files (BIFF format)
      if (uint8Array[0] === 0xD0 && uint8Array[1] === 0xCF) {
        return { type: 'xls', extension: 'xls' };
      }
      // Check for JSON or CSV
      if (blob.size < 10 * 1024 * 1024) { // Check up to 10MB files
        const text = await blob.slice(0, 100).text();
        const trimmedText = text.trim();
        // Check for BOM (UTF-8 BOM for CSV files opened in Excel)
        if (trimmedText.startsWith('\ufeff') || trimmedText.startsWith('\uFEFF')) {
          return { type: 'csv', extension: 'csv' };
        }
        if (trimmedText.startsWith('{') || trimmedText.startsWith('[')) {
          return { type: 'json', extension: 'json' };
        }
        // Check if it looks like CSV (has commas and newlines)
        if ((text.includes(',') || text.includes(';')) && text.includes('\n')) {
          return { type: 'csv', extension: 'csv' };
        }
      }
      return { type: 'xlsx', extension: 'xlsx' }; // Default
    } catch {
      return { type: 'xlsx', extension: 'xlsx' }; // Default on error
    }
  }

  /**
   * Parse JSON from blob response
   */
  async parseJsonFromBlob(blob: Blob): Promise<any> {
    const text = await blob.text();
    return JSON.parse(text);
  }

  /**
   * Download blob as file
   */
  downloadBlob(blob: Blob, filename: string): void {
    if (!this.isBrowser) return;

    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.visibility = 'hidden';
    link.style.display = 'none';
    document.body.appendChild(link);

    setTimeout(() => {
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
      }, 100);
    }, 0);
  }

  /**
   * Extract filename from Content-Disposition header
   */
  extractFilename(
    contentDisposition: string | null,
    detectedExtension: 'xlsx' | 'xls' | 'csv' | 'json'
  ): string {
    const fallback = this.generateFilename(detectedExtension);

    if (!contentDisposition) {
      return fallback;
    }

    // RFC 6266 / RFC 5987 compatible filename extraction
    const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);

    let filename = '';

    if (filenameStarMatch?.[1]) {
      filename = decodeURIComponent(filenameStarMatch[1]);
    } else if (filenameMatch?.[1]) {
      filename = filenameMatch[1];
    } else {
      return fallback;
    }

    // Remove path traversal just in case
    filename = filename.split('/').pop()!.split('\\').pop()!;

    // Normalize extension to detected type
    const baseName = filename.replace(/\.[^.]+$/, '');
    return `${baseName}.${detectedExtension}`;
  }


  /**
   * Generate default filename with timestamp
   */
  private generateFilename(extension: 'xlsx' | 'xls' | 'csv' | 'json'): string {
    const timestamp = new Date().getTime();
    const dateStr = new Date().toISOString().split('T')[0];
    return `export_${dateStr}_${timestamp}.${extension}`;
  }

  /**
   * Format value for export based on column type
   */
  private formatExportValue(
    value: unknown,
    col: TableColumn<any>,
    index: number
  ): unknown {
    if (col.type === 'date' || col.type === 'short_date' || col.type === 'mediumDate') {
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }
      if (typeof value === 'string') {
        return value.split('T')[0];
      }
    }

    if (col.type === 'index' || col.key === 'serialNo') {
      return index + 1;
    }

    if (col.isAmount) {
      return this.parseNumericValue(value);
    }

    // Handle phone numbers - format as text to prevent Excel scientific notation
    if (col.isPhone || this.isPhoneColumn(col.key)) {
      return this.formatPhoneNumber(value);
    }

    // Handle large numeric values that look like phone numbers or IDs
    if (this.isLargeNumericValue(value)) {
      return this.formatAsText(value);
    }

    return String(value);
  }

  /**
   * Check if column key indicates a phone number column
   */
  private isPhoneColumn(key: string): boolean {
    const phoneKeywords = ['phone', 'mobile', 'contact', 'whatsapp', 'tel', 'number'];
    const lowerKey = key.toLowerCase();
    return phoneKeywords.some(keyword => lowerKey.includes(keyword));
  }

  /**
   * Format phone number as text to prevent Excel scientific notation
   * Uses tab character prefix + quoting to force Excel to treat as text
   */
  private formatPhoneNumber(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let phoneStr: string;

    // If it's a number, convert to string to preserve all digits
    if (typeof value === 'number') {
      // For very large numbers, use toFixed(0) to avoid scientific notation
      if (value >= 1000000000 || value <= -1000000000) {
        phoneStr = value.toFixed(0);
      } else {
        phoneStr = String(value);
      }
    } else {
      phoneStr = String(value);
    }

    // Remove any formatting characters but keep digits
    const digits = phoneStr.replace(/\D/g, '');

    // If we have a valid phone number (10+ digits), format with tab prefix
    // Tab character forces Excel to treat as text when opening CSV
    if (digits.length >= 10) {
      return '\t' + digits;
    }

    return phoneStr;
  }

  /**
   * Check if value is a large number that should be formatted as text
   */
  private isLargeNumericValue(value: unknown): boolean {
    if (typeof value === 'number') {
      // Numbers with 10+ digits (like phone numbers, large IDs) should be text
      return value >= 1000000000 || value <= -1000000000;
    }

    if (typeof value === 'string') {
      // Check if string represents a large number
      const numStr = value.trim().replace(/[,\s]/g, '');
      if (/^\d+$/.test(numStr) && numStr.length >= 10) {
        return true;
      }
    }

    return false;
  }

  /**
   * Format large numeric value as text to prevent Excel scientific notation
   * Uses tab character prefix + quoting to force Excel to treat as text
   */
  private formatAsText(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let numStr: string;

    // If it's a number, convert to string using toFixed to avoid scientific notation
    if (typeof value === 'number') {
      numStr = value.toFixed(0);
    } else {
      numStr = String(value).replace(/[,\s]/g, '');
    }

    // Extract just the digits
    const digits = numStr.replace(/\D/g, '');

    if (digits.length >= 10) {
      // Use tab prefix to force Excel text format
      return '\t' + digits;
    }

    return String(value);
  }

  /**
   * Parse numeric value from formatted string or number
   */
  private parseNumericValue(value: unknown): number {
    if (typeof value === 'number') {
      return isNaN(value) ? 0 : value;
    }

    if (typeof value === 'string') {
      const strValue = value.trim();
      if (/^-?\d+(\.\d+)?$/.test(strValue)) {
        const parsed = parseFloat(strValue);
        return isNaN(parsed) ? 0 : parsed;
      }

      const cleaned = strValue
        .replace(/[₹$€£¥₨₩₦₽₪₫₭₮₯₰₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿]/g, '')
        .replace(/,/g, '')
        .replace(/\s+/g, '')
        .replace(/[^\d.-]/g, '');

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
  }

  /**
   * Check if column contains large numeric values that should be formatted as text
   */
  private isLargeNumericColumn(col: TableColumn<any>, rows: any[][], colIdx: number): boolean {
    // Check if column key suggests it might contain large numbers
    const key = col.key.toLowerCase();
    const largeNumberKeywords = ['id', 'phone', 'mobile', 'contact', 'whatsapp', 'aadhar', 'pan'];

    if (largeNumberKeywords.some(kw => key.includes(kw))) {
      return true;
    }

    // Check sample of actual data values
    const sampleSize = Math.min(10, rows.length);
    for (let i = 0; i < sampleSize; i++) {
      const value = rows[i]?.[colIdx];
      if (value && this.isLargeNumericValue(value)) {
        return true;
      }
    }

    return false;
  }

}
