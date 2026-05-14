import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingApprovalDialog } from './booking-approval-dialog';

describe('BookingApprovalDialog', () => {
  let component: BookingApprovalDialog;
  let fixture: ComponentFixture<BookingApprovalDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookingApprovalDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingApprovalDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
