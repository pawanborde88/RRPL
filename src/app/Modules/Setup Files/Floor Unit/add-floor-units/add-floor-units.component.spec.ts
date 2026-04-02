import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFloorUnitsComponent } from './add-floor-units.component';

describe('AddFloorUnitsComponent', () => {
  let component: AddFloorUnitsComponent;
  let fixture: ComponentFixture<AddFloorUnitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFloorUnitsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddFloorUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
