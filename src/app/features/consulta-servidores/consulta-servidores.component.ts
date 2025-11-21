// src/app/consulta-servidores/consulta-servidores.component.ts
import { Component, ViewChild } from '@angular/core';
import { ExcelService, Servidor } from '../../services/excel.service';
import { Table, TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Column {
  field: string;
  header: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

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
  @ViewChild('dt') dt!: Table;
  dados: Servidor[] = [];
  loading = false;

  rows = 20;
  globalFilterValue = '';

  cols!: Column[];

  exportColumns!: ExportColumn[];

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

  ngOnInit() {
    this.cols = [
      { field: 'matricula', header: 'Matrícula' },
      { field: 'apoio', header: 'Apoio' },
      { field: 'grau', header: 'Grau' },
      { field: 'nome', header: 'Nome' },
      { field: 'secretaria', header: 'Secretaria' },
      { field: 'unidade', header: 'Unidade' },
      { field: 'setor', header: 'Setor' },
      { field: 'centro', header: 'Centro' },
      { field: 'vinculo', header: 'Vínculo' },
      { field: 'cargo', header: 'Cargo' },
      { field: 'padrao', header: 'Padrão' },
      { field: 'funcao', header: 'Função' },
      { field: 'padrao_funcao', header: 'Padrão Função' },
    ];

    this.exportColumns = this.cols.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }

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

  exportToCSV() {
    try {
      // 1) pega fonte: preferencialmente linhas filtradas da tabela, depois dt.value, por fim this.dados
      const tableData =
        (this.dt && (this.dt.filteredValue ?? this.dt.value)) || this.dados;
      if (!tableData || !tableData.length) {
        console.warn('exportToCSV: sem dados para exportar');
        return;
      }

      // 2) usa this.cols para ordem e cabeçalhos (mais previsível)
      const fields = this.cols.map((c) => c.field);
      const headers = this.cols.map((c) => c.header);

      // 3) escape seguro (aspas internas, quebra de linha, ; ou ")
      const escapeValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        let s = String(value);
        // normaliza CRLF
        s = s.replace(/\r\n/g, '\n');
        // escapa aspas
        s = s.replace(/"/g, '""');
        // se necessário, envolve em aspas
        if (/[;"\n\r]/.test(s)) return `"${s}"`;
        return s;
      };

      // 4) monta CSV com ; como separador
      const sep = ';';
      const rows: string[] = [];
      rows.push(headers.join(sep));
      for (const row of tableData) {
        const line = fields.map((f) => escapeValue((row as any)[f])).join(sep);
        rows.push(line);
      }
      const csv = rows.join('\n');

      // 5) BOM + blob
      const bom = '\uFEFF';
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });

      // 6) download - anexar ao DOM melhora compatibilidade
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'consulta-servidores.csv';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      console.log(
        `exportToCSV: exportado ${tableData.length} linhas, ${fields.length} colunas`
      );
    } catch (err) {
      console.error('exportToCSV erro:', err);
    }
  }
}
