import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPhasesComponent } from './all-phases.component';

describe('AllPhasesComponent', () => {
  let component: AllPhasesComponent;
  let fixture: ComponentFixture<AllPhasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPhasesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllPhasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
