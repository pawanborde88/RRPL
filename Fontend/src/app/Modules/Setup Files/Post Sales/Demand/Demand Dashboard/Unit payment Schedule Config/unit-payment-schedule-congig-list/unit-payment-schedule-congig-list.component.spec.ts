import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitPaymentScheduleCongigListComponent } from './unit-payment-schedule-congig-list.component';

describe('UnitPaymentScheduleCongigListComponent', () => {
  let component: UnitPaymentScheduleCongigListComponent;
  let fixture: ComponentFixture<UnitPaymentScheduleCongigListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitPaymentScheduleCongigListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UnitPaymentScheduleCongigListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
