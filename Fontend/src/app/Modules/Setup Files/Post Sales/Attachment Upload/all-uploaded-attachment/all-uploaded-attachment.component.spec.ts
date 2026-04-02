import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllUploadedAttachmentComponent } from './all-uploaded-attachment.component';

describe('AllUploadedAttachmentComponent', () => {
  let component: AllUploadedAttachmentComponent;
  let fixture: ComponentFixture<AllUploadedAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllUploadedAttachmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllUploadedAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
