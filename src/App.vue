<script lang="ts">
  import Accordion from "./components/Accordion.vue";
  import AccordionItem from "./components/AccordionItem.vue";
  import CamposComunes from "./components/CamposComunes.vue";
  import axios, {isCancel, AxiosError} from 'axios';
  import md5 from 'md5'
  
  import {qrCodeF} from "./models/qrcodestyling_model";
  import { createReport } from 'https://unpkg.com/docx-templates/lib/browser.js';

  interface Certificado{
        areas: string;
        cliente: string;
        domicilio: string;
        dosis: string;
        fecha: string;
        folio: string;
        localidad: string;
        productos: Array<{producto: string, registro: string}>;
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
    data() {
      return {
        res:'',
        folioInicial: "" as string,
        listaCerts: "",
        dataCerts : [] as Array<Certificado>,
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
        productosSelected: []
      }
    },
    methods: {
      async creaDocumento(datos : any){
        const template = await fetch('/plantilla_certificado.docx').then(res => res.arrayBuffer());
        let data = await this.generateQR(datos.short_url).then((value) => value);
        console.log(data);
        data = data.split(';base64,')[1];

        const report = await createReport({
          template,
          data: datos,
          additionalJsContext: {
            qr: url => {
              return { width: 3, height: 3, data, extension: '.png' };
            },
          }
        });

        this.saveDataToFile(
          report,
          `CERTIFICADO ${datos.folio} ${datos.cliente.slice(0,50)}.docx`,
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        );

      },
      saveDataToFile(data, fileName, mimeType){
        const blob = new Blob([data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        this.downloadURL(url, fileName, mimeType);
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      },
      downloadURL(data, fileName){
        const a = document.createElement('a');
        a.href = data;
        a.download = fileName;
        document.body.appendChild(a);
        a.style = 'display: none';
        a.click();
        a.remove();
      },
      obtieneFolio(index : number) : string{
        let numero : number = parseInt(this.folioInicial.split('-')[0]);
        let anio : number = parseInt(this.folioInicial.split('-')[1]);
        this.dataCerts[index].folio = `${numero + index}-${anio}`;
        return `${numero + index}-${anio}`;
      },
      obtieneInfoCerts() {
        if(this.listaCerts === "") return;
        axios.get('https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbxX9BpWftZWtyXxOGsIW3PTVlpXLq1Xl4m9VpQxAjUolFlK3fxTqUSE38FdTwxx6aBw/exec', {
          params: {
            ids: `[${this.prepararBusqueda(this.listaCerts)}]`
          },
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': 'true',
            'Content-Type': 'application/json',
          },
        }).then(response => {
          console.log(response.data);
          this.dataCerts = response.data;
          for(let cert of this.dataCerts){
            cert['tipoTratamiento'] = "fumigacion" as string;
            cert.productos = [];
            cert['dosis'] = "" as string;
          }
      }).catch(e => {
          console.log(e);
        })
      },

      prepararBusqueda(listaCerts: string){
        listaCerts = listaCerts.replaceAll(" ","");

        let commaSep = listaCerts.split(",");

        let resultado: string[] = [];

        for(let range of commaSep){
          if(range.lastIndexOf("&") !== -1){
            let inicio : number = parseInt(range.split("&")[0].split("-")[0]);
            let fin : number = parseInt(range.split("&")[1].split("-")[0]);
            let anio : string = range.split("&")[1].split("-")[1];

            for(inicio; inicio <= fin; inicio++){
              resultado.push(`"${inicio+"-"+anio}"`);
            }
            continue;
          }
          resultado.push(`"${range}"`);
        }
        return resultado.toString();
      },

      actualizaCamposComunes(campos: {campos : Array<keyof Certificado>; valores: any}){
        console.log(campos);
        for(let certificado   of this.dataCerts){
          for(let campo of campos.campos){
            if(campo.toString() === 'productosSelected'){
              this.productosSelected = campos.valores['productosSelected'];
              continue;
            }
            certificado[campo] = campos.valores[campo];
          }
        }
      },

      async generaCertificados(){
        
        //return;
        let textoTratamientos : {fumigacion: string, desinfeccion: string} = {
          fumigacion: "TRATAMIENTO CORRECTIVO Y PREVENTIVO PARA PLAGAS RASTRERAS Y VOLADORAS. SE APLICÓ: " as string,
          desinfeccion: "TRATAMIENTO CORRECTIVO Y PREVENTIVO DE DESINFECCIÓN PARA BACTERIAS, VIRUS, ALGAS Y HONGOS. SE APLICÓ: " as string
        };
        
        let certificadosARegistrar : Array<any> = [];
        for(let cert of this.dataCerts){
          console.log(cert.dosis);
          let texto : string = textoTratamientos[cert.tipoTratamiento as keyof Object].toString();
          let dosises: Array<string> = [];

          if(cert.dosis.trim() === "")
            dosises = Array(cert.productos.length).fill('');
          else
            dosises = cert.dosis.split(",").map(x => `, ${x}ml/L`);
          
          
          for(let i in cert.productos){
            console.log(cert.productos);
            texto += `${cert.productos[i].producto}, ${cert.productos[i].registro}${dosises[i]}. `;
          }

          
          let timestamp = Date.now();
          let hash : String = md5(cert.folio + timestamp);

          const headers = {
            'Authorization': 'Bearer de88c0759fd25678a57979ae9fc2aa7165ed0614',
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
            'Access-Control-Allow-Credentials':true
          };
          const dataString = `{ "long_url": "https://extercontrol.github.io/wa/validador/index.html?hash=${hash}" }`;

          const requestOptions = {
            method: "POST",
            headers: headers,
            body: dataString
          };
          await fetch("https://api-ssl.bitly.com/v4/shorten", requestOptions)
            .then(response => response.json())
            .then(function(data){
              certificadosARegistrar.push([hash, cert.folio, cert.cliente, cert.domicilio, cert.localidad, cert.fecha, texto.toUpperCase(), cert.areas,timestamp,data.link]);
              console.log(data);
            });
        }
        console.log(JSON.stringify(certificadosARegistrar));
        
        axios.post('https://cors-anywhere.herokuapp.com/https://script.google.com/macros/s/AKfycbxwT4aWTalaghbJhxfi3GMBRjSJRjwFmgmDNOU1Nw0-jWH-aivh07kLPmwCaW5D6wOr/exec', {},{
          params: {
            data: JSON.stringify(certificadosARegistrar)
          },
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

        for(let cert of certificadosARegistrar){
          this.creaDocumento({ folio: cert[1], cliente: cert[2], domicilio: cert[3], localidad: cert[4], fecha: cert[5], tratamiento: cert[6], areas: cert[7], short_url: cert[9] });
        }
      },
      async generateQR(url : string){
        //let res : string = '';
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
          //reader.readAsText(inputFile);
        });
/*
            reader.onload = function () {
            // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
            this.res = reader.result.replace(/^data:.+;base64,/, '');
            //res = b64; //-> "V2VsY29tZSB0byA8Yj5iYXNlNjQuZ3VydTwvYj4h"
            console.log(`res1:${this.res}`);
          };
        qrCode.getRawData().then((value) => {
          reader.readAsDataURL(value);
        });
        console.log(`res2:${this.res}`);
        
        let dataf = await qrCode.getRawData().then((value) => reader.readAsDataURL(value).result);
        console.log(`dataf: ${dataf}`);

        const div = document.createElement('div');
        div.id = "temp-qr";
        document.body.appendChild(div);
        qrCode.append(div);*/
      }
    },
  };
</script>

<template>
  <img src="./assets/controlExter_logo.svg" alt="" id="logo">
  <h1>Certificados 0.1</h1>

  <fieldset id="buscador-fields">
    <label for="buscador">Generar a partir de: </label>
    <input type="text" placeholder="Usa / como rango y , como separador" id="buscador" name="buscador" v-model="listaCerts">
    <label for="folio_inicial">Folio inicial:: </label>
    <input type="text" placeholder="nnn-AAAA" id="folio_inicial" name="folio_inicial" v-model="folioInicial">
    <button type="submit" @click="obtieneInfoCerts"><span class="mdi mdi-magnify"></span> Buscar</button>
  </fieldset>
  <div>
    <Accordion>
    <CamposComunes 
      @camposSeleccionadosChanged="actualizaCamposComunes"
      :cliente="dataCamposComunes.cliente"
      :domicilio="dataCamposComunes.domicilio"
      :localidad="dataCamposComunes.localidad"
      :fecha="dataCamposComunes.fecha"
      :areas="dataCamposComunes.areas"
    > 
    </CamposComunes>
  </Accordion>
  </div>

  <div>
    <Accordion>
      <AccordionItem 
        v-for="(certificado, index) in dataCerts" 
        :folio="obtieneFolio(index)"
        @update:folio="certificado.folio = $event"
        :cliente="certificado.cliente"
        @update:cliente="certificado.cliente = $event"
        :domicilio="certificado.domicilio"
        @update:domicilio="certificado.domicilio = $event"
        :localidad="certificado.localidad"
        @update:localidad="certificado.localidad = $event"
        :fecha="certificado.fecha"
        @update:fecha="certificado.fecha = $event"
        :tipoTratamiento="certificado.tipoTratamiento"
        @update:tipoTratamiento="certificado.tipoTratamiento = $event"
        :productos="productosSelected"
        @update:productos="certificado.productos = $event"
        :dosis="certificado.dosis"
        @update:dosis="certificado.dosis = $event"
        :areas="certificado.areas"
        @update:areas="certificado.areas = $event"
        :indice="index"
        
      ></AccordionItem>
    </Accordion>
  </div>

  <button id="boton-generar" @click="generaCertificados" type="submit"><span class="mdi mdi-file-sign"></span>Generar</button>

</template>

<style>
label{padding-right: 5px;}

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

.active, .Accordion:hover {
  background-color: #ccc; 
}

.panel {
  padding: 0 18px;
  display: none;
  background-color: white;
  overflow: hidden;
}

#logo{width: 350px;}

@media (max-width:767px){
  #logo{width: 70%;}
  #buscador{width: 100%;}
  #boton-generar{width: 100%}
  button span{padding: 0 5px;}
  input[type="text"], select, textarea{width: 300px;}
  label{margin-bottom: 0;}
}
</style>
