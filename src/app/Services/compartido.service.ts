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

  constructor() { }

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
  }

  seleccionar(polygonId: string) {
    console.log("seleccionar called");
    this.selecting = !this.selecting;
    this.drawing = false;
    this.selecting$.next(this.selecting);
    this.drawing$.next(this.drawing);
    this.selectedPolygonId = polygonId; // Guarda el ID del polígono seleccionado
  }
  getSelectedPolygonId(): string {
    return this.selectedPolygonId;
  }

  descargar(){
    const localStorageProvider = new LocalStorageProvider();
    const geometrias = localStorageProvider.getData();

    jsonexport(geometrias, function (err: any, csv: string) {
      if (err) {
        console.error('Error al generar el archivo CSV:', err);
        return;
      }

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

  private eliminarGeometriasSubject = new Subject<void>();

  eliminarGeometrias$ = this.eliminarGeometriasSubject.asObservable();

  triggerEliminarGeometrias() {
    this.eliminarGeometriasSubject.next();
  }
}
