import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'highlight',
  standalone: true,
})
export class HighlightPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined, searchText: string): SafeHtml {
    if (!value) return '';
    if (!searchText) return value;

    const escaped = searchText.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(escaped, 'gi');
    const replaced = value.replace(re, match => `<mark>${match}</mark>`);

    return this.sanitizer.bypassSecurityTrustHtml(replaced);
  }
} 