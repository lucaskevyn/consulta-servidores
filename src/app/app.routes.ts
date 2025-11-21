import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'consulta-servidores',
    pathMatch: 'full',
  },
  {
    path: 'consulta-servidores',
    loadComponent: () =>
      import(
        './features/consulta-servidores/consulta-servidores.component'
      ).then((m) => m.ConsultaServidoresComponent),
  },
];
