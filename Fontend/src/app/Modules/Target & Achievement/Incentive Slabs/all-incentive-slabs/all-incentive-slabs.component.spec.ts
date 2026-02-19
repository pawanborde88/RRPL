import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllIncentiveSlabsComponent } from './all-incentive-slabs.component';

describe('AllIncentiveSlabsComponent', () => {
  let component: AllIncentiveSlabsComponent;
  let fixture: ComponentFixture<AllIncentiveSlabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllIncentiveSlabsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllIncentiveSlabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
