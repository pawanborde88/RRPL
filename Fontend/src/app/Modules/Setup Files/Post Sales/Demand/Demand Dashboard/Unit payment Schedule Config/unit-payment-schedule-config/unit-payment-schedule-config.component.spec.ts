import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitPaymentScheduleConfigComponent } from './unit-payment-schedule-config.component';

describe('UnitPaymentScheduleConfigComponent', () => {
  let component: UnitPaymentScheduleConfigComponent;
  let fixture: ComponentFixture<UnitPaymentScheduleConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitPaymentScheduleConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnitPaymentScheduleConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
