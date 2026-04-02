import { TestBed } from '@angular/core/testing';

import { PermissonService } from './permisson.service';

describe('PermissonService', () => {
  let service: PermissonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PermissonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
