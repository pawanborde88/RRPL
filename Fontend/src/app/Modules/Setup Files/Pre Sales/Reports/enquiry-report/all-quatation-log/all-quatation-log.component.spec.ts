import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllQuatationLogComponent } from './all-quatation-log.component';

describe('AllQuatationLogComponent', () => {
  let component: AllQuatationLogComponent;
  let fixture: ComponentFixture<AllQuatationLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllQuatationLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllQuatationLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
