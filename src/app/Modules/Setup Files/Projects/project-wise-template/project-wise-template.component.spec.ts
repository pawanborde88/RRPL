import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWiseTemplateComponent } from './project-wise-template.component';

describe('ProjectWiseTemplateComponent', () => {
  let component: ProjectWiseTemplateComponent;
  let fixture: ComponentFixture<ProjectWiseTemplateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWiseTemplateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectWiseTemplateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
