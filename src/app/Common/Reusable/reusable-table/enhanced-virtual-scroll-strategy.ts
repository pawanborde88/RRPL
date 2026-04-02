import { ChangeDetectorRef, NgZone } from '@angular/core';
import { FixedSizeVirtualScrollStrategy } from '@angular/cdk/scrolling';

/**
 * Enhanced virtual scroll strategy that extends FixedSizeVirtualScrollStrategy
 * to provide better performance and control over virtual scrolling behavior
 */
export class EnhancedVirtualScrollStrategy extends FixedSizeVirtualScrollStrategy {
  constructor(
    itemSize: number,
    minBufferPx: number,
    maxBufferPx: number,
    cdr: ChangeDetectorRef,
    ngZone: NgZone
  ) {
    super(itemSize, minBufferPx, maxBufferPx);
  }
}

