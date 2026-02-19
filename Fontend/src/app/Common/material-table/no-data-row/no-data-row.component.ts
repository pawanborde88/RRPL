import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../../angular-material.module';

@Component({
  selector: 'app-no-data-row',
  templateUrl: './no-data-row.component.html',
  standalone: true,
  imports: [ AngularMaterialModule],
  styleUrls: ['./no-data-row.component.scss']
})
export class NoDataRowComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
