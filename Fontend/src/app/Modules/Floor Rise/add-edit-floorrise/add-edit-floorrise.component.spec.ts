import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditFloorriseComponent } from './add-edit-floorrise.component';

describe('AddEditFloorriseComponent', () => {
  let component: AddEditFloorriseComponent;
  let fixture: ComponentFixture<AddEditFloorriseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditFloorriseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditFloorriseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
