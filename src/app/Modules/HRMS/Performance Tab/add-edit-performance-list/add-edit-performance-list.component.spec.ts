import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEditPerformanceListComponent } from './add-edit-performance-list.component';

describe('AddEditPerformanceListComponent', () => {
  let component: AddEditPerformanceListComponent;
  let fixture: ComponentFixture<AddEditPerformanceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditPerformanceListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddEditPerformanceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
