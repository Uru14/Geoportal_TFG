import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {PrincipalComponent} from "./pages/principal/principal.component";
import {GeoportalComponent} from "./pages/geoportal/geoportal.component";
import {AboutComponent} from "./pages/about/about.component";

const routes: Routes = [
  {path: 'principal', component: PrincipalComponent, pathMatch: 'full'},
  {path: '', component: GeoportalComponent, pathMatch: 'full'},
  {path: 'about', component: AboutComponent, pathMatch: 'full'},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
