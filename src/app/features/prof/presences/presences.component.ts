import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-presences',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './presences.component.html',
  styleUrl: './presences.component.css'
})
export class PresencesComponent implements OnInit {

  // ── Données ────────────────────────────────────
  etudiants = signal<any[]>([]);
  groupes = signal<any[]>([]);
  presences = signal<any[]>([]);

  // ── UI State ───────────────────────────────────
  loading = signal(true);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  // ── Filtres ────────────────────────────────────
  selectedDate = signal(new Date().toISOString().split('T')[0]);
  selectedGroupe = signal('');

  // ── Stats ──────────────────────────────────────
  totalPresents = signal(0);
  totalAbsents = signal(0);
  totalRetards = signal(0);

  constructor(
    private sb: SupabaseService,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.loadGroupes();
    this.loadEtudiants();
  }

  async loadGroupes() {
    const { data } = await this.sb.client
      .from('groupes')
      .select('*')
      .order('nom');
    this.groupes.set(data || []);
  }

  async loadEtudiants() {
    this.loading.set(true);

    let query = this.sb.client
      .from('profiles')
      .select('*, groupes(id, nom, type)')
      .eq('role', 'etudiant')
      .order('nom');

    if (this.selectedGroupe()) {
      query = query.eq('groupe_id', this.selectedGroupe());
    }

    const { data: etudiants } = await query;

    // Charger les présences du jour sélectionné
    const { data: presences } = await this.sb.client
      .from('presences')
      .select('*')
      .eq('date', this.selectedDate());

    // Fusionner — pour chaque étudiant, trouver sa présence
    const merged = (etudiants || []).map(e => ({
      ...e,
      statut: presences?.find(p => p.etudiant_id === e.id)?.statut || null,
      presence_id: presences?.find(p => p.etudiant_id === e.id)?.id || null,
      note: presences?.find(p => p.etudiant_id === e.id)?.note || ''
    }));

    this.etudiants.set(merged);
    this.calculerStats(merged);
    this.loading.set(false);
  }

  calculerStats(etudiants: any[]) {
    this.totalPresents.set(etudiants.filter(e => e.statut === 'حاضر').length);
    this.totalAbsents.set(etudiants.filter(e => e.statut === 'غائب').length);
    this.totalRetards.set(etudiants.filter(e => e.statut === 'متأخر').length);
  }

  // ── Changer statut d'un étudiant ───────────────
  async setStatut(etudiant: any, statut: string) {
    // Mettre à jour localement d'abord (UX rapide)
    const updated = this.etudiants().map(e =>
      e.id === etudiant.id ? { ...e, statut } : e
    );
    this.etudiants.set(updated);
    this.calculerStats(updated);

    // Sauvegarder dans Supabase
    const { error } = await this.sb.client
      .from('presences')
      .upsert({
        etudiant_id: etudiant.id,
        date: this.selectedDate(),
        statut: statut
      }, { onConflict: 'etudiant_id,date' });

    if (error) {
      this.errorMsg.set('خطأ في حفظ الحضور');
      setTimeout(() => this.errorMsg.set(''), 3000);
    }
  }

  // ── Marquer tous présents ──────────────────────
  async marquerTousPresents() {
    this.saving.set(true);
    const promises = this.etudiants().map(e =>
      this.sb.client.from('presences').upsert({
        etudiant_id: e.id,
        date: this.selectedDate(),
        statut: 'حاضر'
      }, { onConflict: 'etudiant_id,date' })
    );
    await Promise.all(promises);
    await this.loadEtudiants();
    this.successMsg.set('✅ تم تسجيل جميع الطلاب حاضرين!');
    setTimeout(() => this.successMsg.set(''), 3000);
    this.saving.set(false);
  }

  // ── Changer date ───────────────────────────────
  onDateChange(date: string) {
    this.selectedDate.set(date);
    this.loadEtudiants();
  }

  // ── Changer groupe ─────────────────────────────
  onGroupeChange(groupeId: string) {
    this.selectedGroupe.set(groupeId);
    this.loadEtudiants();
  }

  // ── Helpers ────────────────────────────────────
  getStatutClass(statut: string): string {
    const classes: any = {
      'حاضر': 'btn-present active',
      'غائب': 'btn-absent active',
      'متأخر': 'btn-retard active',
      'معذور': 'btn-excuse active'
    };
    return classes[statut] || '';
  }

  getTauxPresence(): number {
    const total = this.etudiants().length;
    if (total === 0) return 0;
    return Math.round((this.totalPresents() / total) * 100);
  }

  isToday(): boolean {
    return this.selectedDate() === new Date().toISOString().split('T')[0];
  }
}