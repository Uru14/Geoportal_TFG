import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { MatSidenav } from "@angular/material/sidenav";
import {CompartidoService} from "../../../Services/compartido.service";
import {LocalStorageProvider} from "../../../Services/LocalStorageService/LocalStorageProvider";
import {GeoportalComponent} from "../geoportal.component";
import { Map as OLMap, View} from 'ol';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import * as xml2js from 'xml2js';



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
  wmsUrlTemp: string = '';
  availableLayers: string[] = [];
  selectedLayer: string = '';




  @ViewChild(MatSidenav) sidenav!: MatSidenav;
  @ViewChild(GeoportalComponent) geoportalComponent!: GeoportalComponent;
  @Input() map!: OLMap;



  constructor(
    private compartidoService : CompartidoService,
    private localStorageProvider: LocalStorageProvider,
    private http: HttpClient) { }


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

  // agregarWMS() {
  //   if (this.wmsUrl.trim() === '') {
  //     return;
  //   }
  //
  //   this.wmsUrlTemp = this.wmsUrl;
  //
  //   // Realiza una solicitud GetCapabilities al servicio WMS para obtener información sobre las capas disponibles
  //   const capabilitiesUrl = this.wmsUrl + '?service=WMS&request=GetCapabilities';
  //   this.http.get(capabilitiesUrl, { responseType: 'text' })
  //     .pipe(
  //       catchError((error) => throwError('Error al obtener las capas disponibles')),
  //       map((response) => this.parseCapabilitiesResponse(response))
  //     )
  //     .subscribe((layers) => {
  //       this.availableLayers = layers;
  //     });
  //   console.log(capabilitiesUrl);
  //
  //   this.wmsUrl = '';
  // }
  agregarWMS() {
    if (this.wmsUrl.trim() === '') {
      return;
    }

    // Verifica si la URL ya contiene la solicitud GetCapabilities
    if (!this.wmsUrl.includes('GetCapabilities')) {
      // Si no lo contiene, agrégalo
      if (!this.wmsUrl.includes('?')) {
        this.wmsUrl += '?';
      } else {
        this.wmsUrl += '&';
      }
      this.wmsUrl += 'service=WMS&request=GetCapabilities';
    }

    this.wmsUrlTemp = this.wmsUrl;

    // Realiza una solicitud GetCapabilities al servicio WMS para obtener información sobre las capas disponibles
    const capabilitiesUrl = this.wmsUrl;
    this.http.get(capabilitiesUrl, { responseType: 'text' })
      .pipe(
        catchError((error) => throwError('Error al obtener las capas disponibles')),
        map((response) => this.parseCapabilitiesResponse(response))
      )
      .subscribe((layers) => {
        this.availableLayers = layers;
      });
    console.log(capabilitiesUrl);
    this.wmsUrl = '';
  }


  parseCapabilitiesResponse(xmlResponse: string): string[] {
    const parser = new xml2js.Parser({ explicitArray: false });
    let layers: string[] = [];

    parser.parseString(xmlResponse, (err, result) => {
      if (result?.WMS_Capabilities?.Capability?.Layer?.Layer) {
        layers = result.WMS_Capabilities.Capability.Layer.Layer.map((layer: any) => layer.Name);
      }
    });
    console.log(layers);

    return layers;
  }

  // parseCapabilitiesResponse(xmlResponse: string): string[] {
  //   const parser = new xml2js.Parser({ explicitArray: false });
  //   let layers: string[] = [];
  //
  //   parser.parseString(xmlResponse, (err, result) => {
  //     if (result?.WMS_Capabilities?.Capability?.Layer) {
  //       layers = this.extractLayerNames(result.WMS_Capabilities.Capability.Layer);
  //     }
  //   });
  //   console.log(layers);
  //   return layers;
  // }
  //
  // private extractLayerNames(layer: any): string[] {
  //   let layerNames: string[] = [];
  //
  //   if (Array.isArray(layer)) {
  //     for (const subLayer of layer) {
  //       layerNames = layerNames.concat(this.extractLayerNames(subLayer));
  //     }
  //   } else {
  //     layerNames.push(layer.Name);
  //     if (layer.Layer) {
  //       layerNames = layerNames.concat(this.extractLayerNames(layer.Layer));
  //     }
  //   }
  //   console.log(layerNames);
  //   return layerNames;
  // }



  agregarCapaSeleccionada() {
    if (this.selectedLayer.trim() === '') {
      return;
    }
    this.compartidoService.agregarCapaWMS(this.wmsUrlTemp, this.selectedLayer);

    this.wmsUrl = '';
    console.log(this.selectedLayer);
  }
  quitarCapaSeleccionada() {
    this.compartidoService.quitarCapaWMS(this.wmsUrlTemp, this.selectedLayer);


  }


}
