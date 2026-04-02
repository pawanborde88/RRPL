import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportFloorUnitsComponent } from './import-floor-units.component';

describe('ImportFloorUnitsComponent', () => {
  let component: ImportFloorUnitsComponent;
  let fixture: ComponentFixture<ImportFloorUnitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportFloorUnitsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImportFloorUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
