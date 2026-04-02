import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularMaterialModule } from '../../../../angular-material.module';

@Component({
  selector: 'app-no-data-error-message',
  standalone :true,
  imports :[AngularMaterialModule, CommonModule],
  templateUrl: './no-data-error-message.component.html',
  styleUrls: ['./no-data-error-message.component.scss']
})
export class NoDataErrorMessageComponent implements OnInit {
  constructor() { }

  ngOnInit(): void {
  }

  @Input() dataArray: any[] = [];
  @Input() noDataErrorMessage: string = '';
}
