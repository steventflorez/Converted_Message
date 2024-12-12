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

  onFileChange(event: any, tipo:string): void {
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
      };
      reader.readAsArrayBuffer(file); // Usamos readAsArrayBuffer en vez de readAsBinaryString
    }
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
    saveAs(dataBlob, 'flows_Exportados.xlsx');
  }

  exportToExcel2(){
    const headers = new Set<string>();

    const filteredData = this.data.map((row: any) => {
      const contentObj = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
      const flowResponse = contentObj?.body|| {};

      let [fecha , hora] = row.messageDate.split('T');
      hora = hora.split('+')[0]

      const formattedRow: any = {
        messageId: row.messageId || "",
        telefono: row.contactId,
        fecha: fecha|| "",
        hora: hora || "",
        mensaje: ''
      };

      if (typeof flowResponse === 'string') {
        formattedRow.mensaje = flowResponse
      }
        return formattedRow;
    });

    const cleanFliterData = filteredData.filter((dato) => dato.mensaje != '');


    const worksheet = XLSX.utils.json_to_sheet(cleanFliterData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Exportar a Excel
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob: Blob = new Blob([excelBuffer], {
      type: this.EXCEL_TYPE
    });
    saveAs(dataBlob, 'fallback_Exportados.xlsx');

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
