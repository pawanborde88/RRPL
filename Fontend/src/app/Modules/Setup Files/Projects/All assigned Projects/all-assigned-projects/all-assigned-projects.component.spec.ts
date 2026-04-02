import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAssignedProjectsComponent } from './all-assigned-projects.component';

describe('AllAssignedProjectsComponent', () => {
  let component: AllAssignedProjectsComponent;
  let fixture: ComponentFixture<AllAssignedProjectsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAssignedProjectsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllAssignedProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
