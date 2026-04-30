import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllFaceSpend } from './all-face-spend';

describe('AllFaceSpend', () => {
  let component: AllFaceSpend;
  let fixture: ComponentFixture<AllFaceSpend>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllFaceSpend]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllFaceSpend);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
