import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllclientCallLogsComponent } from './allclient-call-logs.component';

describe('AllclientCallLogsComponent', () => {
  let component: AllclientCallLogsComponent;
  let fixture: ComponentFixture<AllclientCallLogsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllclientCallLogsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllclientCallLogsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
