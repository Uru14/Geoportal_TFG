import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageProvider {

  private STORAGE_KEY: string = "GeometryData";

  constructor() { }

  public getData(): any[] { //permite obtener los datos almacenados en el LocalStorage
    const dataString = localStorage.getItem(this.STORAGE_KEY);
    return dataString ? JSON.parse(dataString) : []; //si hay datos se parsea y se retorna un array, si no retorna un array vacío
  }

  public setData(data: any[]): void { // permite establecer los datos en el localStorage
    const dataString = JSON.stringify(data); //// Convierte el array de datos a una cadena JSON y lo almacena en el LocalStorage
    localStorage.setItem(this.STORAGE_KEY, dataString);
  }

  public clearData(): void { //permite borrar los datos del localStorage
    localStorage.removeItem(this.STORAGE_KEY);
  }


  public getGeometryDataById(geometryId: string): any { //obtiene los datos de geometría por ID
    const data = this.getData();
    return data.find((item: any) => item.id === geometryId); //busca y devuelve la geometría que coincide con el ID proporcionado
  }

}
