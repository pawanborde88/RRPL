import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllMOMMeetingsComponent } from './all-mommeetings.component';

describe('AllMOMMeetingsComponent', () => {
  let component: AllMOMMeetingsComponent;
  let fixture: ComponentFixture<AllMOMMeetingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllMOMMeetingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllMOMMeetingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
