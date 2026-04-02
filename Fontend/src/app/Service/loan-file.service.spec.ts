import { TestBed } from '@angular/core/testing';

import { LoanFileService } from './loan-file.service';

describe('LoanFileService', () => {
  let service: LoanFileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoanFileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
