import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { finalize } from 'rxjs';

export interface TagModule {
    module_id: number;
    module_name: string;
    api_name: string;
    request_data: string;
}

@Injectable({
    providedIn: 'root',
})
export class TagPlaceholderStore {
    private http = inject(HttpClient);
    private baseUrl = environment.API_URL;

    // State
    private _modules = signal<TagModule[]>([]);
    private _loading = signal(false);

    // Selectors
    readonly modules = this._modules.asReadonly();
    readonly isLoading = this._loading.asReadonly();

    constructor() {
        this.fetchModules();
    }

    fetchModules() {
        this._loading.set(true);
        this.http.get<any>(`${this.baseUrl}/fetch_tag_module`)
            .pipe(finalize(() => this._loading.set(false)))
            .subscribe({
                next: (res) => {
                    if (res?.success) {
                        this._modules.set(res.data || []);
                    }
                },
                error: (err) => {
                    console.error('Failed to load modules in store', err);
                    this._modules.set([]);
                }
            });
    }
}
