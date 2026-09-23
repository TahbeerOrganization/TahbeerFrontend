import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

interface Programme {
  id: string;
  nom: string;
}

interface Groupe {
  id: string;
  nom: string;
  couleur: string;
  programme_id: string;
  programme?: Programme | null;
}

interface Etudiant {
  id: string;
  nom: string;
  email: string;
  role: string;
  niveau: string;
  created_at: string;

  groupes: Groupe[];
}

@Component({
  selector: 'app-etudiants',
  standalone: true,
  imports: [
    CommonModule,
    SidebarComponent
  ],
  templateUrl: './etudiants.component.html',
  styleUrl: './etudiants.component.css'
})
export class EtudiantsComponent implements OnInit {

  // =========================================================
  // DONNÉES
  // =========================================================

  etudiants = signal<Etudiant[]>([]);
  etudiantsFiltres = signal<Etudiant[]>([]);

  groupes = signal<Groupe[]>([]);
  programmes = signal<Programme[]>([]);

  // =========================================================
  // UI
  // =========================================================

  loading = signal(true);
  showModal = signal(false);
  showDeleteModal = signal(false);
  modeEdit = signal(false);

  searchQuery = signal('');
  filtreGroupe = signal('');
  filtreNiveau = signal('');

  // =========================================================
  // ÉTUDIANT À SUPPRIMER
  // =========================================================

  etudiantToDelete = signal<Etudiant | null>(null);

  // =========================================================
  // FORMULAIRE
  // =========================================================

  form = signal({
    nom: '',
    email: '',
    password: '',
    niveau: ''
  });

  editingId = signal('');

  // =========================================================
  // MESSAGES
  // =========================================================

  successMsg = signal('');
  errorMsg = signal('');
  formLoading = signal(false);

  // =========================================================
  // CONSTRUCTOR
  // =========================================================

  constructor(
    private sb: SupabaseService,
    public auth: AuthService,
    private router: Router
  ) {}

  // =========================================================
  // INIT
  // =========================================================

  ngOnInit(): void {
    this.loadData();
  }

  // =========================================================
  // CHARGER TOUTES LES DONNÉES
  // =========================================================

  async loadData(): Promise<void> {

    this.loading.set(true);
    this.errorMsg.set('');

    try {

      // =====================================================
      // 1. PROGRAMMES
      // =====================================================

      const {
        data: programmes,
        error: programmesError
      } = await this.sb.client
        .from('programmes')
        .select('id, nom')
        .order('nom');

      if (programmesError) {
        throw programmesError;
      }

      this.programmes.set(
        (programmes || []) as Programme[]
      );

      // =====================================================
      // 2. GROUPES
      // =====================================================

      const {
        data: groupes,
        error: groupesError
      } = await this.sb.client
        .from('groupes')
        .select('id, nom, couleur, programme_id')
        .order('nom');

      if (groupesError) {
        throw groupesError;
      }

      const groupesFormates: Groupe[] =
        (groupes || []).map((g: any) => {

          const programme =
            (programmes || []).find(
              (p: any) =>
                String(p.id) === String(g.programme_id)
            ) || null;

          return {
            id: g.id,
            nom: g.nom,
            couleur: g.couleur || '#3b82f6',
            programme_id: g.programme_id,
            programme
          };
        });

      this.groupes.set(groupesFormates);

      // =====================================================
      // 3. ÉTUDIANTS
      // =====================================================

      const {
        data: etudiants,
        error: etudiantsError
      } = await this.sb.client
        .from('profiles')
        .select(`
          id,
          nom,
          email,
          role,
          niveau,
          created_at
        `)
        .eq('role', 'etudiant')
        .order('nom');

      if (etudiantsError) {
        throw etudiantsError;
      }

      // =====================================================
      // 4. RELATIONS GROUPE / ÉTUDIANT
      // =====================================================

      const {
        data: relations,
        error: relationsError
      } = await this.sb.client
        .from('groupe_etudiants')
        .select('groupe_id, etudiant_id');

      if (relationsError) {
        throw relationsError;
      }

      // =====================================================
      // 5. CONSTRUIRE LES GROUPES DE CHAQUE ÉTUDIANT
      // =====================================================

      const etudiantsFormates: Etudiant[] =
        (etudiants || []).map((e: any) => {

          const relationsEtudiant =
            (relations || []).filter(
              (r: any) =>
                String(r.etudiant_id) === String(e.id)
            );

          const groupesEtudiant: Groupe[] =
            relationsEtudiant
              .map((relation: any) => {

                return groupesFormates.find(
                  groupe =>
                    String(groupe.id) ===
                    String(relation.groupe_id)
                );

              })
              .filter(
                (groupe): groupe is Groupe =>
                  !!groupe
              );

          return {
            id: e.id,
            nom: e.nom || '',
            email: e.email || '',
            role: e.role,
            niveau: e.niveau || '',
            created_at: e.created_at,

            groupes: groupesEtudiant
          };
        });

      console.log(
        'ÉTUDIANTS AVEC GROUPES:',
        etudiantsFormates
      );

      this.etudiants.set(
        etudiantsFormates
      );

      this.appliquerFiltres();

    } catch (err: any) {

      console.error(
        'Erreur loadData:',
        err
      );

      this.errorMsg.set(
        err?.message ||
        'خطأ في تحميل البيانات'
      );

      this.etudiants.set([]);
      this.etudiantsFiltres.set([]);

    } finally {

      this.loading.set(false);
    }
  }

  // =========================================================
  // GROUPES
  // =========================================================

  async loadGroupes(): Promise<void> {
    await this.loadData();
  }

  // =========================================================
  // FILTRES
  // =========================================================

  appliquerFiltres(): void {

    let liste = [
      ...this.etudiants()
    ];

    const recherche =
      this.searchQuery()
        .trim()
        .toLowerCase();

    const groupeId =
      this.filtreGroupe();

    const niveau =
      this.filtreNiveau();

    // -------------------------------------------------------
    // RECHERCHE
    // -------------------------------------------------------

    if (recherche) {

      liste = liste.filter(
        e =>
          (e.nom || '')
            .toLowerCase()
            .includes(recherche) ||

          (e.email || '')
            .toLowerCase()
            .includes(recherche)
      );
    }

    // -------------------------------------------------------
    // FILTRE GROUPE
    // -------------------------------------------------------

    if (groupeId) {

      liste = liste.filter(
        e =>
          e.groupes.some(
            groupe =>
              String(groupe.id) ===
              String(groupeId)
          )
      );
    }

    // -------------------------------------------------------
    // FILTRE NIVEAU
    // -------------------------------------------------------

    if (niveau) {

      liste = liste.filter(
        e =>
          e.niveau === niveau
      );
    }

    this.etudiantsFiltres.set(
      liste
    );
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

  // =========================================================
  // AJOUT
  // =========================================================

  ouvrirAjout(): void {

    this.modeEdit.set(false);

    this.editingId.set('');

    this.form.set({
      nom: '',
      email: '',
      password: '',
      niveau: ''
    });

    this.errorMsg.set('');
    this.successMsg.set('');

    this.showModal.set(true);
  }

  // =========================================================
  // MODIFICATION
  // =========================================================

  ouvrirEdit(
    etudiant: Etudiant
  ): void {

    this.modeEdit.set(true);

    this.editingId.set(
      etudiant.id
    );

    this.form.set({
      nom: etudiant.nom || '',
      email: etudiant.email || '',
      password: '',
      niveau: etudiant.niveau || ''
    });

    this.errorMsg.set('');
    this.successMsg.set('');

    this.showModal.set(true);
  }

  // =========================================================
  // FERMER MODAL
  // =========================================================

  fermerModal(): void {

    this.showModal.set(false);

    this.errorMsg.set('');
  }

  // =========================================================
  // FORM UPDATE
  // =========================================================

  updateForm(
    field: string,
    value: string
  ): void {

    this.form.update(
      f => ({
        ...f,
        [field]: value
      })
    );
  }

  // =========================================================
  // SOUMETTRE
  // =========================================================

  async soumettre(): Promise<void> {

    const f =
      this.form();

    // -------------------------------------------------------
    // VALIDATION
    // -------------------------------------------------------

    if (
      !f.nom.trim() ||
      !f.niveau
    ) {

      this.errorMsg.set(
        'يرجى ملء الاسم والمستوى'
      );

      return;
    }

    if (
      !this.modeEdit() &&
      (
        !f.email.trim() ||
        !f.password.trim()
      )
    ) {

      this.errorMsg.set(
        'البريد الإلكتروني وكلمة المرور مطلوبان'
      );

      return;
    }

    if (this.formLoading()) {
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

      console.error(
        'Erreur soumission:',
        err
      );

      this.errorMsg.set(
        err?.message ||
        'حدث خطأ غير متوقع'
      );

    } finally {

      this.formLoading.set(false);
    }
  }

  // =========================================================
  // CRÉER ÉTUDIANT
  // =========================================================

  private async create(): Promise<void> {
  const f = this.form();

  const { data, error } =
    await this.sb.client.functions.invoke(
      'create-user',
      {
        body: {
          email: f.email.trim(),
          password: f.password,
          nom: f.nom.trim(),
          niveau: f.niveau || null
        }
      }
    );

  console.log('CREATE DATA:', data);
  console.log('CREATE ERROR:', error);

  if (error) {
    let message = error.message || 'Erreur Edge Function';

    try {
      const response = (error as any).context;

      if (response) {
        const text = await response.text();
        console.error('EDGE FUNCTION RESPONSE:', text);

        try {
          const json = JSON.parse(text);
          message = json.error || json.message || text;
        } catch {
          if (text) {
            message = text;
          }
        }
      }
    } catch (e) {
      console.error('Impossible de lire response:', e);
    }

    throw new Error(message);
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  this.successMsg.set('✅ تم إضافة الطالب بنجاح');

  await this.loadData();

  setTimeout(() => {
    this.fermerModal();
    this.successMsg.set('');
  }, 1000);
}

  // =========================================================
  // MODIFIER ÉTUDIANT
  // =========================================================

  private async update(): Promise<void> {

    const f =
      this.form();

    const {
      data,
      error
    } =
      await this.sb.client.functions.invoke(
        'update-user',
        {
          body: {
            userId: this.editingId(),
            email: f.email?.trim() || null,
            nom: f.nom.trim(),
            niveau: f.niveau || null
          }
        }
      );

    if (error) {
      throw error;
    }

    if (data?.error) {

      throw new Error(
        data.error
      );
    }

    this.successMsg.set(
      '✅ تم تحديث بيانات الطالب بنجاح'
    );

    this.showModal.set(false);

    await this.loadData();

    setTimeout(() => {

      this.successMsg.set('');

    }, 3000);
  }

  // =========================================================
  // SUPPRESSION
  // =========================================================

  confirmerSuppression(
    etudiant: Etudiant
  ): void {

    this.etudiantToDelete.set(
      etudiant
    );

    this.showDeleteModal.set(
      true
    );
  }

  async supprimerEtudiant(): Promise<void> {

    const etudiant =
      this.etudiantToDelete();

    if (!etudiant) {
      return;
    }

    if (this.formLoading()) {
      return;
    }

    this.formLoading.set(true);

    try {

      // -----------------------------------------------------
      // SUPPRIMER LES RELATIONS
      // -----------------------------------------------------

      const {
        error: relationError
      } =
        await this.sb.client
          .from('groupe_etudiants')
          .delete()
          .eq(
            'etudiant_id',
            etudiant.id
          );

      if (relationError) {
        throw relationError;
      }

      // -----------------------------------------------------
      // SUPPRIMER LE PROFILE
      // -----------------------------------------------------

      const {
        error
      } =
        await this.sb.client
          .from('profiles')
          .delete()
          .eq(
            'id',
            etudiant.id
          );

      if (error) {
        throw error;
      }

      // -----------------------------------------------------
      // NETTOYAGE
      // -----------------------------------------------------

      this.showDeleteModal.set(
        false
      );

      this.etudiantToDelete.set(
        null
      );

      // -----------------------------------------------------
      // RECHARGER
      // -----------------------------------------------------

      await this.loadData();

      // -----------------------------------------------------
      // MESSAGE
      // -----------------------------------------------------

      this.successMsg.set(
        '✅ تم حذف الطالب بنجاح'
      );

      setTimeout(() => {

        this.successMsg.set('');

      }, 3000);

    } catch (err: any) {

      console.error(
        'Erreur suppression:',
        err
      );

      this.errorMsg.set(
        err?.message ||
        'خطأ في الحذف'
      );

    } finally {

      this.formLoading.set(
        false
      );
    }
  }

  // =========================================================
  // BADGE GROUPE
  // =========================================================

  getBadgeGroupe(
    groupe: Groupe
  ): string {

    const badges: any = {
      رجال: 'badge-blue',
      نساء: 'badge-purple',
      أطفال: 'badge-green'
    };

    return (
      badges[groupe?.nom] ||
      'badge-gray'
    );
  }

  // =========================================================
  // BADGE NIVEAU
  // =========================================================

  getNiveauBadge(
    niveau: string
  ): string {

    const badges: any = {
      متقدم: 'badge-green',
      متوسط: 'badge-blue',
      مبتدئ: 'badge-amber'
    };

    return (
      badges[niveau] ||
      'badge-gray'
    );
  }

  // =========================================================
  // NAVIGATION
  // =========================================================

  ouvrirHifd(
    etudiant: Etudiant
  ): void {

    this.router.navigate(
      ['/prof/hifd'],
      {
        queryParams: {
          etudiant: etudiant.id
        }
      }
    );
  }

  ouvrirPaiement(
    etudiant: Etudiant
  ): void {

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
