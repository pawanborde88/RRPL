# Confirm Dialog Component - Usage Guide

## Overview
A modern, accessible confirmation dialog component with reason input for deletion actions. Features proper validation, Tailwind CSS styling, and Angular Material integration.

## Features

✅ **Professional UI Design**
- Material Design with Tailwind CSS
- Smooth animations and transitions
- Responsive layout
- Accessible (ARIA labels, keyboard navigation)

✅ **Form Validation**
- Required field validation
- Minimum 3 characters
- Shows errors only after user interaction
- Character counter (0/500)
- Real-time validation feedback

✅ **User Experience**
- Clear warning message
- Helper text for guidance
- Cancel and Delete buttons
- Disabled state for invalid input
- Focus management
- Prevents accidental closure

## Basic Usage

### 1. Import the Component

```typescript
import { ConfirmDialogComponent, ConfirmDialogData, ConfirmDialogResult } from './Dialogs/Common/confirm-dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
```

### 2. Simple Deletion Confirmation

```typescript
constructor(private dialog: MatDialog) {}

deleteItem(item: any): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '540px',
    data: {
      message: `Are you sure you want to delete "${item.name}"?`,
      permanent: true
    } as ConfirmDialogData
  });

  dialogRef.afterClosed().subscribe((result: ConfirmDialogResult) => {
    if (result?.confirmed) {
      console.log('Deletion reason:', result.reason);
      // Proceed with deletion
      this.performDelete(item.id, result.reason);
    }
  });
}
```

### 3. Using itemName (Auto-generates message)

```typescript
deleteLocation(location: any): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '540px',
    data: {
      itemName: location.name,
      permanent: true
    } as ConfirmDialogData
  });

  dialogRef.afterClosed().subscribe((result: ConfirmDialogResult) => {
    if (result?.confirmed) {
      this.apiService.deleteLocation(location.id, result.reason)
        .subscribe({
          next: () => {
            this.snackBar.open('Location deleted successfully', 'Close', {
              duration: 3000
            });
          },
          error: (err) => {
            this.snackBar.open('Failed to delete location', 'Close', {
              duration: 3000
            });
          }
        });
    }
  });
}
```

### 4. Custom Message with Additional Context

```typescript
deleteWithWarning(): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    width: '540px',
    data: {
      message: 'This will permanently delete the user and all associated data including orders, preferences, and history.',
      permanent: true,
      title: 'Delete User Account'
    } as ConfirmDialogData
  });

  dialogRef.afterClosed().subscribe((result: ConfirmDialogResult) => {
    if (result?.confirmed) {
      // Handle deletion with reason
      console.log('User provided reason:', result.reason);
    }
  });
}
```

## API Reference

### ConfirmDialogData Interface

```typescript
interface ConfirmDialogData {
  message: string;           // Main warning message to display
  itemName?: string;         // Optional: Auto-generates message
  permanent?: boolean;       // Shows "cannot be undone" warning
  title?: string;           // Optional: Custom dialog title
}
```

### ConfirmDialogResult Interface

```typescript
interface ConfirmDialogResult {
  confirmed: boolean;        // true if user clicked Delete
  reason?: string;          // User-provided deletion reason (trimmed)
}
```

## Validation Rules

- **Required**: Reason field must not be empty
- **Min Length**: At least 3 characters
- **Max Length**: 500 characters
- **Trimmed**: Leading/trailing spaces are removed

## Styling Customization

The component uses Tailwind CSS utilities. Key classes:

- `bg-red-50` - Warning background
- `border-red-200` - Warning border
- `text-red-800` - Warning text
- `rounded-lg` - Rounded corners
- `gap-3` - Consistent spacing

To customize colors, modify the Tailwind classes in the HTML template.

## Accessibility

- ✅ Proper ARIA labels
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Focus management (auto-focus on textarea)
- ✅ Screen reader friendly
- ✅ Clear visual indicators for disabled states

## Examples in Action

### Example 1: Delete with Reason Logging
```typescript
deleteEmployee(emp: Employee): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
      itemName: `${emp.firstName} ${emp.lastName}`,
      permanent: true
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result?.confirmed) {
      this.employeeService.delete(emp.id, result.reason).subscribe(() => {
        this.logAuditTrail({
          action: 'DELETE',
          entity: 'Employee',
          entityId: emp.id,
          reason: result.reason,
          timestamp: new Date()
        });
      });
    }
  });
}
```

### Example 2: Soft Delete
```typescript
archiveRecord(record: any): void {
  const dialogRef = this.dialog.open(ConfirmDialogComponent, {
    data: {
      message: `Archive "${record.name}"? This can be restored later.`,
      permanent: false
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result?.confirmed) {
      this.recordService.archive(record.id, result.reason);
    }
  });
}
```

## Tips

1. **Always handle the result properly**: Check `result?.confirmed` before proceeding
2. **Use permanent flag**: Set to `true` for hard deletes, `false` for soft deletes
3. **Provide context**: Give users clear information about what they're deleting
4. **Log the reason**: Store deletion reasons for audit trails
5. **Set appropriate width**: Default 540px works well, adjust as needed

## Troubleshooting

**Q: Error message shows immediately on open**
A: Fixed in current version - errors only show after user interaction

**Q: Delete button stays disabled**
A: User must enter at least 3 characters in the reason field

**Q: Dialog closes on backdrop click**
A: Dialog is configured with `disableClose: true` to prevent accidental closure

**Q: Styling looks wrong**
A: Ensure Tailwind CSS is properly configured in your Angular project

