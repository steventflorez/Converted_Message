import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  private readonly EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';


  headerModel:  Record<string, any> = {};

  btnShow: boolean = false;
  messageAlert: boolean = false;
  data: any[] = [];

  onFileChange(event: any): void {
    this.btnShow = false;
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        const data = new Uint8Array(arrayBuffer);
        const arr = Array.from(data).map(byte => String.fromCharCode(byte)).join('');
        const workbook = XLSX.read(arr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        this.data = XLSX.utils.sheet_to_json(worksheet);

        console.log(this.data);
        this.createHeader()// Muestra el JSON cargado
      };
      reader.readAsArrayBuffer(file); // Usamos readAsArrayBuffer en vez de readAsBinaryString
    }
  }

  createHeader() {
    this.data.forEach(dato => {
      try {
        // Intenta convertir el contenido a JSON
        const contentObj = typeof dato.content === 'string' ? JSON.parse(dato.content) : dato.content;

        // Accede a eventParameters
        if (contentObj?.eventParameters) {
          let flowResponse = contentObj.eventParameters.flowResponse;

          for (let key in flowResponse) {
            if (Array.isArray(flowResponse[key])) {
              if (!this.headerModel[key]) {
                this.headerModel[key] = [];
              }
              flowResponse[key].forEach((item: string) => {
                if (!this.headerModel[key].includes(item)) {
                  this.headerModel[key].push(item);
                }
              });
            } else {
              this.headerModel[key] = this.headerModel[key] || "";
            }
          }
          this.messageAlert = false
          this.btnShow = true
        } else {
          this.messageAlert = true
          console.log('eventParameters no encontrados');
        }
      } catch (error) {
        this.messageAlert = true
        console.error('Error al parsear JSON:', error);
      }
    });
  }

  exportToExcel(): void {
    const headers = new Set<string>();

    // Generar los encabezados dinámicos
    this.data.forEach((row: any) => {
      const contentObj = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
      const flowResponse = contentObj?.eventParameters?.flowResponse || {};

      for (const key in flowResponse) {
        headers.add(key);
        if (Array.isArray(flowResponse[key])) {
          flowResponse[key].forEach((item: string) => headers.add(`${key} | ${item}`));
        }
      }
    });

    // Convertir los encabezados a un array ordenado
    const orderedHeaders = Array.from(headers).sort();

    // Construir los datos para el Excel
    const filteredData = this.data.map((row: any) => {
      const contentObj = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
      const flowResponse = contentObj?.eventParameters?.flowResponse || {};

      let [fecha , hora] = row.messageDate.split('T');
      hora = hora.split('+')[0]
      console.log(row)
      const formattedRow: any = {
        messageId: row.messageId || "",
        telefono: row.contactId,
        fecha: fecha|| "",
        hora: hora || "",
      };

      orderedHeaders.forEach((header) => {
        let headerCodif = this.corregirCodificacion(header)
        const [baseKey, arrayItem] = headerCodif.split(" | ");
        if (arrayItem) {
          formattedRow[arrayItem] = Array.isArray(flowResponse[baseKey]) && flowResponse[baseKey].includes(arrayItem) ? "X" : "";
        } else {
          formattedRow[baseKey] = this.corregirCodificacion(flowResponse[headerCodif]) || "";
        }
      });

      return formattedRow;
    });



    // Crear la hoja de Excel
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Exportar a Excel
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob: Blob = new Blob([excelBuffer], {
      type: this.EXCEL_TYPE
    });
    saveAs(dataBlob, 'Datos_Exportados.xlsx');
  }

   corregirCodificacion(texto:string) {
    // Convertir la cadena mal codificada a un Uint8Array y luego decodificarla correctamente
    let encoder = new TextEncoder();
    let decoder = new TextDecoder("utf-8");

    // Simular el problema de codificación, pasando por bytes mal interpretados
    let bytes = encoder.encode(texto);
    return decoder.decode(bytes);
  }


  goToUrl(url: string): void {
    window.open(url, '_blank');
  }
}
