import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllEventsUserLogComponent } from './all-events-user-log.component';

describe('AllEventsUserLogComponent', () => {
  let component: AllEventsUserLogComponent;
  let fixture: ComponentFixture<AllEventsUserLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllEventsUserLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllEventsUserLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
