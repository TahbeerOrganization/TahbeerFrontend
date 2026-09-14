
import {
  Component,
  signal,
  computed,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';


/* ═══════════════════════════════════════════════
   INTERFACES
═══════════════════════════════════════════════ */

interface Etudiant {
  id: number;
  nom: string;
  groupe: string;
}


interface Hifd {
  id: number;

  etudiant: {
    id?: number;
    nom: string;
    groupe: string;
  };

  sourate: string;

  ayat_debut: number;
  ayat_fin: number;
  nombre_ayat: number;

  evaluation:
    | 'ممتاز'
    | 'جيد'
    | 'متوسط'
    | 'ضعيف';

  date: string;

  notes?: string;
}


/* ═══════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════ */

@Component({
  selector: 'app-hifd',

  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    SidebarComponent
  ],

  templateUrl: './hifd.component.html',

  styleUrl: './hifd.component.css'
})
export class HifdComponent implements OnInit {


  /* ═══════════════════════════════════════════
     CONSTRUCTOR
  ═══════════════════════════════════════════ */

  constructor(
    private route: ActivatedRoute
  ) {}


  /* ═══════════════════════════════════════════
     STATE
  ═══════════════════════════════════════════ */

  loading = signal(false);

  formLoading = signal(false);

  showModal = signal(false);

  modeEdit = signal(false);


  /* ═══════════════════════════════════════════
     FILTERS
  ═══════════════════════════════════════════ */

  filtreGroupe = signal('');

  filtreEtudiant = signal('');

  filtreEvaluation = signal('');


  /* ═══════════════════════════════════════════
     GROUPES
  ═══════════════════════════════════════════ */

  groupes = signal([
    {
      id: 1,
      nom: 'المجموعة أ'
    },

    {
      id: 2,
      nom: 'مجموعة الأطفال'
    }
  ]);


  /* ═══════════════════════════════════════════
     ETUDIANTS
  ═══════════════════════════════════════════ */

  etudiants = signal<Etudiant[]>([

    {
      id: 1,
      nom: 'abcd',
      groupe: 'المجموعة أ'
    },

    {
      id: 2,
      nom: 'ra',
      groupe: 'مجموعة الأطفال'
    }

  ]);


  /* ═══════════════════════════════════════════
     HIFD DATA
  ═══════════════════════════════════════════ */

  hifd = signal<Hifd[]>([

    {
      id: 1,

      etudiant: {
        id: 1,
        nom: 'abcd',
        groupe: 'المجموعة أ'
      },

      sourate: 'البقرة',

      ayat_debut: 1,

      ayat_fin: 10,

      nombre_ayat: 10,

      evaluation: 'ممتاز',

      date: '2026-09-12',

      notes: 'حفظ جيد جداً'
    },


    {
      id: 2,

      etudiant: {
        id: 2,
        nom: 'ra',
        groupe: 'مجموعة الأطفال'
      },

      sourate: 'الفاتحة',

      ayat_debut: 1,

      ayat_fin: 7,

      nombre_ayat: 7,

      evaluation: 'جيد',

      date: '2026-09-12',

      notes: 'يحتاج مراجعة بسيطة'
    }

  ]);


  /* ═══════════════════════════════════════════
     FORM
  ═══════════════════════════════════════════ */

  form = signal({

    id: null as number | null,

    etudiant_id: '',

    sourate: '',

    ayat_debut: 1,

    ayat_fin: 1,

    evaluation: '',

    notes: ''

  });


  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */

  ngOnInit(): void {

    this.route.queryParams.subscribe(params => {

      const etudiantId =
        params['etudiant'];

      /*
       * إذا جينا من صفحة الطلاب
       * /hifd?etudiant=1
       */

      if (etudiantId) {

        this.filtreEtudiant.set(
          String(etudiantId)
        );

      }

      this.loadHifd();

    });

  }


  /* ═══════════════════════════════════════════
     LOAD HIFD
  ═══════════════════════════════════════════ */

  loadHifd(): void {

    /*
     * حالياً البيانات محلية.
     *
     * من بعد تقدر تبدل هاد الجزء
     * بـ Supabase / API.
     */

    this.loading.set(true);

    setTimeout(() => {

      this.loading.set(false);

    }, 300);

  }


  /* ═══════════════════════════════════════════
     FILTERED HIFD
  ═══════════════════════════════════════════ */

  hifdFiltres = computed(() => {

    const groupe =
      this.filtreGroupe();

    const etudiant =
      this.filtreEtudiant();

    const evaluation =
      this.filtreEvaluation();


    return this.hifd().filter(h => {

      /* ── STUDENT ── */

      const matchEtudiant =

        !etudiant ||

        String(
          this.getEtudiantId(h)
        ) === String(etudiant);


      /* ── GROUP ── */

      const matchGroupe =

        !groupe ||

        this.getGroupeId(h) ===
        Number(groupe);


      /* ── EVALUATION ── */

      const matchEvaluation =

        !evaluation ||

        h.evaluation === evaluation;


      return (
        matchEtudiant &&
        matchGroupe &&
        matchEvaluation
      );

    });

  });


  /* ═══════════════════════════════════════════
     FILTERED STUDENTS
  ═══════════════════════════════════════════ */

  etudiantsFiltres = computed(() => {

    const groupe =
      this.filtreGroupe();


    if (!groupe) {

      return this.etudiants();

    }


    /*
     * حالياً المجموعة مربوطة بالاسم.
     *
     * من بعد مع Supabase:
     * groupe_id === Number(groupe)
     */

    const selectedGroup =
      this.groupes().find(
        g =>
          g.id === Number(groupe)
      );


    if (!selectedGroup) {

      return this.etudiants();

    }


    return this.etudiants().filter(
      e =>
        e.groupe === selectedGroup.nom
    );

  });


  /* ═══════════════════════════════════════════
     STATISTICS
  ═══════════════════════════════════════════ */

  totalAyat = computed(() => {

    return this.hifdFiltres().reduce(
      (total, h) =>
        total + Number(h.nombre_ayat),

      0
    );

  });


  nombreExcellent = computed(() => {

    return this.hifdFiltres().filter(
      h =>
        h.evaluation === 'ممتاز'
    ).length;

  });


  nombreRevision = computed(() => {

    return this.hifdFiltres().filter(
      h =>
        h.evaluation === 'ضعيف'
    ).length;

  });


  /* ═══════════════════════════════════════════
     FORM UPDATE
  ═══════════════════════════════════════════ */

  updateForm(
    field: string,
    value: any
  ): void {

    this.form.update(current => ({

      ...current,

      [field]: value

    }));

  }


  /* ═══════════════════════════════════════════
     ADD
  ═══════════════════════════════════════════ */

  ouvrirAjout(): void {

    this.modeEdit.set(false);


    this.form.set({

      id: null,

      /*
       * إذا المستخدم كان جاي من
       * صفحة Etudiants
       * نخلي الطالب selected
       */

      etudiant_id:
        this.filtreEtudiant(),

      sourate: '',

      ayat_debut: 1,

      ayat_fin: 1,

      evaluation: '',

      notes: ''

    });


    this.showModal.set(true);

  }


  /* ═══════════════════════════════════════════
     EDIT
  ═══════════════════════════════════════════ */

  modifier(h: Hifd): void {

    this.modeEdit.set(true);


    const studentId =
      this.getEtudiantId(h);


    this.form.set({

      id: h.id,

      etudiant_id:
        studentId
          ? String(studentId)
          : '',

      sourate: h.sourate,

      ayat_debut: h.ayat_debut,

      ayat_fin: h.ayat_fin,

      evaluation: h.evaluation,

      notes: h.notes || ''

    });


    this.showModal.set(true);

  }


  /* ═══════════════════════════════════════════
     CLOSE MODAL
  ═══════════════════════════════════════════ */

  fermerModal(): void {

    this.showModal.set(false);

  }


  /* ═══════════════════════════════════════════
     SUBMIT
  ═══════════════════════════════════════════ */

  soumettre(): void {

    const data =
      this.form();


    /* ── VALIDATION ── */

    if (
      !data.etudiant_id ||
      !data.sourate.trim() ||
      !data.evaluation
    ) {

      return;

    }


    /* ── VALIDATE AYAT ── */

    if (
      Number(data.ayat_debut) < 1 ||
      Number(data.ayat_fin) <
      Number(data.ayat_debut)
    ) {

      return;

    }


    const nombreAyat =

      Number(data.ayat_fin) -
      Number(data.ayat_debut) +
      1;


    this.formLoading.set(true);


    /* ═══════════════════════════════
       EDIT
    ═══════════════════════════════ */

    if (
      this.modeEdit() &&
      data.id !== null
    ) {

      this.hifd.update(list =>

        list.map(h => {

          if (h.id !== data.id) {

            return h;

          }


          const student =
            this.etudiants().find(
              e =>
                e.id ===
                Number(data.etudiant_id)
            );


          return {

            ...h,

            etudiant: {

              id: student?.id,

              nom:
                student?.nom || '',

              groupe:
                student?.groupe || ''

            },

            sourate:
              data.sourate,

            ayat_debut:
              Number(data.ayat_debut),

            ayat_fin:
              Number(data.ayat_fin),

            nombre_ayat:
              nombreAyat,

            evaluation:
              data.evaluation as
                | 'ممتاز'
                | 'جيد'
                | 'متوسط'
                | 'ضعيف',

            notes:
              data.notes

          };

        })

      );

    }


    /* ═══════════════════════════════
       ADD
    ═══════════════════════════════ */

    else {

      const student =
        this.etudiants().find(
          e =>
            e.id ===
            Number(data.etudiant_id)
        );


      if (!student) {

        this.formLoading.set(false);

        return;

      }


      const newId =

        this.hifd().length > 0

          ? Math.max(
              ...this.hifd()
                .map(h => h.id)
            ) + 1

          : 1;


      this.hifd.update(list => [

        ...list,

        {

          id: newId,

          etudiant: {

            id: student.id,

            nom: student.nom,

            groupe: student.groupe

          },

          sourate:
            data.sourate,

          ayat_debut:
            Number(data.ayat_debut),

          ayat_fin:
            Number(data.ayat_fin),

          nombre_ayat:
            nombreAyat,

          evaluation:
            data.evaluation as
              | 'ممتاز'
              | 'جيد'
              | 'متوسط'
              | 'ضعيف',

          date:
            new Date()
              .toISOString()
              .split('T')[0],

          notes:
            data.notes

        }

      ]);

    }


    /* ═══════════════════════════════
       FINISH
    ═══════════════════════════════ */

    setTimeout(() => {

      this.formLoading.set(false);

      this.showModal.set(false);

    }, 300);

  }


  /* ═══════════════════════════════════════════
     DELETE
  ═══════════════════════════════════════════ */

  supprimer(h: Hifd): void {

    const confirmation =

      confirm(
        `هل تريد حذف تسجيل حفظ ${h.sourate}؟`
      );


    if (!confirmation) {

      return;

    }


    this.hifd.update(
      list =>
        list.filter(
          item =>
            item.id !== h.id
        )
    );

  }


  /* ═══════════════════════════════════════════
     EVALUATION BADGE
  ═══════════════════════════════════════════ */

  getEvaluationBadge(
    evaluation: string
  ): string {

    switch (evaluation) {

      case 'ممتاز':

        return 'badge-green';


      case 'جيد':

        return 'badge-blue';


      case 'متوسط':

        return 'badge-amber';


      case 'ضعيف':

        return 'badge-gray';


      default:

        return 'badge-gray';

    }

  }


  /* ═══════════════════════════════════════════
     GET STUDENT ID
  ═══════════════════════════════════════════ */

  getEtudiantId(
    h: Hifd
  ): number | undefined {

    /*
     * أولاً نستعمل id إذا كان موجوداً.
     */

    if (h.etudiant.id) {

      return h.etudiant.id;

    }


    /*
     * fallback بالاسم.
     */

    const student =
      this.etudiants().find(
        e =>
          e.nom ===
          h.etudiant.nom
      );


    return student?.id;

  }


  /* ═══════════════════════════════════════════
     GET GROUP ID
  ═══════════════════════════════════════════ */

  getGroupeId(
    h: Hifd
  ): number | null {

    const student =
      this.etudiants().find(
        e => {

          if (
            h.etudiant.id &&
            e.id ===
            h.etudiant.id
          ) {

            return true;

          }


          return (
            e.nom ===
            h.etudiant.nom
          );

        }
      );


    if (!student) {

      return null;

    }


    const groupe =
      this.groupes().find(
        g =>
          g.nom ===
          student.groupe
      );


    return groupe?.id ?? null;

  }

}

