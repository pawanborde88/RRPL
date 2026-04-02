import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'customDate',
  standalone: true
})
export class CustomDatePipe implements PipeTransform {

  transform(value: any, format: string = 'yyyy-MM-dd'): string | null {
    if (!value) return null;

    const date = new Date(value);

    // Ensure the date is valid
    if (isNaN(date.getTime())) {
      return null;
    }

    // Format the date to 'yyyy-MM-dd'
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // months are 0-based
    const day = date.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

}
