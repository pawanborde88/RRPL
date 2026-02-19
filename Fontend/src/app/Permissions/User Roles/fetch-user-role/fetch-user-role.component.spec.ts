import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchUserRoleComponent } from './fetch-user-role.component';

describe('FetchUserRoleComponent', () => {
  let component: FetchUserRoleComponent;
  let fixture: ComponentFixture<FetchUserRoleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchUserRoleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchUserRoleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
