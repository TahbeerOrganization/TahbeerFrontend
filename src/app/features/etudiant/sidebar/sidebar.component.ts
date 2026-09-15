import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {

  @Input() activePage: string = 'dashboard';

  isOpen = signal(false);

  constructor(
    public auth: AuthService
  ) {}

  toggle(): void {
    this.isOpen.update(value => !value);
  }

  close(): void {
    this.isOpen.set(false);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }

}
