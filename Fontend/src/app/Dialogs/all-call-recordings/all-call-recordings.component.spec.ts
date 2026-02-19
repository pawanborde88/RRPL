import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCallRecordingsComponent } from './all-call-recordings.component';

describe('AllCallRecordingsComponent', () => {
  let component: AllCallRecordingsComponent;
  let fixture: ComponentFixture<AllCallRecordingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCallRecordingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllCallRecordingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
