import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguagesCardViewComponent } from './languages-card-view.component';

describe('LanguagesCardViewComponent', () => {
  let component: LanguagesCardViewComponent;
  let fixture: ComponentFixture<LanguagesCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguagesCardViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LanguagesCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
