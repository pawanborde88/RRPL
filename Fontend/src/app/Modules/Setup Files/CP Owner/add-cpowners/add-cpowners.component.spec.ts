import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCPOwnersComponent } from './add-cpowners.component';

describe('AddCPOwnersComponent', () => {
  let component: AddCPOwnersComponent;
  let fixture: ComponentFixture<AddCPOwnersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCPOwnersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCPOwnersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
