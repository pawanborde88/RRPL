import { TestBed } from '@angular/core/testing';

import { QuestionListService } from './question-list.service';

describe('QuestionListService', () => {
  let service: QuestionListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QuestionListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
