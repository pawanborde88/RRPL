import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllAnngualGoals } from './all-anngual-goals';

describe('AllAnngualGoals', () => {
  let component: AllAnngualGoals;
  let fixture: ComponentFixture<AllAnngualGoals>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllAnngualGoals]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllAnngualGoals);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
