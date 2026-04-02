import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectStampSignatureDialogComponent } from './project-stamp-signature-dialog.component';

describe('ProjectStampSignatureDialogComponent', () => {
  let component: ProjectStampSignatureDialogComponent;
  let fixture: ComponentFixture<ProjectStampSignatureDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectStampSignatureDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectStampSignatureDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
