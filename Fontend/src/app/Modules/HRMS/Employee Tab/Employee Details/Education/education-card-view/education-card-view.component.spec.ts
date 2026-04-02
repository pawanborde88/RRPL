import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EducationCardViewComponent } from './education-card-view.component';

describe('EducationCardViewComponent', () => {
  let component: EducationCardViewComponent;
  let fixture: ComponentFixture<EducationCardViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EducationCardViewComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EducationCardViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
