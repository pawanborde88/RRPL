import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appPANNo]',
  standalone: true
})
export class PANNoDirective {

  constructor(private el: ElementRef, private control: NgControl) { }

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    // Enforce PAN format: 5 letters, 4 digits, 1 letter
    let formattedValue = '';
    for (let i = 0; i < value.length && formattedValue.length < 10; i++) {
      const char = value[i];
      const currentLength = formattedValue.length;
      
      // First 5 characters must be letters
      if (currentLength < 5) {
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      }
      // Next 4 characters must be digits
      else if (currentLength < 9) {
        if (/[0-9]/.test(char)) {
          formattedValue += char;
        }
      }
      // Last character must be a letter
      else if (currentLength === 9) {
        if (/[A-Z]/.test(char)) {
          formattedValue += char;
        }
      }
    }

    // Update both the view and the model
    if (this.control.control) {
      this.control.control.setValue(formattedValue, { emitEvent: false });
    }
    input.value = formattedValue;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    // Allow: backspace, delete, tab, escape, enter, arrow keys
    if ([46, 8, 9, 27, 13, 37, 38, 39, 40].indexOf(event.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true)) {
      return;
    }
    
    // Block further input once 10 characters are reached
    const currentValue = (this.el.nativeElement.value as string).replace(/[^A-Z0-9]/g, '');
    if (currentValue.length >= 10) {
      event.preventDefault();
      return;
    }

    const currentLength = currentValue.length;
    const key = event.key.toUpperCase();
    
    // First 5 characters: only letters allowed
    if (currentLength < 5) {
      if (!/^[A-Z]$/.test(key)) {
        event.preventDefault();
        return;
      }
    }
    // Next 4 characters (positions 5-8): only digits allowed
    else if (currentLength < 9) {
      if (!/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        return;
      }
    }
    // Last character (position 9): only letter allowed
    else if (currentLength === 9) {
      if (!/^[A-Z]$/.test(key)) {
        event.preventDefault();
        return;
      }
    }
  }
}
