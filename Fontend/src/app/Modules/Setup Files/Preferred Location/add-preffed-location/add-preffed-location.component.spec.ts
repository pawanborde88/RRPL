import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPreffedLocationComponent } from './add-preffed-location.component';

describe('AddPreffedLocationComponent', () => {
  let component: AddPreffedLocationComponent;
  let fixture: ComponentFixture<AddPreffedLocationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPreffedLocationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddPreffedLocationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
