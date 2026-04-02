import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchPermissionComponent } from './fetch-permission.component';

describe('FetchPermissionComponent', () => {
  let component: FetchPermissionComponent;
  let fixture: ComponentFixture<FetchPermissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchPermissionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchPermissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
