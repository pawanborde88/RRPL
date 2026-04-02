import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddNewEventUserComponent } from './add-new-event-user.component';

describe('AddNewEventUserComponent', () => {
  let component: AddNewEventUserComponent;
  let fixture: ComponentFixture<AddNewEventUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddNewEventUserComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddNewEventUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
