import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoalsForm } from './goals-form';

describe('GoalsForm', () => {
  let component: GoalsForm;
  let fixture: ComponentFixture<GoalsForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoalsForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoalsForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
