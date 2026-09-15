import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-classes',
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent
  ],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.css'
})
export class ClassesComponent implements OnInit {

  // ═══════════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════════

  classes = signal<any[]>([]);
  groupes = signal<any[]>([]);
  etudiants = signal<any[]>([]);


  // ═══════════════════════════════════════════════
  // UI
  // ═══════════════════════════════════════════════

  loading = signal(true);
  formLoading = signal(false);

  successMsg = signal('');
  errorMsg = signal('');

  searchQuery = signal('');


  // ═══════════════════════════════════════════════
  // CLASSE MODAL
  // ═══════════════════════════════════════════════

  showClasseModal = signal(false);
  modeEditClasse = signal(false);

  selectedClasse = signal<any>(null);
  classeToDelete = signal<any>(null);

  showDeleteClasseModal = signal(false);

  classeForm = signal({
    id: '',
    nom: '',
    code: '',
    description: '',
    icon: '📖'
  });


  // ═══════════════════════════════════════════════
  // GROUPE MODAL
  // ═══════════════════════════════════════════════

  showGroupeModal = signal(false);

  groupeForm = signal({
    id: '',
    classe_id: '',
    nom: '',
    type: ''
  });


  constructor(
    private sb: SupabaseService,
    public auth: AuthService
  ) {}


  // ═══════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════

  ngOnInit() {
    this.loadAll();
  }


  // ═══════════════════════════════════════════════
  // LOAD ALL
  // ═══════════════════════════════════════════════

  async loadAll() {

    this.loading.set(true);
    this.errorMsg.set('');

    try {

      await Promise.all([
        this.loadClasses(),
        this.loadGroupes(),
        this.loadEtudiants()
      ]);

      this.buildHierarchy();

    } catch (error) {

      console.error(error);

      this.errorMsg.set(
        'حدث خطأ أثناء تحميل البيانات'
      );

    } finally {

      this.loading.set(false);

    }

  }


  // ═══════════════════════════════════════════════
  // LOAD CLASSES
  // ═══════════════════════════════════════════════

  async loadClasses() {

    const { data, error } = await this.sb.client
      .from('classes')
      .select('*')
      .order('nom');

    if (error) {
      throw error;
    }

    this.classes.set(data || []);

  }


  // ═══════════════════════════════════════════════
  // LOAD GROUPES
  // ═══════════════════════════════════════════════

  async loadGroupes() {

    const { data, error } = await this.sb.client
      .from('groupes')
      .select('*')
      .order('nom');

    if (error) {
      throw error;
    }

    this.groupes.set(data || []);

  }


  // ═══════════════════════════════════════════════
  // LOAD ETUDIANTS
  // ═══════════════════════════════════════════════

  async loadEtudiants() {

    const { data, error } = await this.sb.client
      .from('profiles')
      .select('*')
      .eq('role', 'etudiant')
      .not('groupe_id', 'is', null)
      .order('nom');

    if (error) {
      throw error;
    }

    this.etudiants.set(data || []);

  }


  // ═══════════════════════════════════════════════
  // BUILD HIERARCHY
  // ═══════════════════════════════════════════════

  buildHierarchy() {

    const classes = this.classes();
    const groupes = this.groupes();
    const etudiants = this.etudiants();


    const result = classes.map(classe => {

      const classeGroupes = groupes
        .filter(g => g.classe_id === classe.id)
        .map(groupe => {

          const groupeEtudiants = etudiants
            .filter(e => e.groupe_id === groupe.id);

          return {
            ...groupe,
            etudiants: groupeEtudiants
          };

        });


      return {
        ...classe,
        groupes: classeGroupes
      };

    });


    this.classes.set(result);

  }


  // ═══════════════════════════════════════════════
  // SEARCH
  // ═══════════════════════════════════════════════

  onSearch(value: string) {
    this.searchQuery.set(value);
  }


  classesFiltres() {

    const q = this.searchQuery()
      .trim()
      .toLowerCase();

    if (!q) {
      return this.classes();
    }


    return this.classes()
      .map(classe => {

        const classeMatch =
          classe.nom?.toLowerCase().includes(q);


        const groupesFiltres =
          classe.groupes
            .map((g: any) => {

              const groupeMatch =
                g.nom?.toLowerCase().includes(q);

              const students =
                g.etudiants.filter((e: any) =>
                  e.nom?.toLowerCase().includes(q) ||
                  e.email?.toLowerCase().includes(q)
                );

              if (groupeMatch) {
                return g;
              }

              if (students.length > 0) {
                return {
                  ...g,
                  etudiants: students
                };
              }

              return null;

            })
            .filter((g: any) => g !== null);


        if (
          classeMatch ||
          groupesFiltres.length > 0
        ) {

          return {
            ...classe,
            groupes: classeMatch
              ? classe.groupes
              : groupesFiltres
          };

        }

        return null;

      })
      .filter(classe => classe !== null);

  }


  // ═══════════════════════════════════════════════
  // TOTAL STUDENTS
  // ═══════════════════════════════════════════════

  getTotalEtudiants(classe: any): number {

    return classe.groupes.reduce(
      (total: number, groupe: any) =>
        total + groupe.etudiants.length,
      0
    );

  }


  // ═══════════════════════════════════════════════
  // NIVEAU BADGE
  // ═══════════════════════════════════════════════

  getNiveauBadge(niveau: string): string {

    const badges: any = {

      'مبتدئ': 'badge-gray',

      'متوسط': 'badge-blue',

      'متقدم': 'badge-green'

    };

    return badges[niveau] || 'badge-gray';

  }


  // ═══════════════════════════════════════════════
  // CLASSE CRUD
  // ═══════════════════════════════════════════════

  ouvrirAjoutClasse() {

    this.modeEditClasse.set(false);

    this.classeForm.set({
      id: '',
      nom: '',
      code: '',
      description: '',
      icon: '📖'
    });

    this.errorMsg.set('');

    this.showClasseModal.set(true);

  }


  ouvrirEditClasse(classe: any) {

    this.modeEditClasse.set(true);

    this.classeForm.set({
      id: classe.id,
      nom: classe.nom,
      code: classe.code || '',
      description: classe.description || '',
      icon: classe.icon || '📖'
    });

    this.errorMsg.set('');

    this.showClasseModal.set(true);

  }


  fermerClasseModal() {
    this.showClasseModal.set(false);
  }


  updateClasseForm(
    field: string,
    value: any
  ) {

    this.classeForm.update(
      f => ({
        ...f,
        [field]: value
      })
    );

  }


  async soumettreClasse() {

    const f = this.classeForm();

    if (!f.nom.trim()) {

      this.errorMsg.set(
        'أدخل اسم القسم'
      );

      return;

    }

    if (!f.code) {

      this.errorMsg.set(
        'اختر نوع القسم'
      );

      return;

    }


    this.formLoading.set(true);


    try {

      if (this.modeEditClasse()) {

        const { error } =
          await this.sb.client
            .from('classes')
            .update({
              nom: f.nom,
              code: f.code,
              description: f.description,
              icon: f.icon
            })
            .eq('id', f.id);

        if (error) throw error;


        this.successMsg.set(
          '✅ تم تعديل القسم'
        );

      } else {

        const { error } =
          await this.sb.client
            .from('classes')
            .insert({
              nom: f.nom,
              code: f.code,
              description: f.description,
              icon: f.icon
            });

        if (error) throw error;


        this.successMsg.set(
          '✅ تمت إضافة القسم'
        );

      }


      this.showClasseModal.set(false);

      await this.loadAll();

      setTimeout(() => {
        this.successMsg.set('');
      }, 3000);


    } catch (error: any) {

      console.error(error);

      this.errorMsg.set(
        error.message || 'حدث خطأ'
      );

    } finally {

      this.formLoading.set(false);

    }

  }


  // ═══════════════════════════════════════════════
  // DELETE CLASSE
  // ═══════════════════════════════════════════════

  confirmerSuppressionClasse(
    classe: any
  ) {

    this.classeToDelete.set(classe);

    this.showDeleteClasseModal.set(true);

  }


  async supprimerClasse() {

    const classe =
      this.classeToDelete();

    if (!classe) return;


    this.formLoading.set(true);


    try {

      const { error } =
        await this.sb.client
          .from('classes')
          .delete()
          .eq('id', classe.id);

      if (error) throw error;


      this.showDeleteClasseModal.set(false);

      await this.loadAll();

      this.successMsg.set(
        '✅ تم حذف القسم'
      );

      setTimeout(() => {
        this.successMsg.set('');
      }, 3000);


    } catch (error: any) {

      this.errorMsg.set(
        error.message || 'تعذر حذف القسم'
      );

    } finally {

      this.formLoading.set(false);

    }

  }


  // ═══════════════════════════════════════════════
  // GROUPE
  // ═══════════════════════════════════════════════

  ouvrirAjoutGroupe(classe: any) {

    this.selectedClasse.set(classe);

    this.groupeForm.set({
      id: '',
      classe_id: classe.id,
      nom: '',
      type: ''
    });

    this.errorMsg.set('');

    this.showGroupeModal.set(true);

  }


  ouvrirEditGroupe(groupe: any) {

    this.groupeForm.set({
      id: groupe.id,
      classe_id: groupe.classe_id,
      nom: groupe.nom,
      type: groupe.type || ''
    });

    this.errorMsg.set('');

    this.showGroupeModal.set(true);

  }


  fermerGroupeModal() {

    this.showGroupeModal.set(false);

  }


  updateGroupeForm(
    field: string,
    value: any
  ) {

    this.groupeForm.update(
      f => ({
        ...f,
        [field]: value
      })
    );

  }


  async soumettreGroupe() {

    const f = this.groupeForm();


    if (!f.nom.trim()) {

      this.errorMsg.set(
        'أدخل اسم المجموعة'
      );

      return;

    }


    this.formLoading.set(true);


    try {

      if (f.id) {

        const { error } =
          await this.sb.client
            .from('groupes')
            .update({
              nom: f.nom,
              type: f.type
            })
            .eq('id', f.id);

        if (error) throw error;

      } else {

        const { error } =
          await this.sb.client
            .from('groupes')
            .insert({
              nom: f.nom,
              type: f.type,
              classe_id: f.classe_id
            });

        if (error) throw error;

      }


      this.showGroupeModal.set(false);

      await this.loadAll();

      this.successMsg.set(
        '✅ تمت العملية بنجاح'
      );

      setTimeout(() => {
        this.successMsg.set('');
      }, 3000);


    } catch (error: any) {

      this.errorMsg.set(
        error.message || 'حدث خطأ'
      );

    } finally {

      this.formLoading.set(false);

    }

  }


  confirmerSuppressionGroupe(
    groupe: any
  ) {

    if (
      confirm(
        `هل أنت متأكد من حذف المجموعة "${groupe.nom}"؟`
      )
    ) {

      this.supprimerGroupe(groupe);

    }

  }


  async supprimerGroupe(groupe: any) {

    const { error } =
      await this.sb.client
        .from('groupes')
        .delete()
        .eq('id', groupe.id);


    if (error) {

      this.errorMsg.set(
        error.message
      );

      return;

    }


    await this.loadAll();

    this.successMsg.set(
      '✅ تم حذف المجموعة'
    );

  }


  // ═══════════════════════════════════════════════
  // STUDENT
  // ═══════════════════════════════════════════════

  ajouterEtudiant(groupe: any) {

    // هنا تقدر من بعد تفتح modal ديال إضافة étudiant
    // و groupe_id يكون déjà sélectionné

    console.log(
      'Ajouter étudiant au groupe:',
      groupe.id
    );

  }


  voirGroupe(groupe: any) {

    console.log(
      'Groupe:',
      groupe
    );

  }

}