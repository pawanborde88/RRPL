import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLetterGenerationDialogComponent } from './add-letter-generation-dialog.component';

describe('AddLetterGenerationDialogComponent', () => {
  let component: AddLetterGenerationDialogComponent;
  let fixture: ComponentFixture<AddLetterGenerationDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddLetterGenerationDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddLetterGenerationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
