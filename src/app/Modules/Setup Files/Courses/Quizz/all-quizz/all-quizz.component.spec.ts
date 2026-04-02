import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllQuizzComponent } from './all-quizz.component';

describe('AllQuizzComponent', () => {
  let component: AllQuizzComponent;
  let fixture: ComponentFixture<AllQuizzComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllQuizzComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllQuizzComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
