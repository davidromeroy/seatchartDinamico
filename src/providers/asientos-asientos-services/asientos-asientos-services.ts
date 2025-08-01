import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

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
  private apiURL =
    "http://localhost:8080/wordpress/wp-json/delportal/v1/get_asientos";

  constructor(public http: HttpClient) {
    console.log("Provider listo: AsientosAsientosServicesProvider");
  }

  // Devuelve el objeto JSON parseado de mapa_de_asientos (del primer elemento válido)
  getMapaDeAsientos(): Promise<any> {
    return this.http
      .get<any[]>(this.apiURL)
      .toPromise()
      .then((data) => {
        const item = data.find((d) => d.mapa_de_asientos);
        if (
          item &&
          item.mapa_de_asientos &&
          typeof item.mapa_de_asientos === "string"
        ) {
          try {
            return JSON.parse(item.mapa_de_asientos);
          } catch (e) {
            console.error(
              "Error al parsear mapa_de_asientos:",
              e,
              item.mapa_de_asientos
            );
            return null;
          }
        }
        return null;
      });
  }

  // Devuelve el array de asientos (del primer elemento válido)
  getAsientos(): Promise<any[]> {
    return this.http
      .get<any[]>(this.apiURL)
      .toPromise()
      .then((data) => {
        const item = data.find((d) => d.asientos && Array.isArray(d.asientos));
        return item ? item.asientos : [];
      });
  }

  // Devuelve el objeto completo de la API (por si necesitas todo)
  getRawApiData(): Promise<any[]> {
    return this.http.get<any[]>(this.apiURL).toPromise();
  }
}
