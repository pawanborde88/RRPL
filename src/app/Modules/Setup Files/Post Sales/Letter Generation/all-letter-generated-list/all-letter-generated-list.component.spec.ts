import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllLetterGeneratedListComponent } from './all-letter-generated-list.component';

describe('AllLetterGeneratedListComponent', () => {
  let component: AllLetterGeneratedListComponent;
  let fixture: ComponentFixture<AllLetterGeneratedListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllLetterGeneratedListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllLetterGeneratedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
