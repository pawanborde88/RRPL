import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';

@Component({
  selector: 'app-main-heading',
  templateUrl: './main-heading.component.html',
  standalone: true,
  imports: [ AngularMaterialModule],
  styleUrls: ['./main-heading.component.scss']
})
export class MainHeadingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
