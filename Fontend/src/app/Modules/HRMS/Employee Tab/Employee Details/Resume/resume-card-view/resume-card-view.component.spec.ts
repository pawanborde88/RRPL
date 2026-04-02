import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResumeCardViewComponent } from './resume-card-view.component';

describe('ResumeCardViewComponent', () => {
  let component: ResumeCardViewComponent;
  let fixture: ComponentFixture<ResumeCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResumeCardViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResumeCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
