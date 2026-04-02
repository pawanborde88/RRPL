import { computed, signal, Signal, WritableSignal } from '@angular/core';

export abstract class BaseStore<T extends object> {
    private readonly _state: WritableSignal<T>;
    private readonly _loading = signal(false);
    private readonly _error = signal<string | null>(null);

    public readonly state: Signal<T>;
    public readonly loading = this._loading.asReadonly();
    public readonly error = this._error.asReadonly();

    protected constructor(initialState: T) {
        this._state = signal<T>(initialState);
        this.state = this._state.asReadonly();
    }

    /**
     * Select a slice of the state.
     */
    public select<K>(selector: (state: T) => K): Signal<K> {
        return computed(() => selector(this.state()));
    }

    /**
     * Update the state.
     */
    public setState(newState: Partial<T> | ((state: T) => T)): void {
        this._state.update((state) => {
            if (typeof newState === 'function') {
                return newState(state);
            }
            return { ...state, ...newState };
        });
    }

    /**
     * Patch the state.
     */
    public patchState(partialState: Partial<T>): void {
        this._state.update((state) => ({ ...state, ...partialState }));
    }

    /**
     * Set loading state.
     */
    public setLoading(loading: boolean): void {
        this._loading.set(loading);
    }

    /**
     * Set error state.
     */
    public setError(error: string | null): void {
        this._error.set(error);
    }
}
