import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CabeceraComponent } from './component/cabecera/cabecera.component';
import { PieComponent } from './component/pie/pie.component';
import { AboutComponent } from './pages/about/about.component';
import { GeoportalComponent } from './pages/geoportal/geoportal.component';
import { PrincipalComponent } from './pages/principal/principal.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatToolbarModule} from "@angular/material/toolbar";
import { SideBarComponent } from './pages/geoportal/side-bar/side-bar.component';
import {MatSidenavModule} from "@angular/material/sidenav";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import {MatListModule} from "@angular/material/list";
import {MatInputModule} from "@angular/material/input";
import {MatSelectModule} from "@angular/material/select";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatIconModule} from "@angular/material/icon";
import {MatMenuModule} from "@angular/material/menu";
import { HttpClientModule } from '@angular/common/http';



@NgModule({
  declarations: [
    AppComponent,
    CabeceraComponent,
    PieComponent,
    AboutComponent,
    GeoportalComponent,
    PrincipalComponent,
    SideBarComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatToolbarModule,
        MatSidenavModule,
        MatSlideToggleModule,
        MatListModule,
        MatInputModule,
        MatSelectModule,
        ReactiveFormsModule,
        MatIconModule,
        MatMenuModule,
        FormsModule,
        HttpClientModule
    ],
  exports: [
    GeoportalComponent,
    SideBarComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
