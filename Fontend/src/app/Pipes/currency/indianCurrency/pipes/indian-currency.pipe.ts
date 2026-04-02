import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indianCurrency',
  standalone: true
})
export class IndianCurrencyPipe implements PipeTransform {

  transform(value: number | string | null | undefined, showZero: boolean = true): string {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      return showZero ? '₹0' : '-';
    }

    // Convert string to number if needed
    const num = typeof value === 'string' ? parseFloat(value) : value;

    // Handle NaN cases
    if (isNaN(num)) {
      return '-';
    }

    // Format as Indian Rupees
    return '' + num.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
}
