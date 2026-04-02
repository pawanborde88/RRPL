import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLeadLevelComponent } from './add-lead-level.component';

describe('AddLeadLevelComponent', () => {
  let component: AddLeadLevelComponent;
  let fixture: ComponentFixture<AddLeadLevelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLeadLevelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddLeadLevelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
