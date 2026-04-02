import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllDealValuesComponent } from './all-deal-values.component';

describe('AllDealValuesComponent', () => {
  let component: AllDealValuesComponent;
  let fixture: ComponentFixture<AllDealValuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllDealValuesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllDealValuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
