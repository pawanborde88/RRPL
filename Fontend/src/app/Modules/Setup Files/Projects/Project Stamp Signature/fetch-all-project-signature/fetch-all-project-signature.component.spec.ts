import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchAllProjectSignatureComponent } from './fetch-all-project-signature.component';

describe('FetchAllProjectSignatureComponent', () => {
  let component: FetchAllProjectSignatureComponent;
  let fixture: ComponentFixture<FetchAllProjectSignatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchAllProjectSignatureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchAllProjectSignatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
