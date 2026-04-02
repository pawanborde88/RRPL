import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTokensComponent } from './add-tokens.component';

describe('AddTokensComponent', () => {
  let component: AddTokensComponent;
  let fixture: ComponentFixture<AddTokensComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTokensComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddTokensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
