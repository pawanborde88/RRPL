import { NativeDateAdapter } from '@angular/material/core';

export class ErpDateAdapter extends NativeDateAdapter {

  override format(date: Date): string {
    if (!date) return '';

    const dd = this.pad(date.getDate());
    const mm = this.pad(date.getMonth() + 1);
    const yyyy = date.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
  }

  override parse(value: string): Date | null {
    if (!value) return null;

    const [dd, mm, yyyy] = value.split('-').map(Number);
    if (!dd || !mm || !yyyy) return null;

    return new Date(yyyy, mm - 1, dd);
  }

  private pad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
}
