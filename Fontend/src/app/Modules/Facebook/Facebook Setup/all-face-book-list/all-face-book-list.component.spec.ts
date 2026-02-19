import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllFaceBookListComponent } from './all-face-book-list.component';

describe('AllFaceBookListComponent', () => {
  let component: AllFaceBookListComponent;
  let fixture: ComponentFixture<AllFaceBookListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllFaceBookListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllFaceBookListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
