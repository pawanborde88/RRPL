import { signal, computed, WritableSignal, Signal } from '@angular/core';

export class SignalStore<T> {
    readonly state: WritableSignal<T>;
    readonly computed: Signal<T>;

    constructor(initialState: T) {
        this.state = signal(initialState);
        this.computed = computed(() => this.state());
    }

    /**
     * Update the state with a new value or a partial update
     * @param partialState Partial state to update or a function that returns new state
     */
    setState(partialState: Partial<T> | ((currentState: T) => Partial<T>)): void {
        this.state.update((current) => {
            const newState = typeof partialState === 'function'
                ? partialState(current)
                : partialState;

            return { ...current, ...newState };
        });
    }

    /**
     * Select a specific slice of the state as a Signal
     * @param selector Function to select a slice of the state
     */
    select<K>(selector: (state: T) => K): Signal<K> {
        return computed(() => selector(this.state()));
    }

    /**
     * Get current state snapshot
     */
    get(): T {
        return this.state();
    }
}
