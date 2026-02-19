import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCredentialPasswordComponent } from './add-credential-password.component';

describe('AddCredentialPasswordComponent', () => {
  let component: AddCredentialPasswordComponent;
  let fixture: ComponentFixture<AddCredentialPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCredentialPasswordComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddCredentialPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
