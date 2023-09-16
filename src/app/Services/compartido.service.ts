import { Injectable } from '@angular/core';
import {BehaviorSubject, Subject} from "rxjs";
import * as jsonexport from 'jsonexport';
import {LocalStorageProvider} from "./LocalStorageService/LocalStorageProvider";


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
  public selectedPolygonId: string = '';
  public selectedGeometryType: string = '';
  public drawingPunto: boolean = false;
  public drawingDistancia: boolean = false;
  public drawingPunto$ = new BehaviorSubject<boolean>(this.drawingPunto);
  public drawingDistancia$ = new BehaviorSubject<boolean>(this.drawingDistancia);


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

  // seleccionar(polygonId: string) {
  //   console.log("seleccionar called");
  //   this.selecting = !this.selecting;
  //   this.drawing = false;
  //   this.drawingPunto$.next(false);
  //   this.drawingDistancia$.next(false);
  //   this.selecting$.next(this.selecting);
  //   this.drawing$.next(this.drawing);
  //   this.selectedPolygonId = polygonId; // Guarda el ID del polígono seleccionado
  // }
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

  // getSelectedPolygonId(): string {
  //   return this.selectedPolygonId;
  // }
  getSelectedGeometryType(): string {
    return this.selectedGeometryType;
  }

  private eliminarGeometriasSubject = new Subject<void>();

  eliminarGeometrias$ = this.eliminarGeometriasSubject.asObservable();

  triggerEliminarGeometrias() {
    this.eliminarGeometriasSubject.next();
  }


  descargar() {
    const localStorageProvider = new LocalStorageProvider();
    const geometrias = localStorageProvider.getData();


    jsonexport(geometrias, function (err: any, csv: string) {
      if (err) {
        console.error('Error al generar el archivo CSV:', err);
        return;
      }

      console.log('Contenido del archivo CSV:', csv); // Agregar esta línea

      const nombreArchivo = 'geometrias.csv';
      const link = document.createElement('a');
      link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
      link.setAttribute('download', nombreArchivo);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
}

