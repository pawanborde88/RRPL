import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectLeadsComponent } from './project-leads.component';

describe('ProjectLeadsComponent', () => {
  let component: ProjectLeadsComponent;
  let fixture: ComponentFixture<ProjectLeadsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectLeadsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectLeadsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
