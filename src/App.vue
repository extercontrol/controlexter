<script lang="ts">
import { ref, onMounted } from 'vue';
import Accordion from "./components/Accordion.vue";
import AccordionItem from "./components/AccordionItem.vue";
import CamposComunes from "./components/CamposComunes.vue";
import axios, { isCancel, AxiosError } from 'axios';
import md5 from 'md5'

import { qrCodeF } from "./models/qrcodestyling_model";
// @ts-ignore
import { createReport } from 'https://unpkg.com/docx-templates/lib/browser.js';

const baseURL = ref('');

onMounted(() => {
  // Accessing base URL from import.meta
  baseURL.value = import.meta.env.BASE_URL;
});

interface Certificado {
  areas: string;
  cliente: string;
  domicilio: string;
  dosis: string;
  fecha: string;
  folio: string;
  localidad: string;
  productos: Array<{ producto: string, registro: string }>;
  productosSelected: Array<string>;
  tipoTratamiento: string;
  tratamiento: string;
};

export default {
  name: "App",
  components: {
    Accordion,
    AccordionItem,
    CamposComunes
  },
  mounted(){
    this.obtieneUltimoFolio();
  },
  data() {
    return {
      res: '',
      folioInicial: "" as string,
      listaCerts: "",
      dataCerts: [] as Array<Certificado>,
      dataCamposComunes: {
        cliente: "",
        domicilio: "",
        localidad: "",
        fecha: "",
        /*tipoTratamiento: "",
        productos: [],
        dosis: "",*/
        areas: "",
      },
      color: "red",
      isGeneratingCerts: false,
      loading: false,
    }
  },
  methods: {
    async creaDocumento(datos: any) {
      const template = await fetch(baseURL.value + 'plantilla_certificado.docx').then(res => res.arrayBuffer());
      let data = await this.generateQR(datos.short_url).then((value) => value);
      console.log(data);
      data = data.split(';base64,')[1];

      const report = await createReport({
        template,
        data: datos,
        additionalJsContext: {
          qr: (url: string) => {
            console.log(url);
            return { width: 3, height: 3, data, extension: '.png' };
          },
        }
      });

      this.saveDataToFile(
        report,
        `CERTIFICADO ${datos.folio} ${datos.cliente.slice(0, 50)}.docx`,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );

    },
    saveDataToFile(data: BlobPart, fileName: string, mimeType: string) {
      const blob = new Blob([data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      this.downloadURL(url, fileName);
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    },
    downloadURL(data: string, fileName: string) {
      let a = document.createElement('a');
      a.href = data;
      a.download = fileName;
      document.body.appendChild(a);
      a.setAttribute('style', 'display: none');
      //a.style = 'display: none';
      a.click();
      a.remove();
    },
    obtieneFolio(index: number): string {
      let numero: number = parseInt(this.folioInicial.split('-')[0]);
      let anio: number = parseInt(this.folioInicial.split('-')[1]);
      this.dataCerts[index].folio = `${String(numero + index).padStart(3, '0')}-${anio}`;
      return `${String(numero + index).padStart(3, '0')}-${anio}`;
    },
    obtieneInfoCerts() {
      if (this.listaCerts === "") return;
      //let getUrl = 'https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbxX9BpWftZWtyXxOGsIW3PTVlpXLq1Xl4m9VpQxAjUolFlK3fxTqUSE38FdTwxx6aBw/exec';
      let getUrl = 'https://certificados-old.onrender.com/appscript/getdata';
      //let getUrl = 'http://localhost:8080/appscript/getdata';
      let encodedData = JSON.stringify(this.prepararBusqueda(this.listaCerts));
      encodedData = encodeURIComponent(encodedData.replaceAll('\\"',''));
      const urlWithParams = getUrl + "?data=" + encodedData;
      console.log(urlWithParams);
      axios.get(urlWithParams, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
      }).then(response => {
        console.log(response.data);
        this.dataCerts = response.data;
        for (let cert of this.dataCerts) {
          cert['tipoTratamiento'] = "fumigacion" as string;
          cert.productos = [];
          cert.productosSelected = [];
          cert['dosis'] = "" as string;
        }
      }).catch(e => {
        console.log(e);
      })
    },

    prepararBusqueda(listaCerts: string) {
      listaCerts = listaCerts.replaceAll(" ", "");

      let commaSep = listaCerts.split(",");

      let resultado: string[] = [];

      for (let range of commaSep) {
        if (range.lastIndexOf("&") !== -1) {
          let inicio: number = parseInt(range.split("&")[0].split("-")[0]);
          let fin: number = parseInt(range.split("&")[1].split("-")[0]);
          let anio: string = range.split("&")[1].split("-")[1];

          for (inicio; inicio <= fin; inicio++) {
            resultado.push(`"${inicio + "-" + anio}"`);
          }
          continue;
        }
        resultado.push(`"${range}"`);
      }
      return resultado;
    },

    actualizaCamposComunes(campos: { campos: Array<keyof Certificado>; valores: any }) {
      if(campos.campos.includes('productos' )){
        campos.campos = campos.campos.concat(['tipoTratamiento','dosis','productosSelected']);
      }
      console.log(campos);
      for (let certificado of this.dataCerts) {
        for (let campo of campos.campos) {
          if (campo.toString() === 'productosSelected') {
            certificado.productosSelected = campos.valores['productosSelected'];
          }
          certificado[campo] = campos.valores[campo];
        }
      }
    },

    async generaCertificados() {
      //Disable button
      this.isGeneratingCerts = true;
      this.loading = true;

      let textoTratamientos: { fumigacion: string, desinfeccion: string } = {
        fumigacion: "TRATAMIENTO CORRECTIVO Y PREVENTIVO PARA PLAGAS RASTRERAS Y VOLADORAS. SE APLICÓ: " as string,
        desinfeccion: "TRATAMIENTO CORRECTIVO Y PREVENTIVO DE DESINFECCIÓN PARA BACTERIAS, VIRUS, ALGAS Y HONGOS. SE APLICÓ: " as string
      };

      let certificadosARegistrar: Array<any> = [];
      for (let cert of this.dataCerts) {
        console.log(cert.dosis);
        let texto: string = textoTratamientos[cert.tipoTratamiento as keyof Object].toString();
        let dosises: Array<string> = [];

        if (cert.dosis.trim() === "")
          dosises = Array(cert.productos.length).fill('');
        else
          dosises = cert.dosis.split(",").map(x => `, ${x}ml/L`);


        for (let i in cert.productos) {
          console.log(cert.productos);
          texto += `${cert.productos[i].producto}, ${cert.productos[i].registro}${dosises[i]}. `;
        }


        let timestamp = Date.now();
        let hash: String = md5(cert.folio + timestamp);

        const headers = {
          'Authorization': 'Bearer de88c0759fd25678a57979ae9fc2aa7165ed0614',
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
          'Access-Control-Allow-Credentials': true
        };
        const dataString = `{ "long_url": "https://extercontrol.github.io/wa/validador/index.html?hash=${hash}" }`;

        const requestOptions = {
          method: "POST",
          headers: headers,
          body: dataString
        } as unknown as RequestInit;
        
        await fetch("https://api-ssl.bitly.com/v4/shorten", requestOptions)
          .then(response => response.json())
          .then(function (data) {
            certificadosARegistrar.push([hash, cert.folio, cert.cliente, cert.domicilio, cert.localidad, cert.fecha, texto.toUpperCase(), cert.areas, timestamp, data.link]);
            console.log(data);
          });
          //certificadosARegistrar.push([hash, cert.folio, cert.cliente, cert.domicilio, cert.localidad, cert.fecha, texto.toUpperCase(), cert.areas, timestamp, "example.com"]);
      }
      console.log(JSON.stringify(certificadosARegistrar));

      //let postUrl = 'https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbxwT4aWTalaghbJhxfi3GMBRjSJRjwFmgmDNOU1Nw0-jWH-aivh07kLPmwCaW5D6wOr/exec';
      let postUrl = 'https://certificados-old.onrender.com/appscript/submitdata';
      //let postUrl = 'http://localhost:8080/appscript/submitdata';
      let encodedData = JSON.stringify(certificadosARegistrar);
      encodedData = encodeURIComponent(encodedData.replaceAll('\\"',''));
      const urlWithParams = postUrl + "?data=" + encodedData;
      console.log(urlWithParams);
      axios.post(urlWithParams, {}, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
      }).then(response => {
        console.log(response.data);
      }).catch(e => {
        console.log(e);
      })
      
      for (let cert of certificadosARegistrar) {
        this.creaDocumento({ folio: cert[1], cliente: cert[2], domicilio: cert[3], localidad: cert[4], fecha: cert[5], tratamiento: cert[6], areas: cert[7], short_url: cert[9] });
      }

      //Returns button to enabled
      this.isGeneratingCerts = false;
      this.loading = false;
    },
    async generateQR(url: string) {
      const qrCode = qrCodeF(url);

      const reader = new FileReader();
      const blobQr = await qrCode.getRawData().then((value) => value);

      return new Promise<string>((resolve, reject) => {
        reader.onerror = () => {
          reader.abort();
          reject(new DOMException("Problem parsing input file."));
        };

        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blobQr!);
      });
    },
    obtieneUltimoFolio() {
      let getUrl = 'https://certificados-old.onrender.com/appscript/getlast';
      //let getUrl = 'http://localhost:8080/appscript/getlast';
      axios.get(getUrl, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
          'Content-Type': 'application/json',
        },
      }).then(response => {
        console.log(response.data);
        const folioInicialArr = response.data["last_folio"].split("-");
        this.folioInicial = `${String(parseInt(folioInicialArr[0])+1).padStart(3, '0')}-${folioInicialArr[1]}`;
        this.color = "green";
      }).catch(e => {
        console.log(e);
      })
    },
  },
  computed: {
    spanStyle() {
      return {
        color: this.color,
        // Add more style properties as needed
      };
    },
  },
};
</script>

<template>
  <img src="./assets/controlExter_logo.svg" alt="" id="logo">
  <h1>Certificados 0.1 <span :style="spanStyle">⬤</span></h1>

  <fieldset id="buscador-fields">
    <label for="buscador">Generar a partir de: </label>
    <input type="text" placeholder="Usa / como rango y , como separador" id="buscador" name="buscador"
      v-model="listaCerts">
    <label for="folio_inicial">Folio inicial: </label>
    <input type="text" placeholder="nnn-AAAA" id="folio_inicial" name="folio_inicial" v-model="folioInicial">
    <button type="submit" @click="obtieneInfoCerts"><span class="mdi mdi-magnify"></span> Buscar</button>
  </fieldset>
  <div>
    <Accordion>
      <CamposComunes @camposSeleccionadosChanged="actualizaCamposComunes" :cliente="dataCamposComunes.cliente"
        :domicilio="dataCamposComunes.domicilio" :localidad="dataCamposComunes.localidad"
        :fecha="dataCamposComunes.fecha" :areas="dataCamposComunes.areas">
      </CamposComunes>
    </Accordion>
  </div>

  <div>
    <Accordion>
      <AccordionItem v-for="(certificado, index) in dataCerts" 
        :folio="obtieneFolio(index)" @update:folio="certificado.folio = $event" 
        :cliente="certificado.cliente" @update:cliente="certificado.cliente = $event" 
        :domicilio="certificado.domicilio" @update:domicilio="certificado.domicilio = $event" 
        :localidad="certificado.localidad" @update:localidad="certificado.localidad = $event" 
        :fecha="certificado.fecha" @update:fecha="certificado.fecha = $event" 
        :tipoTratamiento="certificado.tipoTratamiento" @change:tipoTratamiento="certificado.tipoTratamiento = $event" 
        :productos="certificado.productos" @update:productos="certificado.productos = $event" 
        :productosSelected="certificado.productosSelected" @change:productosSelected="certificado.productosSelected = $event" 
        :dosis="certificado.dosis" @update:dosis="certificado.dosis = $event" 
        :areas="certificado.areas" @update:areas="certificado.areas = $event"
        @productosSeleccionadosChanged="certificado.productos = $event"
        :indice="index">
      </AccordionItem>
    </Accordion>
  </div>

  <button id="boton-generar" @click="generaCertificados" type="submit" v-bind:disabled="isGeneratingCerts"><span
      class="mdi mdi-file-sign"></span>Generar</button>
  
  <!-- Loading popup -->
  <div v-if="loading" class="loading-popup">
        <div class="loading-content">
            <img src="./assets/bee.gif" alt="Loading">
            <p>Generando...</p>
        </div>
    </div>

</template>

<style>
label {
  padding-right: 5px;
}

.Accordion {
  background-color: #eee;
  color: #444;
  cursor: pointer;
  padding: 18px;
  width: 100%;
  border: none;
  text-align: left;
  outline: none;
  font-size: 15px;
  transition: 0.4s;
}

.active,
.Accordion:hover {
  background-color: #ccc;
}

.panel {
  padding: 0 18px;
  display: none;
  background-color: white;
  overflow: hidden;
}

#logo {
  width: 350px;
}

.loading-popup {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.7); /* Semi-transparent background */
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999; /* Ensure the loading popup is on top of other elements */
    }

    .loading-content {
        text-align: center;
        color: #005512;
        font-weight: 800;
    }

@media (max-width:767px) {
  #logo {
    width: 70%;
  }

  #buscador {
    width: 100%;
  }

  #boton-generar {
    width: 100%
  }

  button span {
    padding: 0 5px;
  }

  input[type="text"],
  select,
  textarea {
    width: 300px;
  }

  label {
    margin-bottom: 0;
  }
}
</style>
