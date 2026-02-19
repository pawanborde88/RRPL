import { TestBed } from '@angular/core/testing';

import { WhatsAppServiceService } from './whats-app-service.service';

describe('WhatsAppServiceService', () => {
  let service: WhatsAppServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WhatsAppServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
