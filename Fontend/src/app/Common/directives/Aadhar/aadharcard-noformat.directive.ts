import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appAadharcardNoformat]',
  standalone: true
})
export class AadharcardNoformatDirective {
  constructor(
    private el: ElementRef<HTMLInputElement>,
    private control: NgControl
  ) { }

  @HostListener('input')
  onInput() {
    const input = this.el.nativeElement;

    // Extract digits only
    let digits = input.value.replace(/\D/g, '').substring(0, 12);

    // Format XXXX-XXXX-XXXX
    const formatted = digits.match(/.{1,4}/g)?.join('-') ?? '';

    // Update model & view
    this.control.control?.setValue(formatted, { emitEvent: false });
    input.value = formatted;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
    ];

    if (
      allowedKeys.includes(event.key) ||
      (event.ctrlKey && ['a', 'c', 'v', 'x'].includes(event.key.toLowerCase()))
    ) {
      return;
    }

    // Allow digits only
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Prevent more than 12 digits
    const digits = this.el.nativeElement.value.replace(/\D/g, '');
    if (digits.length >= 12) {
      event.preventDefault();
    }
  }
}
