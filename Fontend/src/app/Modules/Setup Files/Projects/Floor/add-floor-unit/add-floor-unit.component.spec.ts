import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFloorUnitComponent } from './add-floor-unit.component';

describe('AddFloorUnitComponent', () => {
  let component: AddFloorUnitComponent;
  let fixture: ComponentFixture<AddFloorUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFloorUnitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddFloorUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
