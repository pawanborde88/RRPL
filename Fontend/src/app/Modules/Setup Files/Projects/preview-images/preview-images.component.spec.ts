import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewImagesComponent } from './preview-images.component';

describe('PreviewImagesComponent', () => {
  let component: PreviewImagesComponent;
  let fixture: ComponentFixture<PreviewImagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewImagesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreviewImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
