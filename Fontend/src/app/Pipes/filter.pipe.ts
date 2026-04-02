import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
  standalone: true,
})
export class FilterPipe implements PipeTransform {

  transform(value: any[], searchTerm: string): any[] {
    if (!value || value.length === 0 || !searchTerm) {
      return value;
    }

    searchTerm = searchTerm.toLowerCase();

    return value.filter((item: any) => {
      return (item.task_name?.toLowerCase().includes(searchTerm) || '') ||
             (item.project_name?.toLowerCase().includes(searchTerm) || '') ||
             (item.message?.toLowerCase().includes(searchTerm) || '');
    });
  }
}
