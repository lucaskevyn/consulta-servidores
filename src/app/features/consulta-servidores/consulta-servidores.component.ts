// src/app/consulta-servidores/consulta-servidores.component.ts
import { Component, ViewChild } from '@angular/core';
import { ExcelService, Servidor } from '../../services/excel.service';
import { Table, TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortEvent } from 'primeng/api';

// ---- TIPO CORRIGIDO ----
// PrimeNG não inclui "data" dentro do SortEvent.
// Então criamos uma extensão segura:
interface SortEventWithData extends SortEvent {
  data: Servidor[];
}

// ------------------------
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

  initialValue: Servidor[] = [];
  isSorted: boolean | null = null; // CORRIGIDO

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
        this.initialValue = [...res]; // <--- garante cópia segura
        this.buildUniqueValues();
        this.loading = false;
      })
      .catch((err) => {
        console.error(err);
        this.loading = false;
      });
  }

  buildUniqueValues() {
    const campos = Object.keys(this.uniqueValues);

    campos.forEach((c) => {
      const vals = this.dados.map((d) => (d as any)[c] ?? '').map(String);
      const set = new Set(vals);
      this.uniqueValues[c] = Array.from(set).sort((a, b) => a.localeCompare(b));
    });
  }

  clearTableFilters(table: Table) {
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
      const tableData =
        (this.dt && (this.dt.filteredValue ?? this.dt.value)) || this.dados;

      if (!tableData || !tableData.length) return;

      const fields = this.cols.map((c) => c.field);
      const headers = this.cols.map((c) => c.header);

      const escapeValue = (value: any): string => {
        if (value == null) return '';
        let s = String(value).replace(/\r\n/g, '\n').replace(/"/g, '""');
        return /[;"\n\r]/.test(s) ? `"${s}"` : s;
      };

      const sep = ';';
      const rows: string[] = [];
      rows.push(headers.join(sep));

      for (const row of tableData) {
        rows.push(fields.map((f) => escapeValue((row as any)[f])).join(sep));
      }

      const bom = '\uFEFF';
      const blob = new Blob([bom + rows.join('\n')], {
        type: 'text/csv;charset=utf-8;',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'consulta-servidores.csv';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('exportToCSV erro:', err);
    }
  }

  // -----------------------
  //      3-ESTADOS
  // -----------------------
  customSort(event: SortEvent) {
    // PrimeNG NÃO passa `data` no SortEvent, então pegamos manualmente
    const eventWithData: SortEventWithData = {
      ...event,
      data: this.dados,
    };

    if (this.isSorted == null) {
      this.isSorted = true;
      this.sortTableData(eventWithData);
    } else if (this.isSorted === true) {
      this.isSorted = false;
      this.sortTableData(eventWithData);
    } else if (this.isSorted === false) {
      this.isSorted = null;
      this.dados = [...this.initialValue]; // <-- corrigido (antes era products)
      this.dt.reset();
    }
  }

  // usa o mesmo SortEventWithData do seu código
  sortTableData(event: SortEventWithData) {
    const field = event.field as keyof Servidor;

    event.data.sort((data1, data2) => {
      let value1 = data1[field];
      let value2 = data2[field];

      // normaliza null/undefined
      if (value1 == null && value2 != null) return (event.order ?? 1) * -1;
      if (value1 != null && value2 == null) return (event.order ?? 1) * 1;
      if (value1 == null && value2 == null) return 0;

      // Se ambos são strings, faz comparação robusta
      if (typeof value1 === 'string' && typeof value2 === 'string') {
        // remove espaços extras
        const s1 = value1.trim();
        const s2 = value2.trim();

        // opcional: descomente para remover diacríticos (acentos) antes da comparação
        // const s1clean = s1.normalize('NFD').replace(/\p{Diacritic}/gu, '');
        // const s2clean = s2.normalize('NFD').replace(/\p{Diacritic}/gu, '');

        // comparar com locale adequado e sensibilidade 'base' (ignora maiúsc/minúsc e acentos)
        const cmp = s1.localeCompare(s2, 'pt-BR', {
          sensitivity: 'base',
          numeric: true,
        });
        return (event.order ?? 1) * cmp;
      }

      // Se forem números (ou podem ser convertidos), comparar numericamente
      const n1 = typeof value1 === 'number' ? value1 : Number(value1);
      const n2 = typeof value2 === 'number' ? value2 : Number(value2);
      if (!Number.isNaN(n1) && !Number.isNaN(n2)) {
        return (event.order ?? 1) * (n1 < n2 ? -1 : n1 > n2 ? 1 : 0);
      }

      // fallback genérico (strings/others)
      const a = String(value1).trim();
      const b = String(value2).trim();
      const fallback = a.localeCompare(b, 'pt-BR', {
        sensitivity: 'base',
        numeric: true,
      });
      return (event.order ?? 1) * fallback;
    });
  }
}
