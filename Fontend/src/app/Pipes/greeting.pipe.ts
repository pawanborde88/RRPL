import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'greeting',
  standalone: true,
  pure: true
})
export class GreetingPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    
    const hour = new Date().getHours();
    let greeting: string;
    
    if (hour < 12) {
      greeting = 'Good Morning';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }
    
    return `${greeting}, ${value}`;
  }
}
