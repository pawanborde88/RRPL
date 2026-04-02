import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EstimantionPaymentScheduleComponent } from './estimantion-payment-schedule.component';

describe('EstimantionPaymentScheduleComponent', () => {
  let component: EstimantionPaymentScheduleComponent;
  let fixture: ComponentFixture<EstimantionPaymentScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EstimantionPaymentScheduleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EstimantionPaymentScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
