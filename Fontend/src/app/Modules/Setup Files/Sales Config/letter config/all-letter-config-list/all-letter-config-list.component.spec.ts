import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllLetterConfigListComponent } from './all-letter-config-list.component';

describe('AllLetterConfigListComponent', () => {
  let component: AllLetterConfigListComponent;
  let fixture: ComponentFixture<AllLetterConfigListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllLetterConfigListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllLetterConfigListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
