import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FetchModuleComponent } from './fetch-module.component';

describe('FetchModuleComponent', () => {
  let component: FetchModuleComponent;
  let fixture: ComponentFixture<FetchModuleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FetchModuleComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(FetchModuleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
