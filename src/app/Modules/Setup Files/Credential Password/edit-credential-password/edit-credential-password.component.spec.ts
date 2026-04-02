import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCredentialPasswordComponent } from './edit-credential-password.component';

describe('EditCredentialPasswordComponent', () => {
  let component: EditCredentialPasswordComponent;
  let fixture: ComponentFixture<EditCredentialPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCredentialPasswordComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditCredentialPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
