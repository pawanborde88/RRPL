import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllFloorUnitsComponent } from './all-floor-units.component';

describe('AllFloorUnitsComponent', () => {
  let component: AllFloorUnitsComponent;
  let fixture: ComponentFixture<AllFloorUnitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllFloorUnitsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllFloorUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
