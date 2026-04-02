import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeFloorUnitStatusComponent } from './change-floor-unit-status.component';

describe('ChangeFloorUnitStatusComponent', () => {
  let component: ChangeFloorUnitStatusComponent;
  let fixture: ComponentFixture<ChangeFloorUnitStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeFloorUnitStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChangeFloorUnitStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
