import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SopPreviewComponent } from './sop-preview.component';

describe('SopPreviewComponent', () => {
  let component: SopPreviewComponent;
  let fixture: ComponentFixture<SopPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SopPreviewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SopPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
