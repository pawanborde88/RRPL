import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllSourceWiseTargets } from './all-source-wise-targets';

describe('AllSourceWiseTargets', () => {
  let component: AllSourceWiseTargets;
  let fixture: ComponentFixture<AllSourceWiseTargets>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllSourceWiseTargets]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllSourceWiseTargets);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
