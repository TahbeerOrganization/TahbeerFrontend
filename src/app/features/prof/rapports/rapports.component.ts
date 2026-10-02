import { Component, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarComponent } from '../sidebar/sidebar.component';


@Component({
  selector: 'app-rapports',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent
  ],

  templateUrl: './rapports.component.html',
  styleUrl: './rapports.component.css'
})
export class RapportsComponent implements OnInit {


  /* =========================================================
     VIEW
  ========================================================= */

  activeReport =
    signal<'general' | 'etudiant'>('general');

  loading =
    signal(true);


  /* =========================================================
     GENERAL KPIs
  ========================================================= */

  totalEtudiants =
    signal(0);

  totalGroupes =
    signal(0);

  totalProgrammes =
    signal(0);

  totalSuivis =
    signal(0);

  totalSouratesCompletees =
    signal(0);

  totalPresences =
    signal(0);

  tauxPresence =
    signal(0);

  totalEvaluations =
    signal(0);

  moyenneEvaluation =
    signal(0);


  /* =========================================================
     GENERAL CHARTS
  ========================================================= */

  progressionSourates =
    signal<any[]>([]);

  repartitionGroupes =
    signal<any[]>([]);

  presenceStats =
    signal<any[]>([]);

  evaluationStats =
    signal<any[]>([]);


  /* =========================================================
     STUDENTS
  ========================================================= */

  etudiants =
    signal<any[]>([]);

  selectedEtudiantId =
    signal<string>('');


  /* =========================================================
     STUDENT REPORT
  ========================================================= */

  studentInfo =
    signal<any>(null);

  studentGroupes =
    signal<any[]>([]);

  studentSuivis =
    signal<any[]>([]);

  studentPresences =
    signal<any[]>([]);

  studentEvaluations =
    signal<any[]>([]);


  /* =========================================================
     STUDENT CHARTS
  ========================================================= */

  studentPresenceStats =
    signal<any[]>([]);

  studentHifdStats =
    signal<any[]>([]);

  studentEvaluationStats =
    signal<any[]>([]);


  /* =========================================================
     CONSTRUCTOR
  ========================================================= */

  constructor(
    private sb: SupabaseService,
    public auth: AuthService
  ) {}


  /* =========================================================
     INIT
  ========================================================= */

  async ngOnInit(): Promise<void> {

    await this.loadGeneralReport();

  }


  /* =========================================================
     SWITCH REPORT
  ========================================================= */

  async switchReport(
    report: 'general' | 'etudiant'
  ): Promise<void> {

    this.activeReport.set(report);

    if (report === 'general') {

      await this.loadGeneralReport();

      return;
    }


    await this.loadEtudiants();

  }


  /* =========================================================
     GENERAL REPORT
  ========================================================= */

  async loadGeneralReport(): Promise<void> {

    this.loading.set(true);

    try {

      await Promise.all([

        this.loadGeneralKPIs(),

        this.loadProgressionSourates(),

        this.loadRepartitionGroupes(),

        this.loadPresenceStats(),

        this.loadEvaluationStats()

      ]);

    } catch (error) {

      console.error(
        '❌ ERREUR RAPPORT GENERAL:',
        error
      );

    } finally {

      this.loading.set(false);

    }

  }


  /* =========================================================
     GENERAL KPIs
  ========================================================= */

  async loadGeneralKPIs(): Promise<void> {


    /* =====================================================
       ETUDIANTS
    ===================================================== */

    const {
      count: studentsCount,
      error: studentsError
    } = await this.sb.client

      .from('profiles')

      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      )

      .eq(
        'role',
        'etudiant'
      );


    if (studentsError) {

      console.error(
        '❌ STUDENTS COUNT:',
        studentsError
      );

    }


    this.totalEtudiants.set(
      studentsCount || 0
    );


    /* =====================================================
       GROUPES
    ===================================================== */

    const {
      count: groupesCount,
      error: groupesError
    } = await this.sb.client

      .from('groupes')

      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      );


    if (groupesError) {

      console.error(
        '❌ GROUPES COUNT:',
        groupesError
      );

    }


    this.totalGroupes.set(
      groupesCount || 0
    );


    /* =====================================================
       PROGRAMMES
    ===================================================== */

    const {
      count: programmesCount,
      error: programmesError
    } = await this.sb.client

      .from('programmes')

      .select(
        '*',
        {
          count: 'exact',
          head: true
        }
      );


    if (programmesError) {

      console.error(
        '❌ PROGRAMMES COUNT:',
        programmesError
      );

    }


    this.totalProgrammes.set(
      programmesCount || 0
    );


    /* =====================================================
       SUIVI SOURATES
    ===================================================== */

    const {
      data: suivis,
      error: suivisError
    } = await this.sb.client

      .from('suivi_sourates')

      .select(`
        id,
        statut,
        sourate_id,
        ayat_debut,
        ayat_fin
      `);


    if (suivisError) {

      console.error(
        '❌ SUIVI SOURATES:',
        suivisError
      );

    }


    const allSuivis =
      suivis || [];


    this.totalSuivis.set(
      allSuivis.length
    );


    this.totalSouratesCompletees.set(

      allSuivis.filter(
        s =>
          s.statut === 'مكتملة' ||
          s.statut === 'مكتمل'
      ).length

    );


    /* =====================================================
       PRESENCES
    ===================================================== */

    const {
      data: presences,
      error: presencesError
    } = await this.sb.client

      .from('presences')

      .select(`
        id,
        statut
      `);


    if (presencesError) {

      console.error(
        '❌ PRESENCES:',
        presencesError
      );

    }


    const allPresences =
      presences || [];


    this.totalPresences.set(
      allPresences.length
    );


    if (
      allPresences.length > 0
    ) {

      const presents =
        allPresences.filter(
          p =>
            p.statut === 'حاضر'
        ).length;


      this.tauxPresence.set(

        Math.round(

          (
            presents /
            allPresences.length
          ) * 100

        )

      );

    } else {

      this.tauxPresence.set(0);

    }


    /* =====================================================
       EVALUATIONS
    ===================================================== */

    const {
      data: evaluations,
      error: evaluationsError
    } = await this.sb.client

      .from('evaluations')

      .select(`
        note,
        note_max
      `);


    if (evaluationsError) {

      console.error(
        '❌ EVALUATIONS:',
        evaluationsError
      );

    }


    const allEvaluations =
      evaluations || [];


    this.totalEvaluations.set(
      allEvaluations.length
    );


    if (
      allEvaluations.length > 0
    ) {

      const total =
        allEvaluations.reduce(

          (
            sum,
            e
          ) => {

            const max =
              Number(
                e.note_max
              ) || 20;


            const note =
              Number(
                e.note
              ) || 0;


            return (
              sum +
              (
                note /
                max
              ) * 20
            );

          },

          0

        );


      this.moyenneEvaluation.set(

        Math.round(

          (
            total /
            allEvaluations.length
          ) * 10

        ) / 10

      );

    } else {

      this.moyenneEvaluation.set(0);

    }

  }


  /* =========================================================
     PROGRESSION SOURATES
  ========================================================= */

  async loadProgressionSourates(): Promise<void> {

    const {
      data: sourates,
      error: souratesError
    } = await this.sb.client

      .from('sourates')

      .select(`
        id,
        nom,
        nom_arabe,
        nb_ayat
      `)

      .order(
        'id'
      );


    if (souratesError) {

      console.error(
        '❌ SOURATES:',
        souratesError
      );

      this.progressionSourates.set([]);

      return;

    }


    const {
      data: suivis,
      error: suivisError
    } = await this.sb.client

      .from('suivi_sourates')

      .select(`
        sourate_id,
        statut,
        ayat_debut,
        ayat_fin
      `);


    if (suivisError) {

      console.error(
        '❌ SUIVIS SOURATES:',
        suivisError
      );

      this.progressionSourates.set([]);

      return;

    }


    const result =
      (sourates || [])

        .map(
          s => {

            const related =
              (suivis || [])
                .filter(
                  sv =>
                    sv.sourate_id ===
                    s.id
                );


            const completees =
              related.filter(
                sv =>
                  sv.statut === 'مكتملة' ||
                  sv.statut === 'مكتمل'
              ).length;


            const enCours =
              related.filter(
                sv =>
                  sv.statut === 'جارية' ||
                  sv.statut === 'قيد التقدم'
              ).length;


            return {

              ...s,

              completees,

              enCours,

              total:
                related.length

            };

          }
        )

        .filter(
          s =>
            s.total > 0
        );


    this.progressionSourates.set(
      result
    );

  }


  /* =========================================================
     GROUPES
  ========================================================= */

  async loadRepartitionGroupes(): Promise<void> {

    const {
      data: groupes,
      error: groupesError
    } = await this.sb.client

      .from('groupes')

      .select(`
        id,
        nom,
        type
      `)

      .order(
        'nom'
      );


    if (groupesError) {

      console.error(
        '❌ GROUPES:',
        groupesError
      );

      this.repartitionGroupes.set([]);

      return;

    }


    const {
      data: inscriptions,
      error: inscriptionsError
    } = await this.sb.client

      .from('groupe_etudiants')

      .select(`
        groupe_id,
        etudiant_id
      `);


    if (inscriptionsError) {

      console.error(
        '❌ GROUPE ETUDIANTS:',
        inscriptionsError
      );

      this.repartitionGroupes.set([]);

      return;

    }


    const result =

      (groupes || [])

        .map(
          g => {

            const students =
              (inscriptions || [])
                .filter(
                  x =>
                    x.groupe_id ===
                    g.id
                );


            return {

              ...g,

              nbEtudiants:
                students.length

            };

          }
        )

        .filter(
          g =>
            g.nbEtudiants > 0
        );


    this.repartitionGroupes.set(
      result
    );

  }


  /* =========================================================
     PRESENCE GLOBAL
  ========================================================= */

  async loadPresenceStats(): Promise<void> {

    const {
      data,
      error
    } = await this.sb.client

      .from('presences')

      .select(`
        date,
        statut
      `)

      .order(
        'date',
        {
          ascending: true
        }
      );


    if (error) {

      console.error(
        '❌ PRESENCE GLOBAL:',
        error
      );

      this.presenceStats.set([]);

      return;

    }


    if (!data) {

      this.presenceStats.set([]);

      return;

    }


    const grouped: any = {};


    data.forEach(
      p => {

        const date =
          new Date(
            p.date
          );


        const key =
          date.toLocaleDateString(
            'fr-FR',
            {
              month: 'short'
            }
          );


        if (!grouped[key]) {

          grouped[key] = {

            label: key,

            present: 0,

            absent: 0,

            total: 0

          };

        }


        grouped[key].total++;


        if (
          p.statut === 'حاضر'
        ) {

          grouped[key].present++;

        }


        if (
          p.statut === 'غائب'
        ) {

          grouped[key].absent++;

        }

      }
    );


    this.presenceStats.set(

      Object.values(
        grouped
      ).slice(-6)

    );

  }


  /* =========================================================
     EVALUATIONS GLOBAL
  ========================================================= */

  async loadEvaluationStats(): Promise<void> {

    const {
      data,
      error
    } = await this.sb.client

      .from('evaluations')

      .select(`
        note,
        note_max,
        type
      `);


    if (error) {

      console.error(
        '❌ EVALUATIONS GLOBAL:',
        error
      );

      this.evaluationStats.set([]);

      return;

    }


    if (!data) {

      this.evaluationStats.set([]);

      return;

    }


    const grouped: any = {};


    data.forEach(
      e => {

        const type =
          e.type ||
          'تقييم';


        if (!grouped[type]) {

          grouped[type] = {

            label: type,

            total: 0,

            sum: 0

          };

        }


        const max =
          Number(
            e.note_max
          ) || 20;


        const note =
          Number(
            e.note
          ) || 0;


        grouped[type].sum +=
          (
            note /
            max
          ) * 20;


        grouped[type].total++;

      }
    );


    const result =
      Object.values(
        grouped
      ).map(
        (x: any) => ({

          label:
            x.label,

          total:
            x.total,

          moyenne:
            Math.round(
              (
                x.sum /
                x.total
              ) * 10
            ) / 10

        })
      );


    this.evaluationStats.set(
      result
    );

  }


  /* =========================================================
     LOAD STUDENTS
  ========================================================= */

  async loadEtudiants(): Promise<void> {
  const { data, error } = await this.sb.client
    .from('profiles')
    .select(`
      id,
      nom
    `)
    .eq('role', 'etudiant')
    .order('nom', { ascending: true });

  if (error) {
    console.error('❌ ETUDIANTS:', error);
    this.etudiants.set([]);
    return;
  }

  console.log('✅ ETUDIANTS:', data);

  this.etudiants.set(data || []);
}


  /* =========================================================
     SELECT STUDENT
  ========================================================= */

  async selectEtudiant(
    id: string
  ): Promise<void> {

    this.selectedEtudiantId.set(
      id
    );


    if (!id) {

      this.clearStudentReport();

      return;

    }


    await this.loadStudentReport(
      id
    );

  }


  /* =========================================================
     CLEAR STUDENT REPORT
  ========================================================= */

  clearStudentReport(): void {

    this.studentInfo.set(null);

    this.studentGroupes.set([]);

    this.studentSuivis.set([]);

    this.studentPresences.set([]);

    this.studentEvaluations.set([]);

    this.studentPresenceStats.set([]);

    this.studentHifdStats.set([]);

    this.studentEvaluationStats.set([]);

  }


  /* =========================================================
     STUDENT REPORT
  ========================================================= */

  async loadStudentReport(
    studentId: string
  ): Promise<void> {

    this.loading.set(true);

    try {

      await Promise.all([

        this.loadStudentInfo(
          studentId
        ),

        this.loadStudentGroupes(
          studentId
        ),

        this.loadStudentHifd(
          studentId
        ),

        this.loadStudentPresence(
          studentId
        ),

        this.loadStudentEvaluations(
          studentId
        )

      ]);

    } catch (error) {

      console.error(
        '❌ RAPPORT ETUDIANT:',
        error
      );

    } finally {

      this.loading.set(false);

    }

  }


  /* =========================================================
     STUDENT INFO
  ========================================================= */

  async loadStudentInfo(
    studentId: string
  ): Promise<void> {

    const {
      data,
      error
    } = await this.sb.client

      .from('profiles')

      .select(`
        id,
        nom,
        created_at
      `)

      .eq(
        'id',
        studentId
      )

      .maybeSingle();


    if (error) {

      console.error(
        '❌ INFO ETUDIANT:',
        error
      );

    }


    this.studentInfo.set(
      data || null
    );

  }


  /* =========================================================
     STUDENT GROUPES + PROGRAMMES
  ========================================================= */

  async loadStudentGroupes(
    studentId: string
  ): Promise<void> {

    const {
      data,
      error
    } = await this.sb.client

      .from('groupe_etudiants')

      .select(`
        groupe_id,
        groupes(
          id,
          nom,
          type,
          programme_id,
          programmes(
            id,
            nom
          )
        )
      `)

      .eq(
        'etudiant_id',
        studentId
      );


    if (error) {

      console.error(
        '❌ GROUPES ETUDIANT:',
        error
      );

      this.studentGroupes.set([]);

      return;

    }


    const groupes =
      (data || [])

        .map(
          (x: any) =>
            x.groupes
        )

        .filter(
          Boolean
        );


    this.studentGroupes.set(
      groupes
    );

  }


  /* =========================================================
     STUDENT HIFD
  ========================================================= */

  async loadStudentHifd(
    studentId: string
  ): Promise<void> {

    const {
      data,
      error
    } = await this.sb.client

      .from('suivi_sourates')

      .select(`
        id,
        sourate_id,
        ayat_debut,
        ayat_fin,
        statut,
        evaluation,
        updated_at,
        sourates(
          id,
          nom,
          nom_arabe,
          nb_ayat
        )
      `)

      .eq(
        'etudiant_id',
        studentId
      )

      .order(
        'updated_at',
        {
          ascending: false
        }
      );


    if (error) {

      console.error(
        '❌ HIFD ETUDIANT:',
        error
      );

      this.studentSuivis.set([]);

      this.studentHifdStats.set([]);

      return;

    }


    const suivis =
      data || [];


    this.studentSuivis.set(
      suivis
    );


    this.buildStudentHifdChart(
      suivis
    );

  }


  /* =========================================================
     STUDENT PRESENCE
  ========================================================= */

  async loadStudentPresence(
    studentId: string
  ): Promise<void> {

    const {
      data,
      error
    } = await this.sb.client

      .from('presences')

      .select(`
        id,
        date,
        statut
      `)

      .eq(
        'etudiant_id',
        studentId
      )

      .order(
        'date',
        {
          ascending: true
        }
      );


    if (error) {

      console.error(
        '❌ PRESENCE ETUDIANT:',
        error
      );

      this.studentPresences.set([]);

      this.studentPresenceStats.set([]);

      return;

    }


    const presences =
      data || [];


    this.studentPresences.set(
      presences
    );


    this.buildStudentPresenceChart(
      presences
    );

  }


  /* =========================================================
     STUDENT EVALUATIONS
  ========================================================= */

  async loadStudentEvaluations(
    studentId: string
  ): Promise<void> {

    const {
      data,
      error
    } = await this.sb.client

      .from('evaluations')

      .select(`
        id,
        note,
        note_max,
        type,
        date,
        created_at,
        sourates(
          id,
          nom,
          nom_arabe
        )
      `)

      .eq(
        'etudiant_id',
        studentId
      )

      .order(
        'created_at',
        {
          ascending: false
        }
      );


    if (error) {

      console.error(
        '❌ EVALUATIONS ETUDIANT:',
        error
      );

      this.studentEvaluations.set([]);

      this.studentEvaluationStats.set([]);

      return;

    }


    const evaluations =
      data || [];


    this.studentEvaluations.set(
      evaluations
    );


    this.buildStudentEvaluationChart(
      evaluations
    );

  }


  /* =========================================================
     STUDENT HIFD CHART
  ========================================================= */

  buildStudentHifdChart(
    suivis: any[]
  ): void {

    const completees =
      suivis.filter(
        s =>
          s.statut === 'مكتملة' ||
          s.statut === 'مكتمل'
      ).length;


    const enCours =
      suivis.filter(
        s =>
          s.statut === 'جارية' ||
          s.statut === 'قيد التقدم'
      ).length;


    const total =
      suivis.length;


    const autres =
      Math.max(
        0,
        total -
        completees -
        enCours
      );


    this.studentHifdStats.set([

      {
        label: 'مكتملة',
        value: completees,
        color: '#1D9E75'
      },

      {
        label: 'جارية',
        value: enCours,
        color: '#1B6FA8'
      },

      {
        label: 'أخرى',
        value: autres,
        color: '#D85A30'
      }

    ]);

  }


  /* =========================================================
     STUDENT PRESENCE CHART
  ========================================================= */

  buildStudentPresenceChart(
    presences: any[]
  ): void {

    const present =
      presences.filter(
        p =>
          p.statut === 'حاضر'
      ).length;


    const absent =
      presences.filter(
        p =>
          p.statut === 'غائب'
      ).length;


    const other =
      Math.max(
        0,
        presences.length -
        present -
        absent
      );


    this.studentPresenceStats.set([

      {
        label: 'حاضر',
        value: present,
        color: '#1D9E75'
      },

      {
        label: 'غائب',
        value: absent,
        color: '#D85A30'
      },

      {
        label: 'أخرى',
        value: other,
        color: '#888'
      }

    ]);

  }


  /* =========================================================
     STUDENT EVALUATION CHART
  ========================================================= */

  buildStudentEvaluationChart(
    evaluations: any[]
  ): void {

    const result =

      evaluations

        .slice(
          0,
          8
        )

        .reverse()

        .map(
          e => {

            const max =
              Number(
                e.note_max
              ) || 20;


            const note =
              Number(
                e.note
              ) || 0;


            return {

              label:
                e.sourates?.nom ||
                e.type ||
                'تقييم',

              value:
                Math.round(
                  (
                    note /
                    max
                  ) * 20 * 10
                ) / 10

            };

          }
        );


    this.studentEvaluationStats.set(
      result
    );

  }


  /* =========================================================
     BAR WIDTH
  ========================================================= */

  getBarWidth(
    value: number,
    max: number
  ): number {

    if (!max) {
      return 0;
    }


    return Math.min(

      100,

      Math.round(
        (
          value /
          max
        ) * 100
      )

    );

  }


  /* =========================================================
     STUDENT PRESENCE %
  ========================================================= */

  getPresencePercent(): number {

    const stats =
      this.studentPresenceStats();


    const present =
      stats.find(
        x =>
          x.label === 'حاضر'
      )?.value || 0;


    const total =
      stats.reduce(
        (
          sum,
          x
        ) =>
          sum + x.value,
        0
      );


    if (!total) {
      return 0;
    }


    return Math.round(
      (
        present /
        total
      ) * 100
    );

  }


  /* =========================================================
     STUDENT HIFD COMPLETED
  ========================================================= */

  getStudentHifdCompletees(): number {

    return this.studentSuivis()

      .filter(
        s =>
          s.statut === 'مكتملة' ||
          s.statut === 'مكتمل'
      )

      .length;

  }


  /* =========================================================
     STUDENT HIFD TOTAL
  ========================================================= */

  getStudentHifdTotal(): number {

    return this.studentSuivis()
      .length;

  }


  /* =========================================================
     STUDENT AVERAGE
  ========================================================= */

  getStudentAverage(): number {

    const evals =
      this.studentEvaluations();


    if (!evals.length) {
      return 0;
    }


    const total =
      evals.reduce(

        (
          sum,
          e
        ) => {

          const max =
            Number(
              e.note_max
            ) || 20;


          const note =
            Number(
              e.note
            ) || 0;


          return (

            sum +

            (
              note /
              max
            ) * 20

          );

        },

        0

      );


    return Math.round(

      (
        total /
        evals.length
      ) * 10

    ) / 10;

  }


  /* =========================================================
     STUDENT TOTAL AYAT
  ========================================================= */

  getStudentTotalAyat(): number {

    return this.studentSuivis()

      .reduce(
        (
          total,
          s
        ) => {

          const debut =
            Number(
              s.ayat_debut
            ) || 0;


          const fin =
            Number(
              s.ayat_fin
            ) || 0;


          if (
            fin >= debut &&
            debut > 0
          ) {

            return (
              total +
              (
                fin -
                debut +
                1
              )
            );

          }


          return total;

        },

        0

      );

  }


  /* =========================================================
     NOTE CLASS
  ========================================================= */

  getNoteClass(
    note: number,
    max: number
  ): string {

    const pct =
      max
        ? note / max
        : 0;


    if (
      pct >= 0.85
    ) {

      return 'note-green';

    }


    if (
      pct >= 0.65
    ) {

      return 'note-amber';

    }


    return 'note-red';

  }


  /* =========================================================
     GROUPE COLOR
  ========================================================= */

  getGroupeColor(
    type: string
  ): string {

    const colors: any = {

      'رجال':
        '#1B6FA8',

      'نساء':
        '#534AB7',

      'أطفال':
        '#1D9E75'

    };


    return (
      colors[type] ||
      '#888'
    );

  }


  /* =========================================================
     FORMAT DATE
  ========================================================= */

  formatDate(
    value: string
  ): string {

    if (!value) {
      return '—';
    }


    return new Date(
      value
    ).toLocaleDateString(
      'ar-MA'
    );

  }


  /* =========================================================
     REFRESH
  ========================================================= */

  async refresh(): Promise<void> {

    if (
      this.activeReport() ===
      'general'
    ) {

      await this.loadGeneralReport();

      return;

    }


    await this.loadEtudiants();


    const id =
      this.selectedEtudiantId();


    if (id) {

      await this.loadStudentReport(
        id
      );

    }

  }

}

