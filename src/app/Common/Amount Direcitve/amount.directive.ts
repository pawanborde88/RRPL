import {
  Directive,
  ElementRef,
  HostListener,
  forwardRef,
  AfterViewInit,
  OnInit,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Directive({
  selector: '[appAmount]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AmountDirective),
      multi: true,
    },
  ],
})
export class AmountDirective implements ControlValueAccessor, AfterViewInit, OnInit {
  private el: HTMLInputElement;
  private currentRawValue = '';
  private isFocused = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private elementRef: ElementRef<HTMLInputElement>) {
    this.el = this.elementRef.nativeElement;
  }

  ngOnInit(): void {
    // Change input type to 'text' to allow formatted values with commas
    // Number inputs don't accept formatted values like "24,500"
    // Do this in ngOnInit to ensure it happens early, before Angular Material processes it
    if (this.el.type === 'number' || this.el.getAttribute('type') === 'number') {
      this.el.type = 'text';
      // Add inputmode for mobile keyboards to show numeric keypad
      this.el.setAttribute('inputmode', 'decimal');
    }
  }

  ngAfterViewInit(): void {
    // Double-check that type is 'text' (Material might have changed it back)
    if (this.el.type === 'number' || this.el.getAttribute('type') === 'number') {
      this.el.type = 'text';
      this.el.setAttribute('inputmode', 'decimal');
    }

    // Ensure initial value is formatted after view initialization
    // This handles cases where values are patched before the directive is ready
    setTimeout(() => {
      // Check if there's a value that needs formatting
      if (this.currentRawValue) {
        // Format if we have a raw value stored
        if (!this.isFocused) {
          try {
            this.el.value = this.formatIndianCurrency(this.currentRawValue);
          } catch (e) {
            // Silently handle any errors
            console.warn('Error formatting value:', e);
          }
        }
      } else if (this.el.value) {
        // If there's a value in the input but currentRawValue is empty,
        // it means the value was set before the directive initialized
        const rawValue = this.sanitizeValue(this.el.value);
        if (rawValue) {
          this.currentRawValue = rawValue;
          if (!this.isFocused) {
            try {
              this.el.value = this.formatIndianCurrency(rawValue);
            } catch (e) {
              // Silently handle any errors
              console.warn('Error formatting value:', e);
            }
          }
        }
      }
    }, 10);
  }

  writeValue(value: any): void {
    // Ensure type is 'text' before setting formatted values
    if (this.el.type === 'number' || this.el.getAttribute('type') === 'number') {
      this.el.type = 'text';
      this.el.setAttribute('inputmode', 'decimal');
    }

    if (value === null || value === undefined || value === '') {
      this.currentRawValue = '';
      this.el.value = '';
      return;
    }

    const sanitized = this.sanitizeValue(value);
    this.currentRawValue = sanitized;

    // Format the value immediately
    // Use setTimeout only if needed for DOM updates
    if (this.isFocused) {
      this.el.value = this.currentRawValue;
    } else {
      try {
        const formatted = this.formatIndianCurrency(this.currentRawValue);
        this.el.value = formatted;
      } catch (e) {
        // Fallback to raw value if formatting fails
        this.el.value = this.currentRawValue;
        console.warn('Error formatting value in writeValue:', e);
      }
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.el.disabled = isDisabled;
  }

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const cursorPosition = this.el.selectionStart;
    const initialValue = this.el.value;
    
    let rawValue = initialValue.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const decimalParts = rawValue.split('.');
    if (decimalParts.length > 2) {
      rawValue = decimalParts[0] + '.' + decimalParts.slice(1).join('');
    }

    this.currentRawValue = rawValue;
    this.onChange(rawValue);
    this.formatDisplayValue(initialValue, cursorPosition ?? 0);
  }

  @HostListener('focus')
  onFocus() {
    this.isFocused = true;
    this.el.value = this.currentRawValue || '';
  }

  @HostListener('blur')
  onBlur() {
    this.isFocused = false;
    this.formatDisplayValue();
    this.onTouched();
  }

  private formatDisplayValue(initialValue?: string, cursorPosition?: number) {
    const rawValue = this.currentRawValue;
    
    if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
      const formattedValue = this.formatIndianCurrency(rawValue);
      this.el.value = formattedValue;

      if (initialValue !== undefined && cursorPosition !== undefined) {
        const newCursorPosition = this.calculateNewCursorPosition(
          initialValue,
          formattedValue,
          cursorPosition
        );
        this.el.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    } else {
      this.el.value = '';
    }
  }

  private sanitizeValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    const str = typeof value === 'number' ? value.toString() : value.toString();
    return str.replace(/[^0-9.]/g, '');
  }

  private formatIndianCurrency(value: string | number): string {
    if (!value) return '';

    // Convert to string and clean
    const numStr = typeof value === 'number' ? value.toString() : value;
    const cleanStr = numStr.replace(/[^0-9.]/g, '');

    // Split into integer and decimal parts
    const parts = cleanStr.split('.');
    let integerPart = parts[0];
    const decimalPart = parts.length > 1 ? `.${parts[1].substring(0, 2)}` : '';

    if (integerPart) {
      // Indian numbering system:
      // First comma after 3 digits from right, then every 2 digits
      const lastThree = integerPart.substring(integerPart.length - 3);
      const otherNumbers = integerPart.substring(0, integerPart.length - 3);
      
      let formattedInteger = lastThree;
      
      if (otherNumbers !== '') {
        formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
      }
      
      integerPart = formattedInteger;
    }

    return integerPart + decimalPart;
  }

  private calculateNewCursorPosition(
    oldValue: string,
    newValue: string,
    oldCursorPos: number
  ): number {
    // Get the part before cursor in old value
    const oldPrefix = oldValue.substring(0, oldCursorPos);
    const oldCommas = (oldPrefix.match(/,/g) || []).length;

    // Get the part before equivalent position in new value
    let newPrefix = newValue.substring(0, oldCursorPos);
    let newCommas = (newPrefix.match(/,/g) || []).length;

    // Adjust for added/removed commas
    let adjustment = newCommas - oldCommas;
    let newCursorPos = oldCursorPos + adjustment;

    // Ensure we don't go out of bounds
    newCursorPos = Math.max(0, Math.min(newCursorPos, newValue.length));

    return newCursorPos;
  }
}
