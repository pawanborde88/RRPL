import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonAddEditInsentiveDialogComponent } from './common-add-edit-insentive-dialog.component';

describe('CommonAddEditInsentiveDialogComponent', () => {
  let component: CommonAddEditInsentiveDialogComponent;
  let fixture: ComponentFixture<CommonAddEditInsentiveDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonAddEditInsentiveDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CommonAddEditInsentiveDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
