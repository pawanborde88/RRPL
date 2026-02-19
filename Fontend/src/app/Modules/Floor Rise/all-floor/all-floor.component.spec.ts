import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllFloorComponent } from './all-floor.component';

describe('AllFloorComponent', () => {
  let component: AllFloorComponent;
  let fixture: ComponentFixture<AllFloorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllFloorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllFloorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
