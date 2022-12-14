  import Vue from 'vue'

  // 2. Especifique un archivo con los tipos que desea aumentar
  //    Vue tiene el tipo de constructor en types / vue.d.ts
  declare module 'vue/types/vue' {
  // 3. Declare augmentacion para Vue
  interface Certificado{
    areas: string;
    cliente: string;
    domicilio: string;
    dosis: string;
    fecha: string;
    folio: string;
    localidad: string;
    productos: Array<string>;
    tipoTratamiento: string;
    tratamiento: string;
  }
  }