import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectwiseQRComponent } from './projectwise-qr.component';

describe('ProjectwiseQRComponent', () => {
  let component: ProjectwiseQRComponent;
  let fixture: ComponentFixture<ProjectwiseQRComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectwiseQRComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProjectwiseQRComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
