import { Component, OnInit } from '@angular/core';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import * as iconv from 'iconv-lite';
import { Buffer } from 'buffer';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent {

  private readonly EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';


  headerModel: Record<string, any> = {};

  btnShow: boolean = false;
  messageAlert: boolean = false;
  data: any[] = [];

  onFileChange(event: any, tipo: string): void {
    this.btnShow = false;
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const arrayBuffer = e.target.result;
        // Usamos TextDecoder para decodificar el contenido del archivo correctamente en UTF-8
        const decoder = new TextDecoder("utf-8", { fatal: true });
        const textContent = decoder.decode(arrayBuffer);

        // Leer el contenido como JSON después de la decodificación
        const workbook = XLSX.read(textContent, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        this.data = XLSX.utils.sheet_to_json(worksheet);
      };
      reader.readAsArrayBuffer(file);
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

      let [fecha, hora] = row.messageDate.split('T');
      hora = hora.split('+')[0];
      const formattedRow: any = {
        messageId: row.messageId || "",
        telefono: row.contactId,
        fecha: fecha || "",
        hora: hora || "",
      };

      orderedHeaders.forEach((header) => {
        const decodedHeader = this.corregirCodificacion(header);  // Decodificamos solo si es necesario
        const [baseKey, arrayItem] = decodedHeader.split(" | ");
        if (arrayItem) {
          formattedRow[arrayItem] = Array.isArray(flowResponse[baseKey]) && flowResponse[baseKey].includes(arrayItem) ? "X" : "";
        } else {
          const value = flowResponse[baseKey] ? this.corregirCodificacion(flowResponse[baseKey]) : "";  // Decodificamos si es necesario
          formattedRow[baseKey] = value;
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
      const flowResponse = contentObj?.body || {};

      let [fecha, hora] = row.messageDate.split('T');
      hora = hora.split('+')[0];

      const formattedRow: any = {
        messageId: row.messageId || "",
        telefono: row.contactId,
        fecha: fecha || "",
        hora: hora || "",
        mensaje: '',
        send: row.sendType
      };

      if (typeof flowResponse === 'string') {
        formattedRow.mensaje = this.corregirCodificacion(flowResponse);  // Solo corregimos si es string
      } else {
        formattedRow.mensaje = flowResponse || '';  // Si no es string, dejamos el valor original
      }

      return formattedRow;
    });

    const cleanFliterData = filteredData.filter(
      (dato) => /\S/.test(dato.mensaje) && dato.send == 'input'
    );

    const cleanMessageBlanck = cleanFliterData.filter((d=> typeof d.mensaje == 'string'))
    const worksheet = XLSX.utils.json_to_sheet(cleanMessageBlanck);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // Exportar a Excel
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob: Blob = new Blob([excelBuffer], {
      type: this.EXCEL_TYPE
    });
    saveAs(dataBlob, 'fallback_Exportados.xlsx');
  }

  corregirCodificacion(texto: string): string {
    try {
      // Solo decodificamos si es necesario
      const decoder = new TextDecoder('utf-8', { fatal: true });
      const encoder = new TextEncoder();
      const bytes = encoder.encode(texto); // Convierte el texto en bytes
      return decoder.decode(bytes);  // Decodifica correctamente
    } catch (error) {
      console.error("Error al corregir codificación:", error);
      return texto;  // Si hay un error, devolvemos el texto tal cual
    }
  }


  goToUrl(url: string): void {
    window.open(url, '_blank');
  }
}
