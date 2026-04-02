import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllLecturesComponent } from './all-lectures.component';

describe('AllLecturesComponent', () => {
  let component: AllLecturesComponent;
  let fixture: ComponentFixture<AllLecturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllLecturesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllLecturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
