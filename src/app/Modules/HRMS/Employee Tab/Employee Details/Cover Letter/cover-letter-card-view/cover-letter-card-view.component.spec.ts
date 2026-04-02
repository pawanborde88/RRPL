import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CoverLetterCardViewComponent } from './cover-letter-card-view.component';

describe('CoverLetterCardViewComponent', () => {
  let component: CoverLetterCardViewComponent;
  let fixture: ComponentFixture<CoverLetterCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CoverLetterCardViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CoverLetterCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
