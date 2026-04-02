import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priceShort',
  standalone: true,
  pure: true
})
export class PriceShortPipe implements PipeTransform {
  transform(price: number | null | undefined): string {
    if (price == null || isNaN(price)) {
      return '₹0';
    }

    // Format in Indian numbering system (Lakhs/Crores)
    if (price >= 10000000) {
      return '₹' + (price / 10000000).toFixed(1) + 'Cr';
    } else if (price >= 100000) {
      return '₹' + (price / 100000).toFixed(1) + 'L';
    } else if (price >= 1000) {
      return '₹' + (price / 1000).toFixed(0) + 'K';
    }
    return '₹' + price.toFixed(0);
  }
}







































































