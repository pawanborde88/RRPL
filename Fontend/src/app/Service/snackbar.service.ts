import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  constructor(private snackBar: MatSnackBar) { }



  showDataSnackbar(message: string, action?: string, duration?: number, afterDismissedFunction?: Function): void {
    const snackBarRef = this.snackBar.open(message, action ?? undefined, {
      duration: duration ?? 5000, // Set the duration in milliseconds (optional)
    });

    snackBarRef.afterDismissed().subscribe(() => {
      // Perform actions after snackbar is closed
      if (afterDismissedFunction)
        afterDismissedFunction();
    });
  }

  showLoadingSnackbar(message?: string): void {
    this.snackBar.open(message ?? 'Loading...', undefined, {
      duration: undefined, // Set the duration in milliseconds (optional)
    });
  }
}
