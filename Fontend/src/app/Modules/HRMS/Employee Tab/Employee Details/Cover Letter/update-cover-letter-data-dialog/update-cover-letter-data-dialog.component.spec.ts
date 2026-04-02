import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateCoverLetterDataDialogComponent } from './update-cover-letter-data-dialog.component';

describe('UpdateCoverLetterDataDialogComponent', () => {
  let component: UpdateCoverLetterDataDialogComponent;
  let fixture: ComponentFixture<UpdateCoverLetterDataDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UpdateCoverLetterDataDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateCoverLetterDataDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
