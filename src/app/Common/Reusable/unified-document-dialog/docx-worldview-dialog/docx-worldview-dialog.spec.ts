import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocxWorldviewDialog } from './docx-worldview-dialog';

describe('DocxWorldviewDialog', () => {
  let component: DocxWorldviewDialog;
  let fixture: ComponentFixture<DocxWorldviewDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocxWorldviewDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocxWorldviewDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
