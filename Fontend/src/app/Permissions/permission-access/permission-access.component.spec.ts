import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionAccessComponent } from './permission-access.component';

describe('PermissionAccessComponent', () => {
  let component: PermissionAccessComponent;
  let fixture: ComponentFixture<PermissionAccessComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionAccessComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PermissionAccessComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
