import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-etudiants',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './etudiants.component.html',
  styleUrl: './etudiants.component.css'
})
export class EtudiantsComponent implements OnInit {

  // =========================
  // DONNÉES
  // =========================
  etudiants = signal<any[]>([]);
  etudiantsFiltres = signal<any[]>([]);
  groupes = signal<any[]>([]);

  // =========================
  // UI
  // =========================
  loading = signal(true);
  showModal = signal(false);
  showDeleteModal = signal(false);
  modeEdit = signal(false);

  searchQuery = signal('');
  filtreGroupe = signal('');
  filtreNiveau = signal('');

  // =========================
  // ÉTUDIANT À SUPPRIMER
  // =========================
  etudiantToDelete = signal<any>(null);

  // =========================
  // FORMULAIRE
  // =========================
  form = signal({
    nom: '',
    email: '',
    password: '',
    groupe_id: '',
    niveau: ''
  });

  editingId = signal('');

  // =========================
  // MESSAGES
  // =========================
  successMsg = signal('');
  errorMsg = signal('');
  formLoading = signal(false);

  constructor(
    private sb: SupabaseService,
    public auth: AuthService,
    private router: Router
  ) {}

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.loadGroupes();
    this.loadEtudiants();
  }

  // =========================
  // GROUPES
  // =========================
  async loadGroupes(): Promise<void> {
    try {
      const { data, error } = await this.sb.client
        .from('groupes')
        .select('*')
        .order('nom');

      if (error) throw error;

      this.groupes.set(data ?? []);
    } catch (err) {
      console.error('Erreur groupes:', err);
      this.groupes.set([]);
    }
  }

  // =========================
  // ÉTUDIANTS
  // =========================
  async loadEtudiants(): Promise<void> {
    this.loading.set(true);
    this.errorMsg.set('');

    try {
      const { data, error } = await this.sb.client
        .from('profiles')
        .select('id, nom, role, groupe_id, niveau, created_at')
        .eq('role', 'etudiant')
        .order('nom');

      if (error) throw error;

      console.log('ÉTUDIANTS:', data);

      this.etudiants.set(data ?? []);
      this.appliquerFiltres();

    } catch (err: any) {
      console.error('Erreur étudiants:', err);

      this.errorMsg.set(
        err?.message || 'خطأ في تحميل الطلاب'
      );

      this.etudiants.set([]);
      this.etudiantsFiltres.set([]);

    } finally {
      this.loading.set(false);
    }
  }

  // =========================
  // FILTRES
  // =========================
  appliquerFiltres(): void {
    let liste = [...this.etudiants()];

    const recherche = this.searchQuery()
      .trim()
      .toLowerCase();

    const groupe = this.filtreGroupe();
    const niveau = this.filtreNiveau();

    // Recherche par nom
    if (recherche) {
      liste = liste.filter(e =>
        (e.nom || '')
          .toLowerCase()
          .includes(recherche)
      );
    }

    // Filtre groupe
    if (groupe) {
      liste = liste.filter(e =>
        String(e.groupe_id) === String(groupe)
      );
    }

    // Filtre niveau
    if (niveau) {
      liste = liste.filter(e =>
        e.niveau === niveau
      );
    }

    this.etudiantsFiltres.set(liste);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.appliquerFiltres();
  }

  onFiltreGroupe(value: string): void {
    this.filtreGroupe.set(value);
    this.appliquerFiltres();
  }

  onFiltreNiveau(value: string): void {
    this.filtreNiveau.set(value);
    this.appliquerFiltres();
  }

  // =========================
  // AJOUT
  // =========================
  ouvrirAjout(): void {
    this.modeEdit.set(false);
    this.editingId.set('');

    this.form.set({
      nom: '',
      email: '',
      password: '',
      groupe_id: '',
      niveau: ''
    });

    this.errorMsg.set('');
    this.successMsg.set('');
    this.showModal.set(true);
  }

  // =========================
  // MODIFICATION
  // =========================
  ouvrirEdit(etudiant: any): void {
    this.modeEdit.set(true);
    this.editingId.set(etudiant.id);

    this.form.set({
      nom: etudiant.nom || '',
      email: etudiant.email || '',
      password: '',
      groupe_id: etudiant.groupe_id || '',
      niveau: etudiant.niveau || ''
    });

    this.errorMsg.set('');
    this.successMsg.set('');
    this.showModal.set(true);
  }

  // =========================
  // FERMER MODAL
  // =========================
  fermerModal(): void {
    this.showModal.set(false);
    this.errorMsg.set('');
  }

  // =========================
  // FORM UPDATE
  // =========================
  updateForm(
    field: string,
    value: string
  ): void {
    this.form.update(f => ({
      ...f,
      [field]: value
    }));
  }

  // =========================
  // SOUMETTRE
  // =========================
  async soumettre(): Promise<void> {
    const f = this.form();

    if (
      !f.nom.trim() ||
      !f.groupe_id ||
      !f.niveau
    ) {
      this.errorMsg.set(
        'يرجى ملء الاسم، المجموعة والمستوى'
      );
      return;
    }

    if (
      !this.modeEdit() &&
      (!f.email.trim() || !f.password.trim())
    ) {
      this.errorMsg.set(
        'البريد الإلكتروني وكلمة المرور مطلوبان'
      );
      return;
    }

    this.formLoading.set(true);
    this.errorMsg.set('');

    try {
      if (this.modeEdit()) {
        await this.update();
      } else {
        await this.create();
      }

    } catch (err: any) {
      this.errorMsg.set(
        err?.message || 'حدث خطأ غير متوقع'
      );

    } finally {
      this.formLoading.set(false);
    }
  }

  // =========================
  // CRÉER ÉTUDIANT
  // =========================
  private async create(): Promise<void> {
    const f = this.form();

    const { error } =
      await this.sb.client.functions.invoke(
        'create-user',
        {
          body: {
            email: f.email,
            password: f.password,
            nom: f.nom,
            groupe_id: f.groupe_id || null,
            niveau: f.niveau || null
          }
        }
      );

    if (error) throw error;

    this.successMsg.set(
      '✅ تم إضافة الطالب بنجاح!'
    );

    await this.loadEtudiants();

    setTimeout(() => {
      this.fermerModal();
    }, 1000);
  }

  // =========================
  // MODIFIER ÉTUDIANT
  // =========================
  private async update(): Promise<void> {
    const f = this.form();

    const { data, error } =
      await this.sb.client.functions.invoke(
        'update-user',
        {
          body: {
            userId: this.editingId(),
            email: f.email || null,
            nom: f.nom,
            groupe_id: f.groupe_id || null,
            niveau: f.niveau || null
          }
        }
      );

    if (error) throw error;

    if (data?.error) {
      throw new Error(data.error);
    }

    this.successMsg.set(
      '✅ تم تحديث بيانات الطالب بنجاح!'
    );

    this.showModal.set(false);

    await this.loadEtudiants();

    setTimeout(() => {
      this.successMsg.set('');
    }, 3000);
  }

  // =========================
  // SUPPRESSION
  // =========================
  confirmerSuppression(
    etudiant: any
  ): void {
    this.etudiantToDelete.set(etudiant);
    this.showDeleteModal.set(true);
  }

  async supprimerEtudiant(): Promise<void> {
    const etudiant =
      this.etudiantToDelete();

    if (!etudiant) return;

    this.formLoading.set(true);

    try {
      const { error } =
        await this.sb.client
          .from('profiles')
          .delete()
          .eq('id', etudiant.id);

      if (error) throw error;

      this.showDeleteModal.set(false);
      this.etudiantToDelete.set(null);

      await this.loadEtudiants();

      this.successMsg.set(
        '✅ تم حذف الطالب بنجاح'
      );

      setTimeout(() => {
        this.successMsg.set('');
      }, 3000);

    } catch (err: any) {
      this.errorMsg.set(
        err?.message || 'خطأ في الحذف'
      );

    } finally {
      this.formLoading.set(false);
    }
  }

  // =========================
  // BADGES
  // =========================
  getBadgeGroupe(type: string): string {
    const badges: any = {
      رجال: 'badge-blue',
      نساء: 'badge-purple',
      أطفال: 'badge-green'
    };

    return badges[type] || 'badge-gray';
  }

  getNiveauBadge(niveau: string): string {
    const badges: any = {
      متقدم: 'badge-green',
      متوسط: 'badge-blue',
      مبتدئ: 'badge-amber'
    };

    return badges[niveau] || 'badge-gray';
  }

  // =========================
  // NAVIGATION
  // =========================
  ouvrirHifd(etudiant: any): void {
    this.router.navigate(
      ['/prof/hifd'],
      {
        queryParams: {
          etudiant: etudiant.id
        }
      }
    );
  }

  ouvrirPaiement(etudiant: any): void {
    this.router.navigate(
      ['/prof/paiements'],
      {
        queryParams: {
          etudiant: etudiant.id
        }
      }
    );
  }
}
