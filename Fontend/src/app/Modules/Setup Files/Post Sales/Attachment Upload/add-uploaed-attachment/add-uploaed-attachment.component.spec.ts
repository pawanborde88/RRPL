import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUploaedAttachmentComponent } from './add-uploaed-attachment.component';

describe('AddUploaedAttachmentComponent', () => {
  let component: AddUploaedAttachmentComponent;
  let fixture: ComponentFixture<AddUploaedAttachmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUploaedAttachmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUploaedAttachmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
