import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllIncentivePlansComponent } from './all-incentive-plans.component';

describe('AllIncentivePlansComponent', () => {
  let component: AllIncentivePlansComponent;
  let fixture: ComponentFixture<AllIncentivePlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllIncentivePlansComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllIncentivePlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
