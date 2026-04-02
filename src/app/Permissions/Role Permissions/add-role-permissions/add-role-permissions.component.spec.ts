import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddRolePermissionsComponent } from './add-role-permissions.component';

describe('AddRolePermissionsComponent', () => {
  let component: AddRolePermissionsComponent;
  let fixture: ComponentFixture<AddRolePermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRolePermissionsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddRolePermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
