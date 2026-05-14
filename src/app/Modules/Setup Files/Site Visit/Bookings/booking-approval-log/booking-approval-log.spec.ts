import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingApprovalLog } from './booking-approval-log';

describe('BookingApprovalLog', () => {
  let component: BookingApprovalLog;
  let fixture: ComponentFixture<BookingApprovalLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingApprovalLog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingApprovalLog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
