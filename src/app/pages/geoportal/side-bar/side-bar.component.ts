import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSidenav } from "@angular/material/sidenav";
import {CompartidoService} from "../../../Services/compartido.service";
import {LocalStorageProvider} from "../../../Services/LocalStorageService/LocalStorageProvider";
import {GeoportalComponent} from "../geoportal.component";
import WKT from 'ol/format/WKT.js';



@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent implements OnInit {

  selectedPolygonCoordinates: string = '';
  selectedGeometryCoordinates: string = '';
  polygonId: string = '';
  geometryType: string = '';
  wktFormat: WKT = new WKT();
  @ViewChild(MatSidenav) sidenav!: MatSidenav;
  @ViewChild(GeoportalComponent) geoportalComponent!: GeoportalComponent;

  constructor(
    private compartidoService : CompartidoService,
    private localStorageProvider: LocalStorageProvider) { }

  togglePNOA() {
    this.compartidoService.togglePNOA();
  }

  toggleWMS() {
    this.compartidoService.toggleWMS();
  }

  dibujarPoligono() {
    this.compartidoService.dibujarPoligono();
  }
  dibujarPunto() {
    this.compartidoService.dibujarPunto();
  }
  dibujarDistancia() {
    this.compartidoService.dibujarDistancia();
  }

  // seleccionar(polygonId: string) {
  //   this.polygonId = polygonId;
  //   this.compartidoService.seleccionar(this.polygonId);
  //   // const selectedPolygonId = this.compartidoService.getSelectedPolygonId();
  //   const selectedPolygonId = this.compartidoService.getSelectedGeometryType();
  //   this.selectedPolygonCoordinates = this.localStorageProvider.getPolygonDataById(selectedPolygonId);
  // }
  seleccionar(geometryType: string) {
    this.geometryType = geometryType;
    this.compartidoService.seleccionar(geometryType);
    const selectedGeometryId = this.compartidoService.getSelectedGeometryType();
    this.selectedGeometryCoordinates = this.localStorageProvider.getGeometryDataById(selectedGeometryId);
  }

  eliminarGeometrias() {
    this.compartidoService.triggerEliminarGeometrias();
  }

  descargar(){
    return this.compartidoService.descargar();
  }


  // getPolygonData(): string {
  //   const polygonData = this.localStorageProvider.getData();
  //   // Puedes formatear los datos de los polígonos según tus necesidades
  //   // return JSON.stringify(polygonData);
  //   const wktGeometries = polygonData.map((item: any) => {
  //     const coordinates = item.geometry[0]; // Obtenemos las coordenadas del primer anillo
  //     const wktCoordinates = coordinates.map((coord: number[]) => coord.join(' ')).join(', ');
  //     return `POLYGON ((${wktCoordinates}))`;
  //   });
  //   return wktGeometries.join(';');
  // }

  ngOnInit(): void {
    // this.selectedPolygonCoordinates = this.getPolygonData();
  }


}
