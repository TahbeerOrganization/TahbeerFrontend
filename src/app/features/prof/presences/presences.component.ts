import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  etudiants = signal<any[]>([]);
  groupes = signal<any[]>([]);
  presences = signal<any[]>([]);

  loading = signal(true);
  saving = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  selectedDate = signal(new Date().toISOString().split('T')[0]);
  selectedGroupe = signal('');

  totalPresents = signal(0);
  totalAbsents = signal(0);
  totalRetards = signal(0);

  constructor(
    private sb: SupabaseService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      await this.loadGroupes();
      await this.loadEtudiants();
    } catch (error: any) {
      console.error('Erreur chargement présences:', error);
      this.errorMsg.set(error?.message || 'خطأ في تحميل البيانات');
    } finally {
      this.loading.set(false);
    }
  }

  async loadGroupes(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('groupes')
      .select('id, nom, type')
      .order('nom');

    if (error) {
      console.error('Erreur groupes:', error);
      throw error;
    }

    this.groupes.set(data ?? []);
  }

async loadEtudiants(): Promise<void> {
  this.loading.set(true);
  this.errorMsg.set('');

  try {
    // 1. Charger les étudiants
    let query = this.sb.client
      .from('profiles')
      .select('id, nom, role, groupe_id, niveau')
      .eq('role', 'etudiant')
      .order('nom');

    // 2. Filtrer par groupe si nécessaire
    if (this.selectedGroupe()) {
      query = query.eq('groupe_id', this.selectedGroupe());
    }

    const { data: etudiants, error: etudiantsError } = await query;

    if (etudiantsError) {
      throw etudiantsError;
    }

    // 3. Charger les présences pour la date sélectionnée
    const { data: presences, error: presencesError } = await this.sb.client
      .from('presences')
      .select('id, etudiant_id, statut, note')
      .eq('date', this.selectedDate());

    if (presencesError) {
      throw presencesError;
    }

    // 4. Fusionner étudiants + présence
    const merged = (etudiants ?? []).map((etudiant: any) => {
      const presence = (presences ?? []).find(
        (p: any) => p.etudiant_id === etudiant.id
      );

      return {
        ...etudiant,
        statut: presence?.statut ?? null,
        presence_id: presence?.id ?? null,
        note: presence?.note ?? ''
      };
    });

    // 5. Mettre à jour l'écran
    this.etudiants.set(merged);
    this.calculerStats(merged);

  } catch (error: any) {
    console.error('Erreur chargement étudiants:', error);

    this.errorMsg.set(
      error?.message || 'خطأ في تحميل الطلاب'
    );

    this.etudiants.set([]);
    this.calculerStats([]);

  } finally {
    this.loading.set(false);
  }
}


  calculerStats(etudiants: any[]): void {
    this.totalPresents.set(
      etudiants.filter(e => e.statut === 'حاضر').length
    );

    this.totalAbsents.set(
      etudiants.filter(e => e.statut === 'غائب').length
    );

    this.totalRetards.set(
      etudiants.filter(e => e.statut === 'متأخر').length
    );
  }

  async setStatut(
    etudiant: any,
    statut: string
  ): Promise<void> {

    const oldEtudiants = this.etudiants();

    // Mise à jour immédiate de l'interface
    const updated = oldEtudiants.map(e =>
      e.id === etudiant.id
        ? { ...e, statut }
        : e
    );

    this.etudiants.set(updated);
    this.calculerStats(updated);

    try {
      const { data: existing, error: findError } =
        await this.sb.client
          .from('presences')
          .select('id')
          .eq('etudiant_id', etudiant.id)
          .eq('date', this.selectedDate())
          .maybeSingle();

      if (findError) {
        throw findError;
      }

      if (existing) {

        const { error } = await this.sb.client
          .from('presences')
          .update({
            statut
          })
          .eq('id', existing.id);

        if (error) {
          throw error;
        }

      } else {

        const { error } = await this.sb.client
          .from('presences')
          .insert({
            etudiant_id: etudiant.id,
            date: this.selectedDate(),
            statut
          });

        if (error) {
          throw error;
        }
      }

    } catch (error: any) {

      console.error('Erreur statut:', error);

      // Restaurer l'ancien état
      this.etudiants.set(oldEtudiants);
      this.calculerStats(oldEtudiants);

      this.errorMsg.set(
        error?.message || 'خطأ في تسجيل الحضور'
      );

      setTimeout(() => {
        this.errorMsg.set('');
      }, 3000);
    }
  }

  async marquerTousPresents(): Promise<void> {

    const etudiants = this.etudiants();

    if (etudiants.length === 0) {
      this.errorMsg.set('لا يوجد طلاب لتسجيل الحضور');
      return;
    }

    this.saving.set(true);
    this.errorMsg.set('');

    try {

      const rows = etudiants.map(e => ({
        etudiant_id: e.id,
        date: this.selectedDate(),
        statut: 'حاضر'
      }));

      const { error } = await this.sb.client
        .from('presences')
        .upsert(rows, {
          onConflict: 'etudiant_id,date'
        });

      if (error) {
        throw error;
      }

      await this.loadEtudiants();

      this.successMsg.set(
        '✅ تم تسجيل جميع الطلاب حاضرين!'
      );

      setTimeout(() => {
        this.successMsg.set('');
      }, 3000);

    } catch (error: any) {

      console.error('Erreur présence:', error);

      this.errorMsg.set(
        error?.message || 'خطأ في تسجيل الحضور'
      );

    } finally {
      this.saving.set(false);
    }
  }

  onDateChange(date: string): void {
    this.selectedDate.set(date);
    this.loadEtudiants();
  }

  onGroupeChange(groupeId: string): void {
    this.selectedGroupe.set(groupeId);
    this.loadEtudiants();
  }

  getStatutClass(statut: string): string {

    const classes: Record<string, string> = {
      'حاضر': 'btn-present active',
      'غائب': 'btn-absent active',
      'متأخر': 'btn-retard active',
      'معذور': 'btn-excuse active'
    };

    return classes[statut] || '';
  }

  getTauxPresence(): number {

    const total = this.etudiants().length;

    if (total === 0) {
      return 0;
    }

    return Math.round(
      (this.totalPresents() / total) * 100
    );
  }

  isToday(): boolean {
    return (
      this.selectedDate() ===
      new Date().toISOString().split('T')[0]
    );
  }
}
