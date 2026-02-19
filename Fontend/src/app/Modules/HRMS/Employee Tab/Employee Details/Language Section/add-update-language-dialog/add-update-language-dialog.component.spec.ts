import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUpdateLanguageDialogComponent } from './add-update-language-dialog.component';

describe('AddUpdateLanguageDialogComponent', () => {
  let component: AddUpdateLanguageDialogComponent;
  let fixture: ComponentFixture<AddUpdateLanguageDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddUpdateLanguageDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUpdateLanguageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
