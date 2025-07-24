import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface Asiento {
  numero: string;
  tipo: string;
  estado: string;
  color: string;
  puntos: string;
}

export interface FilaMap {
  [nombreFila: string]: Asiento[];
}

@Injectable()
export class AsientosAsientosServicesProvider {
  private apiURL = 'http://localhost/capacitacionliris/wp-json/delportal/v1/get_nuevo';

  constructor(public http: HttpClient) {
    console.log('Provider listo: AsientosAsientosServicesProvider');
  }

    getMapaAsientos(): Promise<FilaMap> {
      return this.http.get<any[]>(this.apiURL).toPromise().then(data => {
        const plateas = (data[0] && data[0].plateas) ? data[0].plateas : [];
        return this.normalizarDatos(plateas);
      });
    }

  private normalizarDatos(plateas: any[]): FilaMap {
    const filasMap: FilaMap = {};

    plateas
      .filter(p => p.nombre && p.filas.some(f => f.asientos))
      .forEach(platea => {
        platea.filas.forEach(fila => {
          if (!fila.asientos) return;

          if (!filasMap[fila.nombre]) {
            filasMap[fila.nombre] = [];
          }

          fila.asientos.forEach(asiento => {
            filasMap[fila.nombre].push({
              numero: asiento.numero,
              tipo: asiento.tipo,
              estado: asiento.estado,
              color: platea.color,
              puntos: platea.puntos
            });
          });
        });
      });

    return filasMap;
  }
}
