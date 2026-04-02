import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTokenPaymentsComponent } from './all-token-payments.component';

describe('AllTokenPaymentsComponent', () => {
  let component: AllTokenPaymentsComponent;
  let fixture: ComponentFixture<AllTokenPaymentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTokenPaymentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllTokenPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
