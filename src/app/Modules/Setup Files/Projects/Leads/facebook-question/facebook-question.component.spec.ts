import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacebookQuestionComponent } from './facebook-question.component';

describe('FacebookQuestionComponent', () => {
  let component: FacebookQuestionComponent;
  let fixture: ComponentFixture<FacebookQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacebookQuestionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FacebookQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
