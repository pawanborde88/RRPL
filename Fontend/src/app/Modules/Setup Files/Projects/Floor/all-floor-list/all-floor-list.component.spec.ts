import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllFloorListComponent } from './all-floor-list.component';

describe('AllFloorListComponent', () => {
  let component: AllFloorListComponent;
  let fixture: ComponentFixture<AllFloorListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllFloorListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllFloorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
