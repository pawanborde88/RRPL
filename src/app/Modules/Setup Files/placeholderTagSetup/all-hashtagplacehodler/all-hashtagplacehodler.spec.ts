import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllHashtagplacehodler } from './all-hashtagplacehodler';

describe('AllHashtagplacehodler', () => {
  let component: AllHashtagplacehodler;
  let fixture: ComponentFixture<AllHashtagplacehodler>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllHashtagplacehodler]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllHashtagplacehodler);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
