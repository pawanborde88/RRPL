import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchRolesComponent } from './fetch-roles.component';

describe('FetchRolesComponent', () => {
  let component: FetchRolesComponent;
  let fixture: ComponentFixture<FetchRolesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchRolesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchRolesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
