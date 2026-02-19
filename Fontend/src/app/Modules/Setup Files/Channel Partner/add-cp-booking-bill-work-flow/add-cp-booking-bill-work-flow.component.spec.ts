import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCpBookingBillWorkFlowComponent } from './add-cp-booking-bill-work-flow.component';

describe('AddCpBookingBillWorkFlowComponent', () => {
  let component: AddCpBookingBillWorkFlowComponent;
  let fixture: ComponentFixture<AddCpBookingBillWorkFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCpBookingBillWorkFlowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCpBookingBillWorkFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
