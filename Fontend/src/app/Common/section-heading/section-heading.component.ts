import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AngularMaterialModule } from '../../../angular-material.module';

@Component({
  selector: 'app-section-heading',
  templateUrl: './section-heading.component.html',
  standalone: true,
  imports: [ AngularMaterialModule],
  styleUrls: ['./section-heading.component.scss']
})
export class SectionHeadingComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
