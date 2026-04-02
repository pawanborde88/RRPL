import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllfeedbackListComponent } from './allfeedback-list.component';

describe('AllfeedbackListComponent', () => {
  let component: AllfeedbackListComponent;
  let fixture: ComponentFixture<AllfeedbackListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllfeedbackListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllfeedbackListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
