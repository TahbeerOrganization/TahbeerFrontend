import {
  Component,
  OnInit,
  signal,
  computed
} from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { CommonModule } from '@angular/common';


// ═══════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════

export interface Devoir {
  id: number;

  titre: string;
  description?: string;

  dateLimite?: string;

  icon?: string;

  groupeId?: number;
  groupeNom?: string;
  classeNom?: string;

  // Google Meet
  meetUrl?: string;
  meetDate?: string;
  meetTime?: string;

  // Plan
  plan?: string;

  // Exercice
  exercice?: string;

  // File
  fichierUrl?: string;
}


export interface Groupe {
  id: number;
  nom: string;
}


export interface DevoirForm {
  titre: string;
  description: string;

  dateLimite: string;

  groupeId: string;

  // Optional sections

  hasMeet: boolean;
  meetUrl: string;
  meetDate: string;
  meetTime: string;

  hasPlan: boolean;
  plan: string;

  hasExercice: boolean;
  exercice: string;

  hasFichier: boolean;
  fichierUrl: string;
}


// ═══════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════

@Component({
  selector: 'app-devoirs',
  imports: [CommonModule, SidebarComponent],
  templateUrl: './devoirs.component.html',
  styleUrl: './devoirs.component.css'
})
export class DevoirsComponent implements OnInit {


  // ═════════════════════════════════════════════
  // DATA
  // ═════════════════════════════════════════════

  devoirs = signal<Devoir[]>([]);

  groupes = signal<Groupe[]>([]);


  // ═════════════════════════════════════════════
  // UI STATE
  // ═════════════════════════════════════════════

  loading = signal(false);

  formLoading = signal(false);

  successMsg = signal('');

  errorMsg = signal('');


  // ═════════════════════════════════════════════
  // SEARCH / FILTER
  // ═════════════════════════════════════════════

  searchQuery = signal('');

  filterType = signal('all');


  devoirsFiltres = computed(() => {

    const query =
      this.searchQuery()
        .trim()
        .toLowerCase();

    const type =
      this.filterType();


    return this.devoirs().filter(devoir => {

      // SEARCH

      const matchesSearch =
        !query ||
        devoir.titre
          ?.toLowerCase()
          .includes(query) ||
        devoir.description
          ?.toLowerCase()
          .includes(query);


      if (!matchesSearch) {
        return false;
      }


      // FILTER

      if (type === 'meet') {
        return !!devoir.meetUrl;
      }

      if (type === 'plan') {
        return !!devoir.plan;
      }

      if (type === 'exercise') {
        return !!devoir.exercice;
      }

      if (type === 'file') {
        return !!devoir.fichierUrl;
      }


      return true;

    });

  });


  // ═════════════════════════════════════════════
  // STATS
  // ═════════════════════════════════════════════

  devoirsAvecMeet = computed(() =>
    this.devoirs()
      .filter(d => !!d.meetUrl)
      .length
  );


  devoirsAvecExercice = computed(() =>
    this.devoirs()
      .filter(d => !!d.exercice)
      .length
  );


  devoirsAvecFichier = computed(() =>
    this.devoirs()
      .filter(d => !!d.fichierUrl)
      .length
  );


  devoirsAvecPlan = computed(() =>
    this.devoirs()
      .filter(d => !!d.plan)
      .length
  );


  // ═════════════════════════════════════════════
  // MODALS
  // ═════════════════════════════════════════════

  showDevoirModal = signal(false);

  showDeleteModal = signal(false);


  modeEdit = signal(false);


  devoirToDelete = signal<Devoir | null>(null);

  selectedDevoir = signal<Devoir | null>(null);


  // ═════════════════════════════════════════════
  // FORM
  // ═════════════════════════════════════════════

  devoirForm = signal<DevoirForm>(
    this.emptyForm()
  );


  // ═════════════════════════════════════════════
  // INIT
  // ═════════════════════════════════════════════

  ngOnInit(): void {

    this.loadAll();

  }


  // ═════════════════════════════════════════════
  // EMPTY FORM
  // ═════════════════════════════════════════════

  private emptyForm(): DevoirForm {

    return {

      titre: '',

      description: '',

      dateLimite: '',

      groupeId: '',


      hasMeet: false,

      meetUrl: '',

      meetDate: '',

      meetTime: '',


      hasPlan: false,

      plan: '',


      hasExercice: false,

      exercice: '',


      hasFichier: false,

      fichierUrl: ''

    };

  }


  // ═════════════════════════════════════════════
  // LOAD
  // ═════════════════════════════════════════════

  loadAll(): void {

    this.loading.set(true);

    this.clearMessages();


    /*
     * هنا حط service ديالك.
     *
     * مثال:
     *
     * this.devoirService.getAll().subscribe({
     *
     *   next: data => {
     *     this.devoirs.set(data);
     *     this.loading.set(false);
     *   },
     *
     *   error: err => {
     *     this.errorMsg.set(
     *       'حدث خطأ أثناء تحميل الواجبات'
     *     );
     *
     *     this.loading.set(false);
     *   }
     *
     * });
     */


    // مؤقتاً:
    this.loading.set(false);

  }


  // ═════════════════════════════════════════════
  // SEARCH
  // ═════════════════════════════════════════════

  onSearch(value: string): void {

    this.searchQuery.set(value);

  }


  // ═════════════════════════════════════════════
  // FILTER
  // ═════════════════════════════════════════════

  onFilterType(value: string): void {

    this.filterType.set(value);

  }


  // ═════════════════════════════════════════════
  // ADD
  // ═════════════════════════════════════════════

  ouvrirAjoutDevoir(): void {

    this.modeEdit.set(false);

    this.selectedDevoir.set(null);

    this.devoirForm.set(
      this.emptyForm()
    );

    this.clearMessages();

    this.showDevoirModal.set(true);

  }


  // ═════════════════════════════════════════════
  // EDIT
  // ═════════════════════════════════════════════

  ouvrirEditDevoir(
    devoir: Devoir
  ): void {

    this.modeEdit.set(true);

    this.selectedDevoir.set(devoir);

    this.devoirForm.set({

      titre: devoir.titre || '',

      description:
        devoir.description || '',

      dateLimite:
        devoir.dateLimite || '',

      groupeId:
        devoir.groupeId
          ? String(devoir.groupeId)
          : '',


      hasMeet:
        !!devoir.meetUrl,

      meetUrl:
        devoir.meetUrl || '',

      meetDate:
        devoir.meetDate || '',

      meetTime:
        devoir.meetTime || '',


      hasPlan:
        !!devoir.plan,

      plan:
        devoir.plan || '',


      hasExercice:
        !!devoir.exercice,

      exercice:
        devoir.exercice || '',


      hasFichier:
        !!devoir.fichierUrl,

      fichierUrl:
        devoir.fichierUrl || ''

    });


    this.clearMessages();

    this.showDevoirModal.set(true);

  }


  // ═════════════════════════════════════════════
  // CLOSE MODAL
  // ═════════════════════════════════════════════

  fermerDevoirModal(): void {

    if (this.formLoading()) {
      return;
    }

    this.showDevoirModal.set(false);

    this.clearMessages();

  }


  // ═════════════════════════════════════════════
  // FORM UPDATE
  // ═════════════════════════════════════════════

  updateDevoirForm(
    field: keyof DevoirForm,
    value: any
  ): void {

    this.devoirForm.update(form => ({

      ...form,

      [field]: value

    }));

  }


  // ═════════════════════════════════════════════
  // OPTIONAL TOGGLE
  // ═════════════════════════════════════════════

  toggleOptional(
    field:
      | 'hasMeet'
      | 'hasPlan'
      | 'hasExercice'
      | 'hasFichier',

    checked: boolean
  ): void {

    this.devoirForm.update(form => ({

      ...form,

      [field]: checked

    }));


    /*
     * إلا الأستاذ حيد checkbox
     * كنمسحو المحتوى ديالها.
     */

    if (!checked) {

      if (field === 'hasMeet') {

        this.devoirForm.update(form => ({

          ...form,

          meetUrl: '',
          meetDate: '',
          meetTime: ''

        }));

      }


      if (field === 'hasPlan') {

        this.devoirForm.update(form => ({

          ...form,

          plan: ''

        }));

      }


      if (field === 'hasExercice') {

        this.devoirForm.update(form => ({

          ...form,

          exercice: ''

        }));

      }


      if (field === 'hasFichier') {

        this.devoirForm.update(form => ({

          ...form,

          fichierUrl: ''

        }));

      }

    }

  }


  // ═════════════════════════════════════════════
  // SUBMIT
  // ═════════════════════════════════════════════

  soumettreDevoir(): void {

    this.clearMessages();


    const form = this.devoirForm();


    // REQUIRED

    if (!form.titre.trim()) {

      this.errorMsg.set(
        'المرجو إدخال عنوان الواجب'
      );

      return;

    }


    // MEET VALIDATION

    if (
      form.hasMeet &&
      !form.meetUrl.trim()
    ) {

      this.errorMsg.set(
        'المرجو إدخال رابط Google Meet'
      );

      return;

    }


    // PREPARE DATA

    const payload: Partial<Devoir> = {

      titre:
        form.titre.trim(),

      description:
        form.description.trim(),

      dateLimite:
        form.dateLimite || undefined,


      groupeId:
        form.groupeId
          ? Number(form.groupeId)
          : undefined,


      // Meet

      meetUrl:
        form.hasMeet
          ? form.meetUrl.trim()
          : undefined,

      meetDate:
        form.hasMeet
          ? form.meetDate || undefined
          : undefined,

      meetTime:
        form.hasMeet
          ? form.meetTime || undefined
          : undefined,


      // Plan

      plan:
        form.hasPlan
          ? form.plan.trim()
          : undefined,


      // Exercice

      exercice:
        form.hasExercice
          ? form.exercice.trim()
          : undefined,


      // File

      fichierUrl:
        form.hasFichier
          ? form.fichierUrl.trim()
          : undefined

    };


    console.log(
      'DEVOIR PAYLOAD:',
      payload
    );


    /*
     * هنا دير API call ديالك.
     *
     * CREATE:
     *
     * this.devoirService.create(payload).subscribe(...)
     *
     *
     * UPDATE:
     *
     * this.devoirService.update(
     *   this.selectedDevoir()!.id,
     *   payload
     * ).subscribe(...)
     */


    this.formLoading.set(true);


    // مؤقتاً demo

    setTimeout(() => {

      if (this.modeEdit()) {

        const selected =
          this.selectedDevoir();

        if (selected) {

          this.devoirs.update(
            list =>
              list.map(d =>
                d.id === selected.id
                  ? {
                      ...d,
                      ...payload
                    }
                  : d
              )
          );

        }

      } else {

        const newDevoir: Devoir = {

          id:
            Date.now(),

          titre:
            payload.titre || '',

          description:
            payload.description,

          dateLimite:
            payload.dateLimite,

          groupeId:
            payload.groupeId,

          meetUrl:
            payload.meetUrl,

          meetDate:
            payload.meetDate,

          meetTime:
            payload.meetTime,

          plan:
            payload.plan,

          exercice:
            payload.exercice,

          fichierUrl:
            payload.fichierUrl,

          icon:
            '📝'

        };


        this.devoirs.update(
          list => [
            newDevoir,
            ...list
          ]
        );

      }


      this.formLoading.set(false);

      this.showDevoirModal.set(false);

      this.successMsg.set(
        this.modeEdit()
          ? 'تم تعديل الواجب بنجاح'
          : 'تمت إضافة الواجب بنجاح'
      );

    }, 500);

  }


  // ═════════════════════════════════════════════
  // DELETE
  // ═════════════════════════════════════════════

  confirmerSuppression(
    devoir: Devoir
  ): void {

    this.devoirToDelete.set(devoir);

    this.showDeleteModal.set(true);

  }


  supprimerDevoir(): void {

    const devoir =
      this.devoirToDelete();

    if (!devoir) {
      return;
    }


    this.formLoading.set(true);


    /*
     * API:
     *
     * this.devoirService
     *   .delete(devoir.id)
     *   .subscribe(...)
     */


    setTimeout(() => {

      this.devoirs.update(
        list =>
          list.filter(
            d => d.id !== devoir.id
          )
      );


      this.formLoading.set(false);

      this.showDeleteModal.set(false);

      this.devoirToDelete.set(null);


      this.successMsg.set(
        'تم حذف الواجب بنجاح'
      );

    }, 500);

  }


  // ═════════════════════════════════════════════
  // VIEW
  // ═════════════════════════════════════════════

  voirDevoir(
    devoir: Devoir
  ): void {

    console.log(
      'DEVOIR:',
      devoir
    );

  }


  // ═════════════════════════════════════════════
  // DATE
  // ═════════════════════════════════════════════

  formatDate(
    date?: string
  ): string {

    if (!date) {
      return 'غير محدد';
    }


    const d =
      new Date(date);


    if (isNaN(d.getTime())) {
      return date;
    }


    return d.toLocaleDateString(
      'ar-MA',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }
    );

  }


  // ═════════════════════════════════════════════
  // MESSAGES
  // ═════════════════════════════════════════════

  private clearMessages(): void {

    this.successMsg.set('');

    this.errorMsg.set('');

  }

}
