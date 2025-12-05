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
  setor: string;
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
  ['setor', 'AL'],
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
            CAMPOS.forEach(
              ([nome, col]) => (obj[nome] = this.getValueByColumn(l, col))
            );
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
}
