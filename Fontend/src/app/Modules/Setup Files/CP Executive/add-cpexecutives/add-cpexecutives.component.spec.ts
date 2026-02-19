import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCPExecutivesComponent } from './add-cpexecutives.component';

describe('AddCPExecutivesComponent', () => {
  let component: AddCPExecutivesComponent;
  let fixture: ComponentFixture<AddCPExecutivesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCPExecutivesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCPExecutivesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
