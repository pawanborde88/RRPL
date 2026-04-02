import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../../../environments/environment';
import { catchError, finalize } from 'rxjs/operators';
import { EMPTY, Observable } from 'rxjs';

export interface ChannelPartner {
    channel_partner_id: number;
    firm_name: string;
    [key: string]: any;
}

@Injectable()
export class AddCPOwnersStore {
    private readonly http = inject(HttpClient);
    private readonly snackBar = inject(MatSnackBar);
    private readonly baseUrl = environment.API_URL;

    // View Model State Signals
    readonly channelPartners = signal<ChannelPartner[]>([]);
    readonly isLoadingPartners = signal<boolean>(false);
    readonly isSaving = signal<boolean>(false);


    saveCPOwner(apiUrl: string, formData: any): Observable<any> {
        this.isSaving.set(true);
        return this.http.post(`${this.baseUrl}/${apiUrl}`, formData).pipe(
            catchError((error) => {
                console.error('Error saving CP owner:', error);
                this.snackBar.open('Something went wrong. Please try again.', 'Close', { duration: 3000 });
                throw error;
            }),
            finalize(() => this.isSaving.set(false))
        );
    }
}
