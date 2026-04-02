import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllUserLoginLogComponent } from './all-user-login-log.component';

describe('AllUserLoginLogComponent', () => {
  let component: AllUserLoginLogComponent;
  let fixture: ComponentFixture<AllUserLoginLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllUserLoginLogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AllUserLoginLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
