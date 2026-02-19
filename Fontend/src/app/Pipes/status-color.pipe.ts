import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'statusColor',
  standalone: true,
  pure: true
})
export class StatusColorPipe implements PipeTransform {
  private readonly colorMap: Record<string, string> = {
    'for-sale': '#10b981',
    'sold': '#3b82f6',
    'pending': '#f59e0b',
    'rent': '#8b5cf6'
  };

  transform(status: string | null | undefined): string {
    if (!status) {
      return '#64748b';
    }
    return this.colorMap[status] || '#64748b';
  }
}







































































