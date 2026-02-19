import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProjctsComponent } from './user-projcts.component';

describe('UserProjctsComponent', () => {
  let component: UserProjctsComponent;
  let fixture: ComponentFixture<UserProjctsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProjctsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UserProjctsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
