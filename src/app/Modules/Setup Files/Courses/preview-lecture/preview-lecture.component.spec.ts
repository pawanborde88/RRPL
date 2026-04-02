import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewLectureComponent } from './preview-lecture.component';

describe('PreviewLectureComponent', () => {
  let component: PreviewLectureComponent;
  let fixture: ComponentFixture<PreviewLectureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewLectureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreviewLectureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
