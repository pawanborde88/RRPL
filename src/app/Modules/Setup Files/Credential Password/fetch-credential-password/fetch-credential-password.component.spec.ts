import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchCredentialPasswordComponent } from './fetch-credential-password.component';

describe('FetchCredentialPasswordComponent', () => {
  let component: FetchCredentialPasswordComponent;
  let fixture: ComponentFixture<FetchCredentialPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchCredentialPasswordComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchCredentialPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
