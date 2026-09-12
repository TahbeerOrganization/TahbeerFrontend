import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login/login.component')
        .then(m => m.LoginComponent)
  },

  // ── Prof ───────────────────────────────────────
  {
    path: 'prof',
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/prof/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'etudiants',
        loadComponent: () =>
          import('./features/prof/etudiants/etudiants.component')
            .then(m => m.EtudiantsComponent)
      },
      {
        path: 'presences',
        loadComponent: () =>
          import('./features/prof/presences/presences.component')
            .then(m => m.PresencesComponent)
      },
      {
        path: 'sourates',
        loadComponent: () =>
          import('./features/prof/sourates/sourates.component')
            .then(m => m.SouratesComponent)
      },
      {
        path: 'devoirs',
        loadComponent: () =>
          import('./features/prof/devoirs/devoirs.component')
            .then(m => m.DevoirsComponent)
      },
      {
        path: 'evaluations',
        loadComponent: () =>
          import('./features/prof/evaluations/evaluations.component')
            .then(m => m.EvaluationsComponent)
      },
      {
        path: 'groupes',
        loadComponent: () =>
          import('./features/prof/groupes/groupes.component')
            .then(m => m.GroupesComponent)
      },
      {
        path: 'rapports',
        loadComponent: () =>
          import('./features/prof/rapports/rapports.component')
            .then(m => m.RapportsComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── Etudiant ───────────────────────────────────
  {
    path: 'etudiant',
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/etudiant/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
      {
        path: 'mes-sourates',
        loadComponent: () =>
          import('./features/etudiant/mes-sourates/mes-sourates.component')
            .then(m => m.MesSouratesComponent)
      },
      {
        path: 'mes-presences',
        loadComponent: () =>
          import('./features/etudiant/mes-presences/mes-presences.component')
            .then(m => m.MesPresencesComponent)
      },
      {
        path: 'mes-devoirs',
        loadComponent: () =>
          import('./features/etudiant/mes-devoirs/mes-devoirs.component')
            .then(m => m.MesDevoirsComponent)
      },
      {
        path: 'mes-evaluations',
        loadComponent: () =>
          import('./features/etudiant/mes-evaluations/mes-evaluations.component')
            .then(m => m.MesEvaluationsComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login' }
];