import { TestBed } from '@angular/core/testing';

import { CommonSercieService } from './common-sercie.service';

describe('CommonSercieService', () => {
  let service: CommonSercieService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommonSercieService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
