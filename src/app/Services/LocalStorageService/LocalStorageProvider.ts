import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageProvider {

  private STORAGE_KEY: string = "GeometryData";

  constructor() { }

  public getData(): any[] {
    const dataString = localStorage.getItem(this.STORAGE_KEY);
    return dataString ? JSON.parse(dataString) : [];
  }

  public setData(data: any[]): void {
    const dataString = JSON.stringify(data);
    localStorage.setItem(this.STORAGE_KEY, dataString);
  }

  public clearData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // public getPolygonDataById(polygonId: string): any {
  //   const data = this.getData();
  //   return data.find((item: any) => item.id === polygonId);
  // }

  public getGeometryDataById(geometryId: string): any {
    const data = this.getData();
    return data.find((item: any) => item.id === geometryId);
  }

}
