import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'priceFormat',
  standalone: true,
  pure: true
})
export class PriceFormatPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  transform(price: number | null | undefined): string {
    if (price == null || isNaN(price)) {
      return '₹0';
    }
    return this.formatter.format(price);
  }
}







































































