import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AngularMaterialModule } from '../../../../angular-material.module';

@Component({
  selector: 'app-loader',
  standalone: true,
   imports: [ CommonModule, AngularMaterialModule],
 
  templateUrl: './loader.component.html',
  styleUrl: './loader.component.scss'
})
export class LoaderComponent {

}
