// src/app/consulta-servidores/consulta-servidores.component.ts
import { Component } from '@angular/core';
import { ExcelService, Servidor } from '../../services/excel.service';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consulta-servidores',
  templateUrl: './consulta-servidores.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    MultiSelectModule,
    InputText,
    Button,
    FormsModule,
  ],
})
export class ConsultaServidoresComponent {
  dados: Servidor[] = [];
  loading = false;

  rows = 20;
  globalFilterValue = '';

  // 🔥 evitar undefined no template
  uniqueValues: { [key: string]: string[] } = {
    apoio: [],
    grau: [],
    secretaria: [],
    unidade: [],
    setor: [],
    centro: [],
    vinculo: [],
    cargo: [],
    padrao: [],
    funcao: [],
    padrao_funcao: [],
  };

  constructor(private excelService: ExcelService) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];

    this.loading = true;

    this.excelService
      .readFile(file)
      .then((res) => {
        this.dados = res;
        this.buildUniqueValues();
        this.loading = false;
      })
      .catch((err) => {
        console.error(err);
        this.loading = false;
      });
  }

  // 🔥 sempre gera arrays, então nunca fica undefined
  buildUniqueValues() {
    const campos = Object.keys(this.uniqueValues);

    campos.forEach((c) => {
      const vals = this.dados.map((d) => (d as any)[c] ?? '').map(String);

      const set = new Set(vals);

      this.uniqueValues[c] = Array.from(set).sort((a, b) => a.localeCompare(b));
    });
  }

  clearTableFilters(table: any) {
    table.clear();
  }

  getOptions(campo: string) {
    const arr = this.uniqueValues[campo] || [];
    return arr.map((v) => ({
      label: v || '<vazio>',
      value: v,
    }));
  }
}
