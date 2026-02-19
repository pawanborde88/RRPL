import { TestBed } from '@angular/core/testing';

import { ColumnDynamicColorService } from './column-dynamic-color.service';

describe('ColumnDynamicColorService', () => {
  let service: ColumnDynamicColorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ColumnDynamicColorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
