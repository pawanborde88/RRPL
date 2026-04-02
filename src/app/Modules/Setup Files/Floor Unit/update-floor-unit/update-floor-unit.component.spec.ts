import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateFloorUnitComponent } from './update-floor-unit.component';

describe('UpdateFloorUnitComponent', () => {
  let component: UpdateFloorUnitComponent;
  let fixture: ComponentFixture<UpdateFloorUnitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateFloorUnitComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpdateFloorUnitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
