import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-sourates',
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './sourates.component.html',
  styleUrl: './sourates.component.css'
})
export class SouratesComponent {

}
