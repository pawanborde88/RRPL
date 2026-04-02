import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllProjectWingsComponent } from './all-project-wings.component';

describe('AllProjectWingsComponent', () => {
  let component: AllProjectWingsComponent;
  let fixture: ComponentFixture<AllProjectWingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllProjectWingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllProjectWingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
