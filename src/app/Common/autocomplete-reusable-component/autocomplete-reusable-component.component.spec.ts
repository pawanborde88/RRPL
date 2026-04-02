import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutocompleteReusableComponent } from './autocomplete-reusable-component.component';

describe('AutocompleteReusableComponent', () => {
  let component: AutocompleteReusableComponent;
  let fixture: ComponentFixture<AutocompleteReusableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutocompleteReusableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AutocompleteReusableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
