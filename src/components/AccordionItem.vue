<template>
    <li class="accordion__item">
      <div 
        class="accordion__trigger"
        :class="{'accordion__trigger_active': visible}"
        @click="open">
  
        <h4>{{folio}}</h4>
        <slot name="accordion-trigger"></slot>
      </div>
  
      <transition 
        name="accordion"
        @enter="start"
        @after-enter="end"
        @before-leave="start"
        @after-leave="end">
  
        <div class="accordion__content"
          v-show="visible">
          <ul>
            <div class="named-field">
              <label :for="'nuevo-folio-'+folio">Nuevo folio: </label> <input type="text" :id="'nuevo-folio-' + folio" :value="folio" @input="(event) => $emit('update:folio', event.target.value)" >
            </div>
            <div class="named-field">
              <label for="cliente">Cliente: </label> <input type="text" :id="'cliente-'+ folio" :value="cliente" @input="(event) => $emit('update:cliente', event.target.value)">
            </div>
            <div class="named-field">
              <label for="domicilio">Domicilio: </label> <input type="text" :id="'domicilio-' + folio" :value="domicilio" @input="(event) => $emit('update:domicilio', event.target.value)">
            </div>
            <div class="named-field">
              <label for="localidad">Localidad: </label> <input type="text" :id="'localidad' + folio" :value="localidad" @input="(event) => $emit('update:localidad', event.target.value)">
            </div>
            <div class="named-field">
              <label for="fecha">Fecha: </label> <input type="text" :id="'fecha-' + folio" :value="fecha" @input="(event) => $emit('update:fecha', event.target.value)">
            </div>
            <div class="named-field">
              <label for="tipo_tratamiento">Tipo de tratamiento:</label>
              <select name="tipo_tratamiento" :id="'tipo_tratamiento-' + folio" v-model="innerTipoTratamiento" @change="(event) => $emit('change:tipoTratamiento', innerTipoTratamiento)">
                <option value="fumigacion">Fumigación</option>
                <option value="desinfeccion">Desinfección</option>
              </select>
            </div>
            <div class="named-field">
              <label for="productos">Productos: </label>
              <select name="productos" :id="'productos-' + folio" multiple="multiple" v-model="innerProductosSelected" @change="(event) => $emit('change:productosSelected', innerProductosSelected)">
                <option v-for="(value, key, index) in lista_productos[innerTipoTratamiento]" :value="key">{{value['producto']}}</option>
              </select>
            </div>
            <div class="named-field">
              <label for="dosis">Dosis: </label> <input type="text" :id="'dosis-' + folio" placeholder="Separadas por comas" inputmode="numeric" :value="dosis" @input="(event) => $emit('update:dosis', event.target.value)"><span>ml/L</span>
            </div>
            <div class="named-field">
              <label for="areas">Áreas: </label><textarea name="areas" :id="'areas-' + folio" cols="30" rows="2" :value="areas" @input="(event) => $emit('update:areas', event.target.value)"></textarea>
            </div>
            
            
            
            
                        
            
          </ul>
        </div>
      </transition>
    </li>
  </template>
  
  
  <script>
  export default { //v-model="productosSelected"
    props: {
      indice: {
        type: Number,
        required: true
      },
      folio: {
        type: String,
        default: "",
      },
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
      tipoTratamiento: {
        type: String,
        default: "fumigacion",
      },
      productos: {
        type: Array,
        default: [],
      },
      productosSelected: {
        type: Array,
        default: [],
      },
      dosis: {
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
        index: null,
        innerTipoTratamiento: this.tipoTratamiento,
        innerProductosSelected: this.productosSelected,
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
            "11": {producto: 'Deltametrina (K Obiol)', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-INAC-0119-004-009-003'},
            "12": {producto: 'Lambda Cyhalotrina + Tiametoxam', registro: 'REGISTRO COFEPRIS DE PRODUCTO: RSCO-URB-MEZC-1101D-X0006-085-15.10'},
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
        return this.index == this.Accordion.active;
      }
    },
    methods: {
      open() {
        if (this.visible) {
          this.Accordion.active = null;
        } else {
          this.Accordion.active = this.index;
        }
      },
      start(el) {
        el.style.height = el.scrollHeight + "px";
      },
      end(el) {
        el.style.height = "";
      },
    },
    created() {
      this.index = this.Accordion.count++;
    },
    watch: {
      tipoTratamiento: function(newVal){this.innerTipoTratamiento = newVal},
      productosSelected: function(newVal){
        this.innerProductosSelected = newVal;
        console.log(this.innerProductosSelected, this.tipoTratamiento);
        this.$emit('productosSeleccionadosChanged', this.innerProductosSelected.map(x => this.lista_productos[this.tipoTratamiento][x]));
      },
    }
  };
  </script>
  
  <style lang="css" scoped>

  .accordion__item {
    cursor: pointer;
    padding: 10px;
    padding-bottom: 1px;
    margin-bottom: 9px;
    border-bottom: 1px solid #ebebeb;
    position: relative;
  }
  
  .accordion__trigger {
    display: flex;
    justify-content: space-between;
  }
  
  .accordion-enter-active,
  .accordion-leave-active {
    will-change: height, opacity;
    transition: height 0.3s ease, opacity 0.3s ease;
    overflow: hidden;
  }
  
  .accordion-enter,
  .accordion-leave-to {
    height: 0 !important;
    opacity: 0;
  }
  
  @media (prefers-color-scheme: dark) {
    h4{color:white}
  }
  </style>
  
