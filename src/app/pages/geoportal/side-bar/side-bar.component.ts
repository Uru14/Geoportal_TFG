import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { MatSidenav } from "@angular/material/sidenav";
import {CompartidoService} from "../../../Services/compartido.service";
import {LocalStorageProvider} from "../../../Services/LocalStorageService/LocalStorageProvider";
import {GeoportalComponent} from "../geoportal.component";
import { Map as OLMap, View} from 'ol';


@Component({
  selector: 'app-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.css']
})
export class SideBarComponent implements OnInit {

  selectedGeometryCoordinates: string = '';
  geometryType: string = '';
  formatoSeleccionado: string = '';
  wmsUrl: string = '';

  @ViewChild(MatSidenav) sidenav!: MatSidenav;
  @ViewChild(GeoportalComponent) geoportalComponent!: GeoportalComponent;
  @Input() map!: OLMap;


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

  seleccionar(geometryType: string) {
    this.geometryType = geometryType;
    this.compartidoService.seleccionar(geometryType);
    const selectedGeometryId = this.compartidoService.getSelectedGeometryType();
    this.selectedGeometryCoordinates = this.localStorageProvider.getGeometryDataById(selectedGeometryId);
  }

  eliminarGeometrias() {
    this.compartidoService.triggerEliminarGeometrias();
  }

  descargarFormato(formato: string) {
    this.formatoSeleccionado = formato;
    this.compartidoService.descargar(this.formatoSeleccionado);
  }


  ngOnInit(): void {
    // this.selectedPolygonCoordinates = this.getPolygonData();
  }

  onFileSelected(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (inputElement.files && inputElement.files.length > 0) {
      const file = inputElement.files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const geoJSONData = JSON.parse(reader.result as string);
        this.compartidoService.loadAndDisplayGeoJSON(geoJSONData);
      };

      reader.readAsText(file);
    }
  }

  agregarWMS() {
    // Verifica si se proporcionó una URL
    if (this.wmsUrl.trim() === '') {
      return;
    }

    this.compartidoService.agregarCapaWMS(this.wmsUrl);

    this.wmsUrl = '';
  }
}
