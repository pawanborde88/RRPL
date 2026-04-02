import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CpBookingBillWorkFlowComponent } from './cp-booking-bill-work-flow.component';

describe('CpBookingBillWorkFlowComponent', () => {
  let component: CpBookingBillWorkFlowComponent;
  let fixture: ComponentFixture<CpBookingBillWorkFlowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CpBookingBillWorkFlowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CpBookingBillWorkFlowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
