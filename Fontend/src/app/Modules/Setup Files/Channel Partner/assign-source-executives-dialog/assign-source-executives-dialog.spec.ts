import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignSourceExecutivesDialog } from './assign-source-executives-dialog';

describe('AssignSourceExecutivesDialog', () => {
  let component: AssignSourceExecutivesDialog;
  let fixture: ComponentFixture<AssignSourceExecutivesDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignSourceExecutivesDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignSourceExecutivesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
