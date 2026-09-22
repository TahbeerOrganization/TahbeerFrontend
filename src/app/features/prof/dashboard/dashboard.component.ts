import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  totalEtudiants = signal(0);
  presenceAujourdhui = signal(0);
  souratesMktmla = signal(0);
  devoirsEnAttente = signal(0);

  etudiants = signal<any[]>([]);
  presencesAujourdhui = signal<any[]>([]);
  devoirsRecents = signal<any[]>([]);
  alertesGiaab = signal<any[]>([]);

  loading = signal(true);
  errorMsg = signal('');
  activeMenu = signal('dashboard');

  constructor(
    public auth: AuthService,
    private sb: SupabaseService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      await Promise.all([
        this.loadEtudiants(),
        this.loadPresences(),
        this.loadSourates(),
        this.loadDevoirs(),
        this.loadAbsences()
      ]);
    } catch (error: any) {
      console.error('Dashboard:', error);
      this.errorMsg.set(
        error?.message || 'خطأ في تحميل لوحة التحكم'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async loadEtudiants(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('profiles')
      .select('id, nom, role, groupe_id, niveau, created_at')
      .eq('role', 'etudiant')
      .order('nom');

    if (error) {
      console.error('Erreur étudiants:', error);
      throw error;
    }

    const liste = data ?? [];

    this.etudiants.set(liste);
    this.totalEtudiants.set(liste.length);

    console.log('Étudiants:', liste);
    console.log('Total étudiants:', liste.length);
  }

  async loadPresences(): Promise<void> {
    const today = new Date()
      .toISOString()
      .split('T')[0];

    const { data, error } = await this.sb.client
      .from('presences')
      .select('*, profiles(nom, groupe_id)')
      .eq('date', today);

    if (error) {
      console.error('Erreur présences:', error);
      this.presencesAujourdhui.set([]);
      this.presenceAujourdhui.set(0);
      return;
    }

    const liste = data ?? [];

    this.presencesAujourdhui.set(liste);

    this.presenceAujourdhui.set(
      liste.filter(
        (p: any) => p.statut === 'حاضر'
      ).length
    );
  }

  async loadSourates(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('suivi_sourates')
      .select('id')
      .eq('statut', 'مكتملة');

    if (error) {
      console.error('Erreur sourates:', error);
      this.souratesMktmla.set(0);
      return;
    }

    this.souratesMktmla.set(
      data?.length ?? 0
    );
  }

  async loadDevoirs(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('soumissions')
      .select(`
        *,
        devoirs(titre, deadline),
        profiles(nom)
      `)
      .eq('statut', 'لم يسلّم');

    if (error) {
      console.error('Erreur devoirs:', error);
      this.devoirsRecents.set([]);
      this.devoirsEnAttente.set(0);
      return;
    }

    const liste = data ?? [];

    this.devoirsRecents.set(
      liste.slice(0, 5)
    );

    this.devoirsEnAttente.set(
      liste.length
    );
  }

  async loadAbsences(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('presences')
      .select(`
        etudiant_id,
        statut,
        profiles(nom)
      `)
      .eq('statut', 'غائب');

    if (error) {
      console.error('Erreur absences:', error);
      this.alertesGiaab.set([]);
      return;
    }

    const counts: Record<string, any> = {};

    (data ?? []).forEach((p: any) => {

      if (!p.etudiant_id) {
        return;
      }

      if (!counts[p.etudiant_id]) {
        counts[p.etudiant_id] = {
          id: p.etudiant_id,
          nom: p.profiles?.nom || 'طالب',
          count: 0
        };
      }

      counts[p.etudiant_id].count++;
    });

    const alertes = Object.values(counts)
      .filter(
        (x: any) => x.count >= 2
      )
      .sort(
        (a: any, b: any) =>
          b.count - a.count
      )
      .slice(0, 5);

    this.alertesGiaab.set(alertes);
  }

  getTauxPresence(): number {
    const total = this.totalEtudiants();

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (this.presenceAujourdhui() / total) * 100
    );
  }

  getBadgeGroupe(type?: string): string {
    switch (type) {
      case 'رجال':
        return 'badge-blue';

      case 'نساء':
        return 'badge-purple';

      case 'أطفال':
        return 'badge-green';

      default:
        return 'badge-gray';
    }
  }

  getNiveauBadge(niveau?: string): string {
    switch (niveau) {
      case 'مبتدئ':
        return 'badge-green';

      case 'متوسط':
        return 'badge-blue';

      case 'متقدم':
        return 'badge-purple';

      default:
        return 'badge-gray';
    }
  }

  navigateTo(path: string): void {
    this.activeMenu.set(path);
    this.router.navigate(['/prof', path]);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  today(): string {
    return new Date().toLocaleDateString(
      'ar-MA',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );
  }
}