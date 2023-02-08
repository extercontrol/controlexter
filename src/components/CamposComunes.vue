<template>
    <li class="camposcomunes__item">
      <div 
        class="camposcomunes__trigger"
        :class="{'camposcomunes__trigger_active': visible}"
        @click="open">
  
        <h4>Campos Comunes</h4>
      </div>
  
      <transition 
        name="camposcomunes"
        @enter="start"
        @after-enter="end"
        @before-leave="start"
        @after-leave="end">
  
        <div class="camposcomunes__content"
          v-show="visible">
          <ul>
            <label for="cliente"><input type="checkbox" id="cliente" value="cliente" v-model="camposSeleccionados">Cliente: </label> <input type="text" id="cliente" v-model="valoresCampos.cliente"><br>
            <label for="domicilio"><input type="checkbox" id="domicilio" value="domicilio" v-model="camposSeleccionados">Domicilio: </label> <input type="text" id="domicilio" v-model="valoresCampos.domicilio"><br>
            <label for="localidad"><input type="checkbox" id="localidad" value="localidad" v-model="camposSeleccionados">Localidad: </label> <input type="text" id="localidad" v-model="valoresCampos.localidad"><br>
            <label for="fecha"><input type="checkbox" id="fecha" value="fecha" v-model="camposSeleccionados">Fecha: </label> <input type="text" id="fecha" v-model="valoresCampos.fecha"><br>
            <label for="tipo_tratamiento"><input type="checkbox" id="productos" value="productos" v-model="camposSeleccionados">Tipo de tratamiento:</label>
            <select name="tipo_tratamiento" id="tipo_tratamiento" v-model="valoresCampos.tipoTratamiento">
              <option value="fumigacion">Fumigación</option>
              <option value="desinfeccion">Desinfección</option>
            </select><br>
            <label for="productos">Productos: </label><br>
            <select name="productos" id="productos" multiple="true" v-model="valoresCampos.productosSelected">
              <option v-for="(value, key, index) in lista_productos[valoresCampos.tipoTratamiento as keyof typeof lista_productos]" :value="key">{{value['producto']}}</option>
            </select>
            <br>
            <label for="dosis">Dosis: </label> <input type="text" id="dosis" placeholder="Separadas por comas" inputmode="numeric" v-model="valoresCampos.dosis"><span>ml/L</span><br>
            <label for="areas"><input type="checkbox" id="areas" value="areas" v-model="camposSeleccionados">Áreas: </label><br><textarea name="areas" id="areas" cols="30" rows="2" v-model="valoresCampos.areas"></textarea>
          </ul>
        </div>
      </transition>
    </li>
  </template>
  
  
  <script lang="ts">
  import { defineComponent } from 'vue'
  export default ({
    props: {
      cliente: {
        type: String,
        default: "",
      },
      domicilio: {
        type: String,
        default: "",
      },
      localidad: {
        type: String,
        default: "",
      },
      fecha: {
        type: String,
        default: "",
      },
      tipo_tratamiento: {
        type: String,
        default: "fumigacion",
      },
      productos: {
        type: String,
        default: "",
      },
      areas: {
        type: String,
        default: "",
      },
    },
    inject: ["Accordion"],
    data() {
      return {
        index: 0,
        camposSeleccionados: [],
        valoresCampos:{
            cliente: "",
            domicilio: "",
            localidad: "",
            fecha: "",
            areas: "",
            productos: [] as Array<any>,
            productosSelected: [],
            tipoTratamiento: "",
            dosis: "",
        },
        lista_productos : {
          fumigacion : {
            "0": {producto: 'Tiametoxam', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-INAC-102U-315-064-21'},
            "1": {producto: 'Alfacipermetrina + Flufenoxuron', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-MEZC-1102-0435-64-5.88'},
            "2": {producto: 'Cipermetrina + Butóxido de Piperonilo', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-INAC-111-370-009-20'},
            "3": {producto: 'Fipronil', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-INAC-0101A-X0025-009-003'},
            "4": {producto: 'Piretrina natural', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-INAC-185-315-304-0.38'},
            "7": {producto: 'Clorpirifos Etil', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-INAC-115-353-009-26.24'},
            "8": {producto: 'Difetialona De Uso Urbano', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-RODE-516-00-07-0.0025'},
            "9": {producto: 'Deltametrina', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-INAC-119-313-008-2.5'},
            "10": {producto: 'Cipermetrina + Imidacloprid', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-MEZC-INAC-1155-X0011-425-27.66'},
          },
          desinfeccion : {
            "5": {producto: 'Pharmagreen (Didecil Dimetil Cloruro De Amonio)', registro: 'REGISTRO NSF No. 155195'},
            "6": {producto: 'Timsen (N-Cloruro De Alquildimetilbencilamonio y N-Cloruro De Alquildimetiletilbencilamonio)', registro: 'REGISTRO S.S.A.  AGOSTO 2014, REGISTRO CAS NO. N-CLORURO DE ALQUILDIMETILBENCILAMONIO (68391-01-5/53516-76-0= Y N-CLORURO DE ALQUILDIMETILETILBENCILAMONIO (68956-79-6/85409-23-0), REGISTRO FDA 880.6890, REGISTRO PCP 2125M P40 26058'}
          }
        }
      };
    },
    computed: {
      visible() {
        return this.index == (this.Accordion as any).active;
      }
    },
    mounted() {
      this.valoresCampos.tipoTratamiento = (' ' + this.tipo_tratamiento).slice(1);
      this.valoresCampos.fecha = this.getDates();
    },
    methods: {
      open() {
        if (this.visible) {
          (this.Accordion as any).active = null;
        } else {
          (this.Accordion as any).active = this.index;
        }
      },
      start(el: any) {
        el.style.height = el.scrollHeight + "px";
      },
      end(el: any) {
        el.style.height = "";
      },
      getDates(){
        let rangoFechas = "";
        let d = new Date();
        let dia = d.getDate();
        let mes = d.getMonth()+1;
        let anio = d.getFullYear();
        rangoFechas += `${dia < 10 ? "0"+dia : dia}-${mes < 10 ? "0"+mes : mes}-${anio}`;

        d.setMonth(d.getMonth() + 1);

        dia = d.getDate();
        mes = d.getMonth()+1;
        anio = d.getFullYear();
        rangoFechas += ` AL ${dia < 10 ? "0"+dia : dia}-${mes < 10 ? "0"+mes : mes}-${anio}`;

        console.log(rangoFechas);
        return rangoFechas;
      }
    },
    created() {
      this.index = (this.Accordion as any).count++;
    },
    watch: {
        camposSeleccionados: function () {
          // @ts-ignore
          this.valoresCampos.productos = this.valoresCampos.productosSelected.map(x => this.lista_productos[this.valoresCampos.tipoTratamiento][x]);
          this.$emit('camposSeleccionadosChanged', {campos : this.camposSeleccionados, valores: this.valoresCampos});
        }
    }
  });
  </script>
  
  <style lang="css" scoped>
  .camposcomunes__item {
    cursor: pointer;
    padding: 10px;
    border-bottom: 1px solid #ebebeb;
    position: relative;
  }

  .camposcomunes__content{background: #f1f1f1;}
  
  .camposcomunes__trigger {
    display: flex;
    justify-content: space-between;
    background: #44a04726;
    border-radius: 10px;
    padding-left: 10px;
  }
  
  .camposcomunes-enter-active,
  .camposcomunes-leave-active {
    will-change: height, opacity;
    transition: height 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
  }
  
  .camposcomunes-enter,
  .camposcomunes-leave-to {
    height: 0 !important;
    opacity: 0;
  }
  </style>
  