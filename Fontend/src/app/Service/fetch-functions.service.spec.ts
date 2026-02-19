import { TestBed } from '@angular/core/testing';

import { FetchFunctionsService } from './fetch-functions.service';

describe('FetchFunctionsService', () => {
  let service: FetchFunctionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FetchFunctionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
