import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddProjectleadComponent } from './add-projectlead.component';

describe('AddProjectleadComponent', () => {
  let component: AddProjectleadComponent;
  let fixture: ComponentFixture<AddProjectleadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddProjectleadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddProjectleadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
