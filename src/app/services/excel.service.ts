// src/app/services/excel.service.ts
import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface Servidor {
  matricula: string;
  apoio: string;
  grau: string;
  nome: string;
  secretaria: string;
  unidade: string;
  cod_unidade: string;
  setor: string;
  cod_setor: string;
  centro: string;
  vinculo: string;
  cargo: string;
  // padrao: string;
  funcao: string;
  // padrao_funcao: string;
  jurisdicao: string;
  classificacao_tlp: string;
  situacao: string;
}

const CAMPOS: Array<[keyof Servidor, string]> = [
  ['matricula', 'A'],
  ['apoio', 'CE'],
  ['grau', 'CF'],
  ['nome', 'C'],
  ['secretaria', 'AO'],
  ['unidade', 'AN'],
  ['cod_unidade', 'AM'],
  ['setor', 'AL'],
  ['cod_setor', 'AK'],
  ['centro', 'AP'],
  ['vinculo', 'M'],
  ['cargo', 'AI'],
  // ['padrao', 'AG'],
  ['funcao', 'AJ'],
  ['jurisdicao', 'BK'],
  ['classificacao_tlp', 'CH'],
  ['situacao', 'AS'],
  // ['padrao_funcao', 'AY'],
];

@Injectable({ providedIn: 'root' })
export class ExcelService {
  constructor() {}

  private letraParaIndice(col: string) {
    let soma = 0;
    for (let i = 0; i < col.length; i++) {
      soma = soma * 26 + (col.charCodeAt(i) - 64);
    }
    return soma - 1;
  }

  private getValueByColumn(row: any, letter: string) {
    const idx = this.letraParaIndice(letter);
    const keys = Object.keys(row);
    return row[keys[idx]] ?? '';
  }

  readFile(file: File): Promise<Servidor[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const linhas: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

          const dados: Servidor[] = linhas.map((l) => {
            const obj: any = {};
            CAMPOS.forEach(([nome, col]) => {
              const val = this.getValueByColumn(l, col);
              obj[nome] = typeof val === 'string' ? val.trim() : val;
            });
            return obj as Servidor;
          });

          resolve(dados);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  public exportAsExcelFile(
    json: any[],
    excelFileName: string,
    headerRows?: any[][],
  ): void {
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet([]);

    // 1. Add Header Rows (Stats/Cards)
    if (headerRows && headerRows.length > 0) {
      XLSX.utils.sheet_add_aoa(worksheet, headerRows, { origin: 'A1' });
    }

    // 2. Add Data Table
    // If we have headers, start data after them + 1 empty line
    const dataOrigin =
      headerRows && headerRows.length > 0
        ? { r: headerRows.length + 1, c: 0 }
        : { r: 0, c: 0 };

    if (json && json.length > 0) {
      XLSX.utils.sheet_add_json(worksheet, json, {
        origin: dataOrigin,
        skipHeader: false,
      });
    }

    const workbook: XLSX.WorkBook = {
      Sheets: { data: worksheet },
      SheetNames: ['data'],
    };
    const excelBuffer: any = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    this.saveAsExcelFile(excelBuffer, excelFileName);
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const EXCEL_TYPE =
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    const EXCEL_EXTENSION = '.xlsx';
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    const url = window.URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + '_export_' + new Date().getTime() + EXCEL_EXTENSION;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
