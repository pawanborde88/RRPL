import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DigitalAllFacebookBudget } from './digital-all-facebook-budget';

describe('DigitalAllFacebookBudget', () => {
  let component: DigitalAllFacebookBudget;
  let fixture: ComponentFixture<DigitalAllFacebookBudget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DigitalAllFacebookBudget]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DigitalAllFacebookBudget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
