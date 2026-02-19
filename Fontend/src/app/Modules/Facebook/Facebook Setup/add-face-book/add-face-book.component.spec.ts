import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFaceBookComponent } from './add-face-book.component';

describe('AddFaceBookComponent', () => {
  let component: AddFaceBookComponent;
  let fixture: ComponentFixture<AddFaceBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFaceBookComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddFaceBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
