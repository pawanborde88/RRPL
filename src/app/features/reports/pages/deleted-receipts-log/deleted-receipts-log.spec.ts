import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeletedReceiptsLog } from './deleted-receipts-log';

describe('DeletedReceiptsLog', () => {
  let component: DeletedReceiptsLog;
  let fixture: ComponentFixture<DeletedReceiptsLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeletedReceiptsLog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeletedReceiptsLog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
