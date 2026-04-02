import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateSkillDialogComponent } from './add-update-skill-dialog.component';

describe('AddUpdateSkillDialogComponent', () => {
  let component: AddUpdateSkillDialogComponent;
  let fixture: ComponentFixture<AddUpdateSkillDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUpdateSkillDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUpdateSkillDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
