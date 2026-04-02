import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectOwner } from './project-owner';

describe('ProjectOwner', () => {
  let component: ProjectOwner;
  let fixture: ComponentFixture<ProjectOwner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectOwner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectOwner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
