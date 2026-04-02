import { Pipe, PipeTransform } from '@angular/core';
import { 
  TableRowData, 
  TableColumn, 
  ActionButton, 
  HeaderButton, 
  ColorConditionResult 
} from './reusable-table-refactored.types';

/**
 * Pure pipe for color conditions - ensures change detection only runs when inputs change
 */
@Pipe({
  name: 'colorCondition',
  standalone: true,
  pure: true
})
export class ColorConditionPipe implements PipeTransform {
  transform<T extends TableRowData>(
    element: T | null | undefined,
    column: TableColumn<T> | null | undefined
  ): ColorConditionResult | null {
    if (!element || !column || !column.colorCondition) {
      return null;
    }
    
    try {
      return column.colorCondition(element);
    } catch {
      return null;
    }
  }
}

/**
 * Pure pipe for warning conditions
 */
@Pipe({
  name: 'warningCondition',
  standalone: true,
  pure: true
})
export class WarningConditionPipe implements PipeTransform {
  transform<T extends TableRowData>(
    element: T | null | undefined,
    column: TableColumn<T> | null | undefined
  ): boolean {
    if (!element || !column || !column.warningCondition) {
      return false;
    }
    
    try {
      return column.warningCondition(element);
    } catch {
      return false;
    }
  }
}

/**
 * Pure pipe to determine if a button should be shown
 */
@Pipe({
  name: 'shouldShowButton',
  standalone: true,
  pure: true
})
export class ShouldShowButtonPipe implements PipeTransform {
  transform<T extends TableRowData>(
    button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown> | null | undefined,
    row?: T | null
  ): boolean {
    if (!button) {
      return false;
    }

    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };
    
    if (isHeaderButton(button)) {
      if (button.show === undefined) {
        return true;
      }
      
      if (typeof button.show === 'function') {
        try {
          return button.show();
        } catch {
          return false;
        }
      }
      
      return !!button.show;
    }
    
    // ActionButton logic
    const actionBtn = button as ActionButton<T>;
    
    if (actionBtn.show === undefined) {
      return true;
    }
    
    if (typeof actionBtn.show === 'function') {
      try {
        if (actionBtn.show.length === 0) {
          return (actionBtn.show as () => boolean)();
        } else if (row) {
          return (actionBtn.show as (row: T) => boolean)(row);
        }
        return false;
      } catch {
        return false;
      }
    }
    
    return !!actionBtn.show;
  }
}

/**
 * Pure pipe to determine if a button is disabled
 */
@Pipe({
  name: 'isButtonDisabled',
  standalone: true,
  pure: true
})
export class IsButtonDisabledPipe implements PipeTransform {
  transform<T extends TableRowData>(
    button: ActionButton<T> | HeaderButton | Partial<ActionButton<T>> | Record<string, unknown> | null | undefined,
    row?: T | null
  ): boolean {
    if (!button) {
      return false;
    }

    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };
    
    if (isHeaderButton(button)) {
      if (button.disabled === undefined) {
        return false;
      }
      
      if (typeof button.disabled === 'function') {
        try {
          return button.disabled();
        } catch {
          return false;
        }
      }
      
      return !!button.disabled;
    }
    
    // ActionButton logic
    const actionBtn = button as ActionButton<T>;
    
    if (actionBtn.disabled === undefined) {
      return false;
    }
    
    if (typeof actionBtn.disabled === 'function') {
      try {
        if (actionBtn.disabled.length === 0) {
          return (actionBtn.disabled as () => boolean)();
        } else if (row) {
          return (actionBtn.disabled as (row: T) => boolean)(row);
        }
        return false;
      } catch {
        return false;
      }
    }
    
    return !!actionBtn.disabled;
  }
}

/**
 * Pure pipe for row class memoization
 */
@Pipe({
  name: 'rowClassMemo',
  standalone: true,
  pure: true
})
export class RowClassMemoPipe implements PipeTransform {
  transform<T extends TableRowData>(
    row: T | null | undefined,
    rowClassFn?: ((row: T) => Readonly<Record<string, boolean | string>>) | null
  ): Readonly<Record<string, boolean | string>> {
    if (!row || !rowClassFn) {
      return {};
    }
    
    try {
      return rowClassFn(row);
    } catch {
      return {};
    }
  }
}

/**
 * Pure pipe for calculating serial numbers
 */
@Pipe({
  name: 'serialNumber',
  standalone: true,
  pure: true
})
export class SerialNumberPipe implements PipeTransform {
  transform(
    index: number,
    context: {
      virtualScrolling?: boolean;
      showPaginator?: boolean;
      visibleRangeStart?: number;
      currentPage?: number;
      pageSize?: number;
      customPageSize?: number;
      startFrom?: number;
    }
  ): number {
    const {
      virtualScrolling = false,
      showPaginator = false,
      visibleRangeStart = 0,
      currentPage = 0,
      pageSize = 50,
      customPageSize = 50,
      startFrom = 1
    } = context;

    if (virtualScrolling) {
      return visibleRangeStart + index + startFrom;
    } else if (showPaginator) {
      return currentPage * pageSize + index + startFrom;
    } else {
      return currentPage * customPageSize + index + startFrom;
    }
  }
}

/**
 * Pure pipe for getting cell values with formatting
 */
@Pipe({
  name: 'cellValue',
  standalone: true,
  pure: true
})
export class CellValuePipe implements PipeTransform {
  transform<T extends TableRowData>(
    row: T | null | undefined,
    columnKey: string | null | undefined
  ): unknown {
    if (!row || !columnKey) {
      return null;
    }
    
    return row[columnKey];
  }
}

/**
 * Pure pipe for button colors
 */
@Pipe({
  name: 'buttonColor',
  standalone: true,
  pure: true
})
export class ButtonColorPipe implements PipeTransform {
  transform(
    button: ActionButton | HeaderButton | Partial<ActionButton> | Record<string, unknown> | null | undefined
  ): string {
    if (!button) {
      return 'primary';
    }

    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };
    
    if (isHeaderButton(button)) {
      return button.color || 'primary';
    }
    
    // ActionButton logic
    const actionBtn = button as ActionButton;
    if ('color' in actionBtn && typeof actionBtn.color === 'string') {
      return actionBtn.color;
    }
    
    return 'primary';
  }
}

/**
 * Pure pipe for button icons
 */
@Pipe({
  name: 'buttonIcon',
  standalone: true,
  pure: true
})
export class ButtonIconPipe implements PipeTransform {
  transform(
    button: ActionButton | HeaderButton | Partial<ActionButton> | Record<string, unknown> | null | undefined
  ): string {
    if (!button) {
      return '';
    }

    if ('icon' in button && typeof button.icon === 'string') {
      return button.icon;
    }
    
    return '';
  }
}

/**
 * Pure pipe for button labels
 */
@Pipe({
  name: 'buttonLabel',
  standalone: true,
  pure: true
})
export class ButtonLabelPipe implements PipeTransform {
  transform(
    button: ActionButton | HeaderButton | Partial<ActionButton> | Record<string, unknown> | null | undefined
  ): string {
    if (!button) {
      return '';
    }

    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };
    
    if (isHeaderButton(button)) {
      return button.label || '';
    }
    
    // ActionButton logic
    const actionBtn = button as ActionButton;
    if ('label' in actionBtn && typeof actionBtn.label === 'string') {
      return actionBtn.label;
    }
    
    return '';
  }
}

/**
 * Pure pipe for button tooltips
 */
@Pipe({
  name: 'buttonTooltip',
  standalone: true,
  pure: true
})
export class ButtonTooltipPipe implements PipeTransform {
  transform(
    button: ActionButton | HeaderButton | Partial<ActionButton> | Record<string, unknown> | null | undefined
  ): string | undefined {
    if (!button) {
      return undefined;
    }

    // Type guard: Check if it's HeaderButton (action is a function)
    const isHeaderButton = (b: unknown): b is HeaderButton => {
      return typeof b === 'object' && b !== null && 'action' in b && typeof (b as HeaderButton).action === 'function';
    };
    
    if (isHeaderButton(button)) {
      return button.tooltip;
    }
    
    // ActionButton logic
    const actionBtn = button as ActionButton;
    return actionBtn.tooltip;
  }
}
