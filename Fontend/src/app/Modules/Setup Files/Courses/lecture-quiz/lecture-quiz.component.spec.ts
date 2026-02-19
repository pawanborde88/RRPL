import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LectureQuizComponent } from './lecture-quiz.component';

describe('LectureQuizComponent', () => {
  let component: LectureQuizComponent;
  let fixture: ComponentFixture<LectureQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LectureQuizComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LectureQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
