import { Component, ElementRef, ViewChild } from '@angular/core';
import { Platform, NavController, NavParams } from 'ionic-angular';
import { AlertController } from 'ionic-angular';
import { HttpClient } from '@angular/common/http';

// import { IonicPage, NavController, NavParams } from 'ionic-angular';

// import { AsientosAsientosServicesProvider, FilaMap } from '../../providers/asientos-asientos-services/asientos-asientos-services';


declare var require: any;
const Seatchart = require('seatchart');


// @IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  private sc: any;
  private datos: any;
  zoomLevel: number;

  // filasMap: FilaMap = {};
  isMapaCargado: boolean = false;

  @ViewChild('seatContainer') seatContainer: ElementRef;
  constructor(
    // private asientosProvider: AsientosAsientosServicesProvider
    public http: HttpClient,
    public navCtrl: NavController,
    public navParams: NavParams,
    public alertCtrl: AlertController,
    private platform: Platform
  ) {}

  async cargarJSON(): Promise<void> {
    try {
      const res = await this.http.get('assets/teatro.json').toPromise();
      this.datos = res;
      console.log('✅ Datos cargados:', this.datos);
      this.validateJson(this.datos);
    } catch (err) {
      console.error('❌ Error al cargar JSON', err);
    }
  }

  async ionViewDidLoad() {
    await this.cargarJSON(); // 👈 Esperamos a que se cargue antes de continuar

    if (this.datos.selectedColor) {
      this.applySelectedSeatColor(this.datos.selectedColor);
    }

    this.platform.ready().then(() => {
      const container = this.seatContainer.nativeElement;

      // Construye dinámicamente el seatTypes
      const seatTypes = this.buildSeatTypesFromJson(this.datos);
      // Ahora crea las opciones dinámicamente
      const options = {
        map: {
          rows: this.datos.rows,
          columns: this.datos.cols,
          seatTypes: seatTypes,
          reservedSeats: [],
          disabledSeats: [],
          indexerColumns: { visible: false },
          indexerRows: { visible: false },
          frontVisible: false
        },
        cart: { currency: '$', submitLabel: 'Reservar' },
        legendVisible: true
      };

      // Inicializa el seatchart con las opciones construidas
      this.sc = new Seatchart(container, options);

      // 1. Inserta el escenario (STAGE)
      // this.insertStage(container);
      
      // 2. Reubica el carrito flotante
      this.relocateCart(container, this.sc);

      // // 3. Configura el evento de carrito
      // this.setupCartListener(this.sc);

      // // 4. Configura la lógica de submit
      // this.setupSubmitHandler(this.sc);
    })
  }

  applySelectedSeatColor(color: string) {
    const styleTag = document.createElement('style');
    styleTag.type = 'text/css';
    styleTag.innerHTML = `
      .sc-seat.sc-seat-selected {
        background-color: ${color} !important;
        color: white !important;
      }
    `;
    document.head.appendChild(styleTag);
  }


  validateJson(data) {
    if (!data.rows || !data.cols || !data.types || !Array.isArray(data.seats)) {
      throw new Error('Formato JSON inválido');
    }

    for (const seat of data.seats) {
      if (
        typeof seat.row !== 'number' || 
        typeof seat.col !== 'number' || 
        typeof seat.type !== 'string' ||
        !(seat.type in data.types)
      ) {
        throw new Error(`Asiento inválido: ${JSON.stringify(seat)}`);
      }
    }
  }

  buildSeatTypesFromJson(json) {
    const seatTypes = {};

    // 1. Default obligatorio
    seatTypes['default'] = {
      label: 'Libre',
      price: 0,
      cssClass: 'default-seat',
      seats: [] // Seatchart lo requiere aunque esté vacío
    };
    // TODO: hacer para que el min-width: 14px sea mas dinamico, que se indique del Editor Visual
    // TODO: Considerar los indices del teatro para ajustar ese json, Pensar si se agregan o se quitan los indices porque se deben poner desde el Editor 
    const cssRules: string[] = [`
      .default-seat {
        background-color: transparent !important;
        color: transparent !important;
        pointer-events: none !important;
        cursor: default;
        min-width: 14px !important;
        width: 14px !important; 
      }
      .disabled {
        background-color: #ccc !important;
        color: transparent !important;
        pointer-events: none !important;
        cursor: default;
      }
    `];

      // 👉 Inyectamos el color de selección dinámico si existe en el JSON
    if (json.selectedColor && /^#([0-9A-F]{3}){1,2}$/i.test(json.selectedColor)) {
      cssRules.push(`
        .sc-seat.sc-seat-selected {
          background-color: ${json.selectedColor} !important;
          color: white !important;
        }
      `);
    }
    
    let typeIndex = 0;

    for (const typeName in json.types) {
      if (!json.types.hasOwnProperty(typeName)) continue;

      const color = json.types[typeName];
      const className = `type_${typeIndex++}`;

      const seats = json.seats
        .filter(seat => seat.type === typeName)
        .map(seat => ({
          row: seat.row,
          col: seat.col
        }));

      seatTypes[className] = {
        label: typeName,
        price: 10,
        cssClass: className,
        seats: seats
      };

      cssRules.push(`
        .${className} {
          background-color: ${color} !important;
          color: white !important;
        }
      `);
    }

    this.injectDynamicStyles(cssRules);
    return seatTypes;
  }

  injectDynamicStyles(rules: string[]) {
    const styleTag = document.createElement('style');
    styleTag.type = 'text/css';
    styleTag.innerHTML = rules.join('\n');
    document.head.appendChild(styleTag);
  }
  
  private insertStage(container: HTMLElement) {
    const outer = container.querySelector('.sc-map');
    if (!outer) return;
    const mapContainer = outer.querySelector('.sc-map-inner-container');
    if (!mapContainer) return;

    const stageDiv = document.createElement('div');
    stageDiv.className = 'stage';
    stageDiv.textContent = 'Escenario';
    mapContainer.appendChild(stageDiv);
  }

  private relocateCart(container: HTMLElement, sc: any) {
    // Espera a que todo el DOM se haya renderizado por Seatchart
    requestAnimationFrame(() => {
      const cartContainer = document.getElementById('floatingCart');
      if (!cartContainer) return;

      const originalHeader = container.querySelector('.sc-cart-header');
      const originalFooter = container.querySelector('.sc-cart-footer');
      const originalContainer = container.querySelector('.sc-right-container');

      // Si no existe el header o el footer, no sigas (evita errores)
      if (!originalHeader || !originalFooter) return;

      // Remueve headers/footers anteriores del carrito flotante si existen
      const existingHeader = cartContainer.querySelector('.sc-cart-header');
      const existingFooter = cartContainer.querySelector('.sc-cart-footer');
      if (existingHeader) existingHeader.remove();
      if (existingFooter) existingFooter.remove();

      // Agrega el header y footer al contenedor flotante
      cartContainer.appendChild(originalHeader);
      cartContainer.appendChild(originalFooter);

      // Remueve cualquier contador anterior
      const existingCount = cartContainer.querySelector('.cart-count');
      if (existingCount) existingCount.remove();

      // Crea el contador de tickets
      const countP = document.createElement('p');
      countP.classList.add('cart-count');
      countP.textContent = `${sc.getCart().length} tickets`;

      // Intenta insertarlo al principio del header, si existe
      if (originalHeader.firstChild) {
        originalHeader.insertBefore(countP, originalHeader.firstChild);
      } else {
        originalHeader.appendChild(countP);
      }

      // Elimina el contenedor derecho original si existe
      if (originalContainer) originalContainer.remove();

      // Opcional: aplica zoom si lo necesitas
      this.zoomLevel = this.zoomLevel || 1.0;
      // this.initializeZoomToFit();
      // this.pinchToZoom();
    });
  }

  // private setupCartListener(sc: any) {
  //   let reconstruyendoCart = false;

  //   sc.addEventListener('cartchange', () => {
  //     const cart = sc.getCart();

      

  //     // let saldoTemp = this.initialUserAmount;
  //     const detallesInvalidos: string[] = [];
  //     const asientosValidos: any[] = [];

  //     for (const item of cart) {
  //       const row = item.index.row;
  //       const col = item.index.col;
  //     }

  //     if (detallesInvalidos.length > 0) {
  //       const alertaError = this.alertCtrl.create({
  //         title: 'Puntos insuficientes',
  //         message: `Se han removido los asientos sin saldo suficiente:\n${detallesInvalidos.join('\n')}`,
  //         buttons: [{ text: 'Aceptar' }]
  //       });
  //       alertaError.present();

  //       // 🔐 Indicamos que estamos en proceso de reconstrucción visual
  //       reconstruyendoCart = true;

  //       // ✅ Limpiar y seleccionar solo válidos sin disparar stopTimer()
  //       sc.clearCart();
  //       (this.options.map as any).selectedSeats = asientosValidos.map(a => a.index);
  //       this.refreshMap();

  //       // ✅ Esperamos al siguiente frame y restablecemos la bandera
  //       requestAnimationFrame(() => {
  //         reconstruyendoCart = false;
  //       });
  //     }

  //     // Actualiza carrito
  //     this.cart = asientosValidos.map(item => ({
  //       row: item.index.row,
  //       col: item.index.col
  //     }));

  //     this.onSeatChange(this.cart);

  //     // Actualiza visual del contador
  //     requestAnimationFrame(() => {
  //       const labels = this.cart
  //         .map(seat => this.seatLabelSeatsFromLayout({ row: seat.row, col: seat.col }))
  //         .join(', ');
  //       const countP = document.querySelector('.cart-count');
  //       if (countP) countP.textContent = `${this.cart.length} tickets:\n${labels}`;
  //     });

  //     this.actualizarEstadoUsuario();
  //   });
  // }

}
