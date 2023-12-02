import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import * as jsonexport from 'jsonexport';
import {LocalStorageProvider} from "./LocalStorageService/LocalStorageProvider";
import * as proj4 from 'proj4';




@Injectable({
  providedIn: 'root'
})
export class CompartidoService {

  public showPNOA = false;
  public showWMS = false;
  public showPNOA$ = new BehaviorSubject<boolean>(this.showPNOA);
  public showWMS$ = new BehaviorSubject<boolean>(this.showWMS);
  public drawing = false;
  public selecting = false;
  public drawing$ = new BehaviorSubject<boolean>(this.drawing);
  public selecting$ = new BehaviorSubject<boolean>(this.selecting);
  public selectedGeometryType: string = '';
  public drawingPunto: boolean = false;
  public drawingDistancia: boolean = false;
  public drawingPunto$ = new BehaviorSubject<boolean>(this.drawingPunto);
  public drawingDistancia$ = new BehaviorSubject<boolean>(this.drawingDistancia);
  private eliminarGeometriasSubject = new Subject<void>();
  eliminarGeometrias$ = this.eliminarGeometriasSubject.asObservable();
  private geoJSONDataSubject = new Subject<any>();
  geoJSONData$ = this.geoJSONDataSubject.asObservable();
  private agregarNuevaCapaWMSSubject = new Subject<{ url: string, nombreCapa: string }>();
  agregarNuevaCapaWMS$ = this.agregarNuevaCapaWMSSubject.asObservable();
  private quitarCapaWMSSubject = new Subject<{ url: string, nombreCapa: string }>();
  quitarCapaWMS$ = this.quitarCapaWMSSubject.asObservable();




  constructor() {
  }

  togglePNOA() {
    this.showPNOA = !this.showPNOA;
    this.showPNOA$.next(this.showPNOA);
  }

  toggleWMS() {
    console.log("toggleWMS called");
    this.showWMS = !this.showWMS;
    this.showPNOA = false;
    this.showPNOA$.next(this.showPNOA);

    console.log("WMS status:", this.showWMS)
    this.showWMS$.next(this.showWMS);
  }

  dibujarPoligono() {
    console.log("dibujar called");
    this.drawing = !this.drawing;
    this.selecting = false;
    this.drawing$.next(this.drawing);
    this.selecting$.next(this.selecting);
    this.drawingPunto$.next(false);
    this.drawingDistancia$.next(false);
  }

  dibujarPunto() {
    console.log("dibujar punto called");
    this.drawingPunto = !this.drawingPunto;
    this.drawingDistancia = false;
    this.drawingPunto$.next(this.drawingPunto);
    this.drawingDistancia$.next(false);
    this.drawing$.next(false);
  }

  dibujarDistancia() {
    console.log("dibujar distancia called");
    this.drawingDistancia = !this.drawingDistancia;
    this.drawingPunto = false;
    this.drawingDistancia$.next(this.drawingDistancia);
    this.drawingPunto$.next(false);
    this.drawing$.next(false);
  }

  seleccionar(geometryType: string) {
    console.log("seleccionar called");
    this.selecting = !this.selecting;
    this.drawing = false;
    this.drawingPunto$.next(false);
    this.drawingDistancia$.next(false);
    this.selecting$.next(this.selecting);
    this.drawing$.next(this.drawing);
    this.selectedGeometryType = geometryType; // Guarda el tipo de geometría seleccionado
  }

  getSelectedGeometryType(): string {
    return this.selectedGeometryType;
  }

  triggerEliminarGeometrias() {
    this.eliminarGeometriasSubject.next();
  }


  descargar(formato: string, selectedSRC: string) {
    const localStorageProvider = new LocalStorageProvider();
    const geometrias = localStorageProvider.getData();


    console.log("geometrias", geometrias);
    console.log("SRC", selectedSRC);

    // Verifica si se requiere una transformación y aplícala
    /*if (selectedSRC !== 'EPSG:4326') {
          // Define la función de transformación entre las proyecciones
          const transformFunction = proj4('EPSG:4326', selectedSRC);

          geometrias.forEach((geometria: any) => {
              if (geometria.type === 'Point') {
                  const [x, y] = transformFunction.forward(geometria.geometry[0], geometria.geometry[1]);
                  geometria.geometry = [x, y]; // Transforma las coordenadas
              } else if (geometria.type === 'LineString' || geometria.type === 'Polygon') {
                  geometria.geometry = geometria.geometry.map((ring: number[]) => {
                      return ring.map((coord: number[]) => {
                          const [x, y] = transformFunction.forward(coord[0], coord[1]);
                          return [x, y]; // Transforma las coordenadas
                      });
                  });
              }
          });
    }*/


      if (formato === 'geojson') {

      const geoJSONData = {
        type: "FeatureCollection",
        features: geometrias.map((geometria: any) => {

          return {
            type: "Feature",
            geometry: {
              type: geometria.type,
              coordinates: geometria.geometry
            },
            properties: {}
          };
        })
      };

      const geoJSONString = JSON.stringify(geoJSONData, null, 2);
      this.descargarArchivo(geoJSONString, 'geometrias.geojson', 'application/json');
    } else if (formato === 'wkt') {

      const wktFeatures = geometrias.map((geometria: any) => {
        let wktGeometry = '';

        if (geometria.type === 'Point') {
          wktGeometry = `POINT(${geometria.geometry.join(' ')})`;
        } else if (geometria.type === 'LineString') {
          wktGeometry = `LINESTRING(${geometria.geometry.map((coord: number[]) => coord.join(' ')).join(',')})`;
        } else if (geometria.type === 'Polygon') {
          wktGeometry = `POLYGON((${geometria.geometry[0].map((coord: number[]) => coord.join(' ')).join(',')}))`;
        }

        return wktGeometry;
      });

      const wktString = wktFeatures.join('\n');
      this.descargarArchivo(wktString, 'geometrias.wkt', 'text/plain');
    } else if (formato === 'csv') {

      jsonexport(geometrias, (err: any, csv: string) => { // Utiliza una función de flecha
        if (err) {
          console.error('Error al generar el archivo CSV:', err);
          return;
        }

        this.descargarArchivo(csv, 'geometrias.csv', 'text/csv;charset=utf-8');
      });
    }
  }

  private descargarArchivo(data: string, nombreArchivo: string, tipoArchivo: string) {
    const blob = new Blob([data], { type: tipoArchivo });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  loadAndDisplayGeoJSON(geoJSON: any): void {

    this.geoJSONDataSubject.next(geoJSON);
  }

  agregarCapaWMS(url: string, nombreCapa: string) {
    this.agregarNuevaCapaWMSSubject.next({ url, nombreCapa });
  }

  quitarCapaWMS(url: string, nombreCapa: string) {
    this.quitarCapaWMSSubject.next({ url, nombreCapa });
  }


}

