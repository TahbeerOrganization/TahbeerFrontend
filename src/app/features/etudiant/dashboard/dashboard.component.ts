import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ CommonModule, RouterLink, SidebarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  // ═══════════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════════

  loading = signal(true);

  // ═══════════════════════════════════════════════
  // ETUDIANT
  // ═══════════════════════════════════════════════

  etudiant = signal<any>(null);

  // ═══════════════════════════════════════════════
  // PRESENCE
  // ═══════════════════════════════════════════════

  presences = signal<any[]>([]);

  presenceCount = computed(() =>
    this.presences().filter(
      p => p.statut === 'حاضر'
    ).length
  );

  absenceCount = computed(() =>
    this.presences().filter(
      p => p.statut === 'غائب'
    ).length
  );

  totalPresences = computed(() =>
    this.presences().length
  );

  tauxPresence = computed(() => {
    const total = this.totalPresences();

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (this.presenceCount() / total) * 100
    );
  });

  // ═══════════════════════════════════════════════
  // HIFD
  // ═══════════════════════════════════════════════

  suiviSourates = signal<any[]>([]);

  sourates = signal<any[]>([]);

  selectedSourate = signal<any>(null);

  souratesMktmla = computed(() =>
    this.suiviSourates().filter(
      s => s.statut === 'مكتملة'
    ).length
  );

  souratesEnCours = computed(() =>
    this.suiviSourates().filter(
      s => s.statut !== 'مكتملة'
    ).length
  );

  tauxHifd = computed(() => {

    const total = this.suiviSourates().length;

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (this.souratesMktmla() / total) * 100
    );
  });

  // ═══════════════════════════════════════════════
  // DEVOIRS
  // ═══════════════════════════════════════════════

  devoirs = signal<any[]>([]);

  devoirsTotal = computed(() =>
    this.devoirs().length
  );

  devoirsRemis = computed(() =>
    this.devoirs().filter(
      d => d.statut === 'مسلم' || d.statut === 'تم التسليم'
    ).length
  );

  devoirsNonRemis = computed(() =>
    this.devoirs().filter(
      d => d.statut === 'لم يسلّم'
    ).length
  );

  // ═══════════════════════════════════════════════
  // GRAPH HIFD
  // ═══════════════════════════════════════════════

  hifdGraph = computed(() => {

    return this.suiviSourates()
      .slice()
      .sort((a, b) => {

        const dateA = new Date(
          a.updated_at || a.created_at || 0
        ).getTime();

        const dateB = new Date(
          b.updated_at || b.created_at || 0
        ).getTime();

        return dateA - dateB;
      })
      .map((s, index) => {

        const completed = this.suiviSourates()
          .slice(0, index + 1)
          .filter(
            x => x.statut === 'مكتملة'
          ).length;

        return {
          date: s.updated_at || s.created_at,
          value: completed
        };

      });
  });

  // ═══════════════════════════════════════════════
  // CONSTRUCTOR
  // ═══════════════════════════════════════════════

  constructor(
    public auth: AuthService,
    private sb: SupabaseService,
    private router: Router
  ) {}

  // ═══════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════

  ngOnInit() {
    this.loadDashboard();
  }

  // ═══════════════════════════════════════════════
  // LOAD DASHBOARD
  // ═══════════════════════════════════════════════

  async loadDashboard() {

    this.loading.set(true);

    try {

      const user = this.auth.currentUser();

      if (!user?.id) {
        console.error('Aucun étudiant connecté');
        return;
      }

      await Promise.all([
        this.loadEtudiant(user.id),
        this.loadPresences(user.id),
        this.loadSuiviSourates(user.id),
        this.loadDevoirs(user.id)
      ]);

    } catch (error) {

      console.error(
        'Dashboard étudiant error:',
        error
      );

    } finally {

      this.loading.set(false);

    }
  }

  // ═══════════════════════════════════════════════
  // LOAD ETUDIANT
  // ═══════════════════════════════════════════════

  async loadEtudiant(id: string) {

    const { data, error } = await this.sb.client
      .from('profiles')
      .select(`
        *,
        groupes(
          id,
          nom,
          type
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(
        'Erreur étudiant:',
        error
      );
      return;
    }

    this.etudiant.set(data);
  }

  // ═══════════════════════════════════════════════
  // LOAD PRESENCES
  // ═══════════════════════════════════════════════

  async loadPresences(id: string) {

    const { data, error } = await this.sb.client
      .from('presences')
      .select('*')
      .eq('etudiant_id', id)
      .order('date', {
        ascending: false
      });

    if (error) {

      console.error(
        'Erreur présences:',
        error
      );

      return;
    }

    this.presences.set(data || []);
  }

  // ═══════════════════════════════════════════════
  // LOAD SUIVI SOURATES
  // ═══════════════════════════════════════════════

  async loadSuiviSourates(id: string) {

    const { data, error } = await this.sb.client
      .from('suivi_sourates')
      .select('*')
      .eq('etudiant_id', id)
      .order('created_at', {
        ascending: true
      });

    if (error) {

      console.error(
        'Erreur suivi sourates:',
        error
      );

      return;
    }

    this.suiviSourates.set(data || []);

    /*
     * On récupère les sourates uniques
     * pour le select.
     */

    const unique = new Map();

    (data || []).forEach((item: any) => {

      const nom =
        item.sourate ||
        item.nom_sourate ||
        item.sourate_nom;

      if (nom && !unique.has(nom)) {

        unique.set(
          nom,
          item
        );

      }

    });

    const list = Array.from(
      unique.values()
    );

    this.sourates.set(list);

    if (list.length > 0) {

      this.selectedSourate.set(
        list[0]
      );

    }
  }

  // ═══════════════════════════════════════════════
  // LOAD DEVOIRS
  // ═══════════════════════════════════════════════

  async loadDevoirs(id: string) {

    const { data, error } = await this.sb.client
      .from('soumissions')
      .select(`
        *,
        devoirs(
          id,
          titre,
          description,
          deadline
        )
      `)
      .eq('etudiant_id', id)
      .order('created_at', {
        ascending: false
      });

    if (error) {

      console.error(
        'Erreur devoirs:',
        error
      );

      return;
    }

    this.devoirs.set(data || []);
  }

  // ═══════════════════════════════════════════════
  // SELECT SOURATE
  // ═══════════════════════════════════════════════

  selectSourate(event: Event) {

    const value =
      (event.target as HTMLSelectElement).value;

    const sourate =
      this.sourates().find(
        s =>
          String(
            s.id ||
            s.sourate ||
            s.nom_sourate
          ) === value
      );

    this.selectedSourate.set(
      sourate || null
    );
  }

  // ═══════════════════════════════════════════════
  // SOURATE HELPERS
  // ═══════════════════════════════════════════════

  getSourateName(sourate: any): string {

    return (
      sourate?.sourate ||
      sourate?.nom_sourate ||
      sourate?.sourate_nom ||
      '—'
    );
  }

  getSourateProgress(sourate: any): number {

    if (!sourate) {
      return 0;
    }

    /*
     * Si ta table contient déjà un pourcentage.
     */

    if (sourate.progression != null) {
      return Number(
        sourate.progression
      );
    }

    if (sourate.pourcentage != null) {
      return Number(
        sourate.pourcentage
      );
    }

    /*
     * Si la sourate est complète.
     */

    if (
      sourate.statut === 'مكتملة'
    ) {
      return 100;
    }

    /*
     * Sinon on considère qu'elle
     * est en cours.
     */

    return 0;
  }

  getSourateStatus(sourate: any): string {

    if (!sourate) {
      return '—';
    }

    return (
      sourate.statut ||
      'غير محدد'
    );
  }

  // ═══════════════════════════════════════════════
  // DATE
  // ═══════════════════════════════════════════════

  today(): string {

    return new Date()
      .toLocaleDateString(
        'ar-MA',
        {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }
      );
  }

  formatDate(date: string): string {

    if (!date) {
      return '—';
    }

    return new Date(date)
      .toLocaleDateString(
        'ar-MA',
        {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }
      );
  }

  // ═══════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════

  navigateTo(path: string) {

    this.router.navigate([
      '/etudiant',
      path
    ]);

  }

}
