import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLecturesComponent } from './add-lectures.component';

describe('AddLecturesComponent', () => {
  let component: AddLecturesComponent;
  let fixture: ComponentFixture<AddLecturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLecturesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddLecturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
