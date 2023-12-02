import {Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild} from '@angular/core';
import { MatSidenav } from "@angular/material/sidenav";
import {CompartidoService} from "../../../Services/compartido.service";
import {LocalStorageProvider} from "../../../Services/LocalStorageService/LocalStorageProvider";
import {GeoportalComponent} from "../geoportal.component";
import { Map as OLMap, View} from 'ol';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs';
import * as xml2js from 'xml2js';
import {MatDialog} from '@angular/material/dialog';


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
  selectedSRC: string = 'EPSG:4326';




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
  isSidenavOpen = false;
  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
    this.sidenav.toggle();
  }

  sidenavOpened(opened: boolean) {
    this.isSidenavOpen = opened;
  }

  isXsScreen = false;

  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    this.isXsScreen = window.innerWidth < 576; // Puedes ajustar este valor según tu definición de 'xs'
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
    this.compartidoService.descargar(this.formatoSeleccionado, this.selectedSRC);
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

    // // La URL del servidor Apache
    // const apacheServerUrl = 'http://192.168.1.14/'; // Reemplaza con la URL de tu servidor Apache
    //
    // // Concatena la URL del servidor Apache con la URL WMS, asegúrate de que estén separadas por una barra "/"
    // const capabilitiesUrl = `${apacheServerUrl}${this.wmsUrl}`;
    const capabilitiesUrl = this.wmsUrl;
    this.wmsUrlTemp = this.wmsUrl;

    this.http.get(capabilitiesUrl, { responseType: 'text' })
      .pipe( //sirve para manejar la respuesta o cualquier error que pueda ocurrir
        catchError((error) => throwError('Error al obtener las capas disponibles')),
        map((response) => this.parseCapabilitiesResponse(response))
      )
      .subscribe((layers) => { //Suscribe el componente al observable resultante y actualiza la lista de capas disponibles.
        this.availableLayers = layers;
      });
    console.log(capabilitiesUrl);
    this.wmsUrl = '';
  }


  // parseCapabilitiesResponse(xmlResponse: string): string[] {
  //   const parser = new xml2js.Parser({ explicitArray: false });
  //   let layers: string[] = [];
  //
  //   parser.parseString(xmlResponse, (err, result) => {
  //     if (result?.WMS_Capabilities?.Capability?.Layer?.Layer) {
  //       layers = result.WMS_Capabilities.Capability.Layer.Layer.map((layer: any) => layer.Name);
  //     }
  //   });
  //   console.log(layers);
  //
  //   return layers;
  // }

  parseCapabilitiesResponse(xmlResponse: string): string[] {
    const parser = new xml2js.Parser({ explicitArray: false }); //procesa el XML y lo convierte a objeto Javascript
    let layers: string[] = [];

    parser.parseString(xmlResponse, (err, result) => { //Utiliza el método parseString del objeto Parser para analizar la respuesta XML y obtiene el resultado en formato JavaScript.
      if (result?.WMS_Capabilities?.Capability?.Layer) { //Verifica si el resultado contiene las propiedades necesarias para extraer los nombres de las capas.
        layers = this.extractLayerNames(result.WMS_Capabilities.Capability.Layer);
      }
    });
    console.log(layers);
    return layers;
  }

  private extractLayerNames(layer: any): string[] {
    let layerNames: string[] = [];

    if (Array.isArray(layer)) { //Si layer es un array, itera sobre cada subcapa y llama recursivamente a extractLayerNames para obtener los nombres de las subcapas.
      for (const subLayer of layer) {
        layerNames = layerNames.concat(this.extractLayerNames(subLayer));
      }
    } else { //Si layer no es un array, asume que es una capa y agrega su nombre al array layerNames.
      layerNames.push(layer.Name);
      if (layer.Layer) {
        layerNames = layerNames.concat(this.extractLayerNames(layer.Layer));
      }
    }
    console.log(layerNames);
    return layerNames;
  }



  agregarCapaSeleccionada() {
    if (this.selectedLayer.trim() === '') {
      return;
    }

    // Dividir la URL y quedarse con la parte izquierda (antes del ?)
    let cleanedUrl = this.wmsUrlTemp.split('?')[0];

    this.compartidoService.agregarCapaWMS(cleanedUrl, this.selectedLayer);

    this.wmsUrl = '';
    console.log(this.selectedLayer);
  }
  quitarCapaSeleccionada() {
    this.compartidoService.quitarCapaWMS(this.wmsUrlTemp, this.selectedLayer);


  }


}
