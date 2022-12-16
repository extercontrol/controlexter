<script lang="ts">
  import Accordion from "./components/Accordion.vue";
  import AccordionItem from "./components/AccordionItem.vue";
  import CamposComunes from "./components/CamposComunes.vue";
  import axios, {isCancel, AxiosError} from 'axios';
  import md5 from 'md5'
  
  import QRCodeStyling from "qr-code-styling";
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
       
        await this.generateQR(datos.short_url);
        let data = "";

          let obj = this;
          setTimeout(async function(){
            let canvas = document.getElementById('temp-qr').children[0];
            data = canvas.toDataURL().split(';base64,')[1];
            console.log(data);
            const report = await createReport({
              template,
              data: datos,
              additionalJsContext: {
                qr: url => {
                  
                  return { width: 3, height: 3, data, extension: '.png' };
                },
              }
            });

            obj.saveDataToFile(
              report,
              `CERTIFICADO ${datos.folio} ${datos.cliente.slice(0,50)}`,
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            );
            document.getElementById('temp-qr').remove();
          }, 1000);
            

        

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
        const qrCode = new QRCodeStyling({"width":300,"height":300,"data":url,"margin":0,"qrOptions":{"typeNumber":"0","mode":"Byte","errorCorrectionLevel":"Q"},"imageOptions":{"hideBackgroundDots":true,"imageSize":0.4,"margin":0, "saveAsBlob": true},"dotsOptions":{"type":"square","color":"#000000","gradient":null},"backgroundOptions":{"color":"#ffffff"},"image":"data:image/png;base64,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","dotsOptionsHelper":{"colorType":{"single":true,"gradient":false},"gradient":{"linear":true,"radial":false,"color1":"#6a1a4c","color2":"#6a1a4c","rotation":"0"}},"cornersSquareOptions":{"type":"square","color":"#000000"},"cornersSquareOptionsHelper":{"colorType":{"single":true,"gradient":false},"gradient":{"linear":true,"radial":false,"color1":"#000000","color2":"#000000","rotation":"0"}},"cornersDotOptions":{"type":"square","color":"#000000"},"cornersDotOptionsHelper":{"colorType":{"single":true,"gradient":false},"gradient":{"linear":true,"radial":false,"color1":"#000000","color2":"#000000","rotation":"0"}},"backgroundOptionsHelper":{"colorType":{"single":true,"gradient":false},"gradient":{"linear":true,"radial":false,"color1":"#ffffff","color2":"#ffffff","rotation":"0"}}});
        console.log(`res2.1:${qrCode}`);
        /*qrCode.download({ name: "qr", extension: "svg" });
        const reader = new FileReader();
            reader.onload = function () {
            // Since it contains the Data URI, we should remove the prefix and keep only Base64 string
            this.res = reader.result.replace(/^data:.+;base64,/, '');
            //res = b64; //-> "V2VsY29tZSB0byA8Yj5iYXNlNjQuZ3VydTwvYj4h"
            console.log(`res1:${this.res}`);
          };
        qrCode.getRawData().then((value) => {
          reader.readAsDataURL(value);
        });
        console.log(`res2:${this.res}`);*/
        
        /*const reader = new FileReader();
        let dataf = await qrCode.getRawData().then((value) => reader.readAsDataURL(value).result);
        console.log(`dataf: ${dataf}`);*/

        const div = document.createElement('div');
        div.id = "temp-qr";
        document.body.appendChild(div);
        qrCode.append(div);
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
