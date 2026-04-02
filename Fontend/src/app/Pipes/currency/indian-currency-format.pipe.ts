import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indianCurrencyFormat',
  standalone: true
})
export class IndianCurrencyFormatPipe implements PipeTransform {

transform(value: number | string): string {
  if (!value) return '₹0';

  value = +value; // Convert to number

  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(2)} Cr`;
  } else if (value >= 100000) {
    return `₹${(value / 100000).toFixed(2)} Lakh`;
  } else {
    return `₹${Math.round(value)}`;
  }
}
   }
  


