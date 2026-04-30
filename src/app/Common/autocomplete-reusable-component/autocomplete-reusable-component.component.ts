import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  signal,
  Signal,
  SimpleChanges,
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { MatSelectChange } from '@angular/material/select';
import { MatOptionSelectionChange, ErrorStateMatcher } from '@angular/material/core';
import { RouterModule } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  takeUntil,
} from 'rxjs';
import { AngularMaterialModule } from '../../../angular-material.module';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { TemplateComponent } from '../template/template.component';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

/**
 * Generic option interface for type safety
 */
export interface SelectOption<T = any> {
  [key: string]: any;
  disabled?: boolean;
}

/**
 * Custom ErrorStateMatcher to sync the internal mat-select's error state
 * with the parent component's ngControl state.
 */
export class ParentErrorStateMatcher implements ErrorStateMatcher {
  constructor(private ngControl: NgControl) { }

  isErrorState(): boolean {
    const control = this.ngControl?.control;
    return !!(control && control.invalid && (control.touched || control.dirty));
  }
}

/**
 * Highly optimized autocomplete component with advanced Angular patterns:
 * - OnPush change detection for minimal re-renders
 * - Signals for reactive state management
 * - Computed signals for derived state
 * - Debounced search with distinctUntilChanged
 * - TrackBy functions for efficient rendering
 * - Memoized filtering
 * - Proper memory management
 */
@Component({
  selector: 'app-autocomplete-reusable-component',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    TemplateComponent,
    BreadcrumbComponent,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './autocomplete-reusable-component.component.html',
  styleUrl: './autocomplete-reusable-component.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutocompleteReusableComponent
  implements OnInit, OnChanges, OnDestroy {
  // Inputs - using @Input() for backward compatibility, converted to signals internally
  @Input() isMultiSelect: boolean = false;
  @Input() placeholder: string = '';
  @Input() options: SelectOption[] = [];
  @Input() displayKey: string = '';
  @Input() idKey: string = '';
  @Input() disabled: boolean = false;
  @Input() selectedValue?: any = null;
  // Outputs
  @Output() selectedChange = new EventEmitter<any>();
  @Output() inputChanged = new EventEmitter<string>();
  @Output() selectedIdChange = new EventEmitter<any>();

  // Internal signals derived from inputs for reactive computations
  private readonly _isMultiSelectSignal = signal<boolean>(false);
  private readonly _placeholderSignal = signal<string>('');
  private readonly _optionsSignal = signal<SelectOption[]>([]);
  private readonly _displayKeySignal = signal<string>('');
  private readonly _idKeySignal = signal<string>('');
  private readonly _disabledSignal = signal<boolean>(false);
  private readonly _selectedValueSignal = signal<any>(null);
  @Input() required: boolean = false;
  @Input() autoSelectSessionId: boolean = false;

  /**
   * Special constant value that represents the "Select All" option.
   * This value MUST be something that can never clash with a real option id.
   */
  readonly selectAllValue: number = -1;

  // Form controls
  readonly selectedCtrl = new FormControl();
  readonly searchCtrl = new FormControl();

  // Error state matcher for mat-select
  readonly errorMatcher: ParentErrorStateMatcher;

  // ControlValueAccessor callbacks
  private onChange: (value: any) => void = () => { };
  private onTouched: () => void = () => { };

  constructor(
    private cdr: ChangeDetectorRef,
    @Optional() public ngControl: NgControl
  ) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
    this.errorMatcher = new ParentErrorStateMatcher(this.ngControl);
  }

  // Internal state using signals for reactive updates
  private readonly _searchTerm = signal<string>('');

  // Computed signal for filtered options - automatically updates when search term or options change
  readonly filteredOptions: Signal<SelectOption[]> = computed(() => {
    const search = this._searchTerm().toLowerCase().trim();
    const options = this._optionsSignal();
    const displayKey = this._displayKeySignal();

    // Early return if no displayKey (component not properly initialized)
    if (!displayKey) {
      return [];
    }

    if (!search) {
      return options;
    }

    // Memoized filtering with early return
    return options.filter((item) => {
      const displayValue = item[displayKey];
      const isOther = displayValue === 'Other';
      return isOther || displayValue?.toLowerCase().includes(search);
    });
  });

  // Computed signal to check if "Select All" should be shown
  readonly showSelectAll = computed(() => {
    return (
      this._isMultiSelectSignal() &&
      this.filteredOptions().length > 1 &&
      !this.filteredOptions().every((opt) => opt.disabled)
    );
  });

  // Computed signal to check if all filtered options are selected
  readonly allFilteredSelected = computed(() => {
    if (!this._isMultiSelectSignal()) return false;

    const idKey = this._idKeySignal();
    if (!idKey) return false;

    const selectedValues = (this.selectedCtrl.value as any[]) || [];
    const filteredIds = this.filteredOptions()
      .filter((opt) => !opt.disabled)
      .map((opt) => opt[idKey]);

    return (
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedValues.includes(id))
    );
  });
  get isRequired(): boolean {
    // First, check if required input is manually set
    if (this.required) return true;

    // Check if the control has Validators.required
    const control = this.ngControl?.control;
    if (control?.hasValidator(Validators.required)) {
      return true;
    }

    return false;
  }
  // Cleanup subject
  private readonly _destroy$ = new Subject<void>();

  // Flag to prevent infinite loop when programmatically setting values
  private _isUpdatingSelection = false;

  ngOnChanges(changes: SimpleChanges): void {
    // Sync inputs to signals for reactive computations
    if (changes['isMultiSelect']) {
      this._isMultiSelectSignal.set(this.isMultiSelect);
    }
    if (changes['placeholder']) {
      this._placeholderSignal.set(this.placeholder);
    }
    if (changes['options']) {
      this._optionsSignal.set(this.options?.length ? [...this.options] : []);
    }
    if (changes['displayKey']) {
      this._displayKeySignal.set(this.displayKey);
    }
    if (changes['idKey']) {
      this._idKeySignal.set(this.idKey);
    }
    if (changes['disabled']) {
      this._disabledSignal.set(this.disabled);
      if (this.disabled) {
        this.selectedCtrl.disable({ emitEvent: false });
      } else {
        this.selectedCtrl.enable({ emitEvent: false });
      }
    }
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    // Initialize signals from inputs
    this._isMultiSelectSignal.set(this.isMultiSelect);
    this._placeholderSignal.set(this.placeholder);
    this._optionsSignal.set(this.options?.length ? [...this.options] : []);
    this._displayKeySignal.set(this.displayKey);
    this._idKeySignal.set(this.idKey);
    this._disabledSignal.set(this.disabled);

    // Validate required inputs at runtime
    if (!this.displayKey || !this.idKey) {
      console.error(
        'AutocompleteReusableComponent: displayKey and idKey are required inputs'
      );
      return;
    }

    // Ensure form control is properly initialized
    if (!this.selectedCtrl) {
      // This should never happen, but add safety check
      console.warn('AutocompleteReusableComponent: selectedCtrl is not initialized');
      return;
    }

    // Sync disabled state
    if (this.disabled) {
      this.selectedCtrl.disable({ emitEvent: false });
    }

    this.setupSearchSubscription();
    this.setupSelectionSubscription();
    this.autoSelectUserId();

    // Trigger change detection to ensure form control is bound
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  /**
   * Setup debounced search subscription with distinctUntilChanged
   * to prevent unnecessary filtering operations
   */
  private setupSearchSubscription(): void {
    this.searchCtrl.valueChanges
      .pipe(
        debounceTime(150), // Debounce for smooth typing experience
        distinctUntilChanged(), // Only emit when value actually changes
        takeUntil(this._destroy$)
      )
      .subscribe((searchTerm: string | null) => {
        this._searchTerm.set(searchTerm?.trim() || '');
        this.cdr.markForCheck();
      });
  }

  /**
   * Setup selection change subscription with proper cleanup
   */
  private setupSelectionSubscription(): void {
    this.selectedCtrl.valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe((value) => {
        this.onChange(value);
        this.selectedChange.emit(value);
        this.cdr.markForCheck();
      });
  }

  /**
   * Auto-select userId from sessionStorage if it exists in options
   */
  private autoSelectUserId(): void {
    if (!this.autoSelectSessionId) return;
    const idKey = this._idKeySignal();
    if (!idKey) return;

    try {
      const userId = Number(sessionStorage.getItem('session_id'));
      if (
        userId &&
        this._optionsSignal().some((option) => option[idKey] === userId)
      ) {
        this.selectedCtrl.setValue(userId, { emitEvent: false });
        this.cdr.markForCheck();
      }
    } catch (error) {
      console.warn('Failed to read session_id from sessionStorage:', error);
    }
  }

  /**
   * Handle selection change event from mat-select
   */
  onSelectionChange(event: MatSelectChange): void {
    const idKey = this._idKeySignal();
    if (!idKey) return;

    // Prevent infinite loop when updating from toggleSelectAll
    if (this._isUpdatingSelection) return;

    // SINGLE-SELECT MODE
    if (!this._isMultiSelectSignal()) {
      const selectedOption = this._optionsSignal().find(
        (option) => option[idKey] === event.value
      );
      this.selectedChange.emit(selectedOption);
      this.selectedIdChange.emit(event.value);
      this.onChange(event.value);
      return;
    }

    // MULTI-SELECT MODE – keep "Select All" checkbox in sync
    let selectedValues: any[] = (event.value as any[]) || [];

    const filteredIds = this.filteredOptions()
      .filter((opt) => !opt.disabled)
      .map((opt) => opt[idKey]);

    const allSelected =
      filteredIds.length > 0 &&
      filteredIds.every((id) => selectedValues.includes(id));

    // Sync "Select All" option
    this._isUpdatingSelection = true;
    try {
      if (
        allSelected &&
        !selectedValues.includes(this.selectAllValue) &&
        filteredIds.length > 1
      ) {
        selectedValues = [this.selectAllValue, ...selectedValues];
        this.selectedCtrl.setValue(selectedValues, { emitEvent: false });
      } else if (!allSelected && selectedValues.includes(this.selectAllValue)) {
        selectedValues = selectedValues.filter((v) => v !== this.selectAllValue);
        this.selectedCtrl.setValue(selectedValues, { emitEvent: false });
      }

      const actualIds = selectedValues.filter((v) => v !== this.selectAllValue);
      this.selectedChange.emit(actualIds);
      this.selectedIdChange.emit(actualIds);
      this.onChange(actualIds);
    } finally {
      this._isUpdatingSelection = false;
    }
  }

  /**
   * Handler for the "Select All" mat-option
   */
  toggleSelectAll(change: MatOptionSelectionChange): void {
    if (!this._isMultiSelectSignal()) return;

    const idKey = this._idKeySignal();
    if (!idKey) return;

    // Prevent infinite loop
    if (this._isUpdatingSelection) return;
    this._isUpdatingSelection = true;

    try {
      const filteredIds = this.filteredOptions()
        .filter((opt) => !opt.disabled)
        .map((opt) => opt[idKey]);

      if (change.source.selected) {
        // Select everything that is currently shown
        const newSelection = [this.selectAllValue, ...filteredIds];
        this.selectedCtrl.setValue(newSelection, { emitEvent: false });
        this.selectedChange.emit(filteredIds);
        this.selectedIdChange.emit(filteredIds);
        this.onChange(filteredIds);
      } else {
        // Deselect all that are currently shown
        const currentSelection = (this.selectedCtrl.value as any[]) || [];
        const remaining = currentSelection.filter(
          (v) => !filteredIds.includes(v) && v !== this.selectAllValue
        );
        this.selectedCtrl.setValue(remaining, { emitEvent: false });
        this.selectedChange.emit(remaining);
        this.selectedIdChange.emit(remaining);
        this.onChange(remaining);
      }
    } finally {
      this._isUpdatingSelection = false;
    }
  }

  /**
   * Handle input change event with debouncing handled by RxJS
   */
  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value.trim();
    this.inputChanged.emit(value);
  }

  /**
   * Handle select dropdown opened/closed state
   */
  onOpenedChange(isOpen: boolean): void {
    if (!isOpen) {
      this.onTouched();
      this.cdr.markForCheck();
    }
  }

  /**
   * TrackBy function for efficient rendering of options
   * Prevents unnecessary DOM updates when options array changes
   * Using arrow function to preserve 'this' context
   */
  trackByOptionId = (_index: number, option: SelectOption): any => {
    const idKey = this._idKeySignal();
    return idKey ? option[idKey] : _index;
  }

  /**
   * Helper method to get option value for template
   */
  getOptionValue(option: SelectOption): any {
    const idKey = this._idKeySignal();
    return idKey ? option[idKey] : null;
  }

  /**
   * Helper method to get option display text for template
   */
  getOptionDisplay(option: SelectOption): string {
    const displayKey = this._displayKeySignal();
    return displayKey ? option[displayKey] || '' : '';
  }

  /**
   * ControlValueAccessor implementation
   */
  writeValue(value: any): void {
    // Ensure selectedCtrl is initialized before setting value
    if (!this.selectedCtrl) {
      console.warn('AutocompleteReusableComponent: selectedCtrl is not initialized');
      return;
    }

    if (this._isMultiSelectSignal()) {
      if (Array.isArray(value)) {
        this.selectedCtrl.setValue(value, { emitEvent: false });
      } else if (value === null || value === undefined) {
        this.selectedCtrl.setValue([], { emitEvent: false });
      } else {
        this.selectedCtrl.setValue([value], { emitEvent: false });
      }
    } else {
      this.selectedCtrl.setValue(value ?? null, { emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.selectedCtrl.disable({ emitEvent: false });
    } else {
      this.selectedCtrl.enable({ emitEvent: false });
    }
    this.cdr.markForCheck();
  }

  /**
   * Check if there's a selected value
   */
  hasSelectedValue(): boolean {
    const value = this.selectedCtrl.value;
    if (this._isMultiSelectSignal()) {
      return Array.isArray(value) && value.length > 0;
    }
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * Clear selection handler
   */
  clearSelection(event: Event): void {
    event.stopPropagation();
    const clearedValue = this._isMultiSelectSignal() ? [] : null;
    this.selectedCtrl.setValue(clearedValue);

    // Emit the change events
    this.selectedChange.emit(clearedValue);
    this.selectedIdChange.emit(clearedValue);
    this.onChange(clearedValue);
    this.cdr.markForCheck();
  }
}
