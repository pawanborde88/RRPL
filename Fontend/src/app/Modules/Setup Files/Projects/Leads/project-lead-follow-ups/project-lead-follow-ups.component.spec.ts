import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectLeadFollowUpsComponent } from './project-lead-follow-ups.component';

describe('ProjectLeadFollowUpsComponent', () => {
  let component: ProjectLeadFollowUpsComponent;
  let fixture: ComponentFixture<ProjectLeadFollowUpsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectLeadFollowUpsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectLeadFollowUpsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
