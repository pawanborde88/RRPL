import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFeedBakDialogComponent } from './add-feed-bak-dialog.component';

describe('AddFeedBakDialogComponent', () => {
  let component: AddFeedBakDialogComponent;
  let fixture: ComponentFixture<AddFeedBakDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFeedBakDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddFeedBakDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
