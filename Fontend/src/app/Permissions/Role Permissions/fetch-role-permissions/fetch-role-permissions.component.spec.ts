import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchRolePermissionsComponent } from './fetch-role-permissions.component';

describe('FetchRolePermissionsComponent', () => {
  let component: FetchRolePermissionsComponent;
  let fixture: ComponentFixture<FetchRolePermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchRolePermissionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchRolePermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
