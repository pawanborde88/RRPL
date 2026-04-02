import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditLeaveCreditComponent } from './add-edit-leave-credit.component';

describe('AddEditLeaveCreditComponent', () => {
  let component: AddEditLeaveCreditComponent;
  let fixture: ComponentFixture<AddEditLeaveCreditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditLeaveCreditComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditLeaveCreditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
