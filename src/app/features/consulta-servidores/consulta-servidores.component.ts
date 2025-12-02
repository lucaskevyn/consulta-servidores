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
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';

// ---- TIPO CORRIGIDO ----
// PrimeNG não inclui "data" dentro do SortEvent.
// Então criamos uma extensão segura:
interface SortEventWithData extends SortEvent {
  data: any[];
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
    TabsModule,
    TooltipModule,
  ],
})
export class ConsultaServidoresComponent {
  @ViewChild('dt') dt!: Table;
  @ViewChild('dt2') dt2!: Table;

  dados: Servidor[] = [];
  loading = false;

  rows = 10;
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

  // Armazena todas as opções originais para restaurar quando necessário
  fullUniqueValues: { [key: string]: string[] } = {};

  filterValues: { [key: string]: any[] } = {};

  initialValue: Servidor[] = [];
  initialCargosData: any[] = [];

  // Estado de ordenação por tabela (null = padrão, true = asc, false = desc)
  sortStates: { [key: string]: boolean | null } = {
    main: null,
    cargos: null,
  };

  inputPt = {
    root: {
      class: 'border border-surface-300 rounded px-2 py-1  h-7',
    },
  };

  multiselectPt = {
    root: { class: 'h-7 min-h-7' },
  };

  allowedVinculos = [
    'à disposição fprev',
    'à disposição fps',
    'ad nutum comissionado',
    'comissionado (à disposição)',
    'diversos (requisitados reg prev rgps)',
    'diversos (requisitados reg prev rpps)',
    'efetivo comissionado (resolução 03/2013)',
    'efetivo não comissionado',
    'transitório não comissionado',
  ];

  calculosJudiciaria: {
    label: string;
    value: any;
    desc?: string;
    bgColor?: string;
    textColor?: string;
  }[] = [];
  calculosApoio: {
    label: string;
    value: any;
    desc?: string;
    bgColor?: string;
    textColor?: string;
  }[] = [];

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

    this.cargosCols = [
      { field: 'funcao', header: 'Função' },
      { field: 'apoio', header: 'Apoio' },
      { field: 'valorUnitario', header: 'Valor Unitário' },
      { field: 'quantidade', header: 'Quantidade' },
      { field: 'valorTotal', header: 'Valor Total' },
    ];

    this.resolucaoCols = [
      { field: 'label', header: 'Descrição' },
      { field: 'question', header: 'Pergunta' },
      { field: 'value', header: 'Valor' },
    ];
  }

  cargosCols!: Column[];
  resolucaoCols!: Column[];

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

      this.filterValues[c] = [];
    });

    // Faz uma cópia profunda para preservar todas as opções
    this.fullUniqueValues = JSON.parse(JSON.stringify(this.uniqueValues));

    this.calculateApoioCounts();
  }

  apoioCounts: { label: string; count: number }[] = [];

  calculateApoioCounts() {
    this.calculateFunctionCounts();
    this.calculateCargosData();
    this.calculateResolucaoData();

    this.apoioCounts[0] = {
      label: 'ÁREA ADMINISTRATIVA DO TJAC',
      count: this.resolucaoData[8].value,
    };
    this.apoioCounts[1] = {
      label: 'ÁREA JUDICIÁRIA DE 1º GRAU',
      count: this.resolucaoData[7].value,
    };
    this.apoioCounts[2] = {
      label: 'ÁREA JUDICIÁRIA DE 2º GRAU',
      count: this.resolucaoData[6].value,
    };
  }

  functionCounts: { label: string; count: number }[] = [];

  calculateFunctionCounts() {
    const combinations = [
      {
        label: 'CJ - Adm TJAC',
        func: 'cj',
        apoio: 'área administrativa do tjac',
      },
      {
        label: 'FC - Adm TJAC',
        func: 'fc',
        apoio: 'área administrativa do tjac',
      },
      {
        label: 'CJ - Jud 1º Grau',
        func: 'cj',
        apoio: 'área judiciária de 1º grau',
      },
      {
        label: 'FC - Jud 1º Grau',
        func: 'fc',
        apoio: 'área judiciária de 1º grau',
      },
      {
        label: 'CJ - Jud 2º Grau',
        func: 'cj',
        apoio: 'área judiciária de 2º grau',
      },
      {
        label: 'FC - Jud 2º Grau',
        func: 'fc',
        apoio: 'área judiciária de 2º grau',
      },
    ];

    const counts = combinations.map((combo) => {
      const count = this.dados.filter((d) => {
        const f = (d.funcao || '').toLowerCase();
        const a = (d.apoio || '').toLowerCase();

        return f.includes(combo.func) && a.includes(combo.apoio);
      }).length;
      return { label: combo.label, count };
    });

    this.functionCounts = counts;
  }

  // -----------------------
  //      CARGOS TABLE
  // -----------------------
  references = [
    { funcao: 'CJ-1G-1', valor: 6779.08 },
    { funcao: 'CJ-2G-7', valor: 19564.16 },
    { funcao: 'CJ-2G-6', valor: 15873.55 },
    { funcao: 'CJ-2G-5', valor: 11875.33 },
    { funcao: 'CJ-2G-4', valor: 8891.58 },
    { funcao: 'CJ-2G-3', valor: 6779.08 },
    { funcao: 'CJ-2G-2', valor: 5012.7 },
    { funcao: 'CJ-2G-1', valor: 3699.85 },
    { funcao: 'FC-1G-2', valor: 2000.0 },
    { funcao: 'FC-1G-1', valor: 1700.0 },
    { funcao: 'FC-2G-6', valor: 7125.2 },
    { funcao: 'FC-2G-5', valor: 5334.95 },
    { funcao: 'FC-2G-4', valor: 4067.45 },
    { funcao: 'FC-2G-3', valor: 4067.45 },
    { funcao: 'FC-2G-2', valor: 1700.0 },
    { funcao: 'FC-2G-1', valor: 1500.0 },
  ];

  cargosData: {
    funcao: string;
    apoio: string;
    valorUnitario: number;
    quantidade: number;
    valorTotal: number;
  }[] = [];

  calculateCargosData() {
    this.cargosData = [];

    this.references.forEach((ref) => {
      // 1. Filtra registros que correspondem à função
      const matchingRows = this.dados.filter((d) =>
        (d.funcao || '').toUpperCase().includes(ref.funcao.toUpperCase())
      );

      // 2. Agrupa por Apoio
      const groups: { [apoio: string]: number } = {};

      matchingRows.forEach((row) => {
        const apoioVal = row.apoio || 'Sem Apoio';
        const apoioLower = apoioVal.toLowerCase();

        // Exclusão explícita
        if (apoioLower.includes('esjud') || apoioLower.includes('tecnologia')) {
          return;
        }

        groups[apoioVal] = (groups[apoioVal] || 0) + 1;
      });

      // 3. Gera as linhas resultantes para esta função
      Object.keys(groups).forEach((apoioKey) => {
        const qtd = groups[apoioKey];
        this.cargosData.push({
          funcao: ref.funcao,
          apoio: apoioKey,
          valorUnitario: ref.valor,
          quantidade: qtd,
          valorTotal: qtd * ref.valor,
        });
      });
    });

    // Opcional: ordenar por função e depois apoio
    this.cargosData.sort((a, b) => {
      const cmpFunc = a.funcao.localeCompare(b.funcao);
      if (cmpFunc !== 0) return cmpFunc;
      return a.apoio.localeCompare(b.apoio);
    });

    this.initialCargosData = [...this.cargosData];
  }

  resolucaoData: any[] = [];

  calculateResolucaoData() {
    const getSum = (type: 'CJ' | 'FC', apoio: string) => {
      let total = 0;
      const refs = this.references.filter((r) => r.funcao.startsWith(type));

      for (const ref of refs) {
        const count = this.dados.filter((d) => {
          const f = (d.funcao || '').toUpperCase();
          const a = (d.apoio || '').toLowerCase();
          return f.includes(ref.funcao.toUpperCase()) && a.includes(apoio);
        }).length;
        total += count * ref.valor;
      }
      return total;
    };

    const getCount = (apoio: string) => {
      return this.dados.filter((d) => {
        const a = (d.apoio || '').toLowerCase();
        const v = (d.vinculo || '').toLowerCase().trim();
        return a.includes(apoio) && this.allowedVinculos.includes(v);
      }).length;
    };

    this.resolucaoData = [
      {
        question:
          'VCC2º - Valores Integrais dos Cargos em Comissão Alocados na Área Judiciária do 2º Grau',
        tooltip:
          'Soma dos valores integrais (100%) dos cargos em comissão alocados para servidores da área judiciária de 2º grau ao final do período-base',
        label: 'CJ - Jud 2º Grau',
        value: getSum('CJ', 'área judiciária de 2º grau'),
        isCurrency: true,
      },
      {
        question:
          'VCCTRJE1º - Valores Integrais dos Cargos em Comissão Alocados na Área Judiciária do 1º Grau, nas Turmas Recursais e nos Juizados Especiais',
        tooltip:
          'Soma dos valores integrais (100%) dos cargos em comissão alocados para servidores da área judiciária do 1º grau, das Turmas Recursais e dos Juizados Especiais ao final do período-base',
        label: 'CJ - Jud 1º Grau',
        value: getSum('CJ', 'área judiciária de 1º grau'),
        isCurrency: true,
      },
      {
        question:
          'VCCAdm - Valores Integrais dos Cargos em Comissão Alocados na Área Administrativa',
        tooltip:
          'Soma dos valores integrais (100%) dos cargos em comissão alocados para servidores da área administrativa ao final do período-base. Excluir do cálculo os valores referentes aos cargos em comissão de servidores alocados nas escolas judiciais e da magistratura (TPEsc) e nas áreas de tecnologia da informação (TPTIC)',
        label: 'CJ - Adm TJAC',
        value: getSum('CJ', 'área administrativa do tjac'),
        isCurrency: true,
      },
      {
        question:
          'VFC2º - Valores Integrais das Funções de Confiança Alocadas na Área Judiciária do 2º grau',
        tooltip:
          'Soma dos valores integrais (100%) das funções de confiança alocadas para servidores da área judiciária de 2º grau ao final do período-base',
        label: 'FC - Jud 2º Grau',
        value: getSum('FC', 'área judiciária de 2º grau'),
        isCurrency: true,
      },
      {
        question:
          'VFCTRJE1º - Valores Integrais das Funções de Confiança Alocadas na Área Judiciária do 1º Grau, nas Turmas Recursais e nos Juizados Especiais',
        tooltip:
          'Soma dos valores integrais (100%) das funções de confiança alocadas para servidores da área judiciária do 1º grau, das Turmas Recursais e dos Juizados Especiais ao final do período-base',
        label: 'FC - Jud 1º Grau',
        value: getSum('FC', 'área judiciária de 1º grau'),
        isCurrency: true,
      },
      {
        question:
          'VFCAdm - Valores Integrais das Funções de Confiança Alocadas na Área Administrativa',
        tooltip:
          'Soma dos valores integrais (100%) das funções de confiança alocadas para servidores da área administrativa ao final do período-base. Excluir do cálculo os valores referentes às funções de confiança de servidores alocados nas escolas judiciais e da magistratura (TPEsc) e nas áreas de tecnologia da informação (TPTIC',
        label: 'FC - Adm TJAC',
        value: getSum('FC', 'área administrativa do tjac'),
        isCurrency: true,
      },
      {
        question:
          'SaJudP2° - Total de Servidores que atuam na Área Judiciária do 2º Grau',
        tooltip:
          'Total de cargos de servidores providos, lotados nas áreas judiciárias do 2º Grau, ao final do período-base, abrangendo os servidores efetivos, os comissionados sem vínculo efetivo e os que ingressaram por cessão ou requisição',
        label: 'Serv - Jud 2º Grau',
        value: getCount('área judiciária de 2º grau'),
        isCurrency: false,
      },
      {
        question:
          'SaJudP1JETR - Total de Servidores que atuam na Área Judiciária do 1º Grau, dos Juizados Especiais e das Turmas Recursais',
        tooltip:
          'Total de cargos de servidores providos, lotados nas áreas judiciárias do 1º Grau, dos Juizados Especiais e das Turmas Recursais ao final do período-base, abrangendo os servidores efetivos, os comissionados sem vínculo efetivo e os que ingressaram por cessão ou requisição',
        label: 'Serv - Jud 1º Grau',
        value: getCount('área judiciária de 1º grau'),
        isCurrency: false,
      },
      {
        question:
          'ServAdmSETI - Total de Servidores na Área Administrativa, exceto os lotados nas escolas judiciais e da magistratura e nas áreas de tecnologia da informação',
        tooltip:
          'Total de cargos de servidores providos, lotados nas áreas de apoio indireto à atividade judicante ao final do período-base, abrangendo os servidores efetivos (TPEfetAdm), os comissionados sem vínculo efetivo (TPSVAdm) e os que ingressaram por cessão ou requisição (TPIAdm). Excluir do cálculo os servidores alocados nas escolas judiciais e da magistratura (TPEsc) e nas áreas de tecnologia da informação (TPTIC)',
        label: 'Serv - Adm TJAC',
        value: getCount('área administrativa do tjac'),
        isCurrency: false,
      },
    ];

    const totalJud = this.resolucaoData[6].value + this.resolucaoData[7].value;
    const totalJudValor =
      this.resolucaoData[0].value +
      this.resolucaoData[1].value +
      this.resolucaoData[3].value +
      this.resolucaoData[4].value;

    this.calculosJudiciaria = [
      {
        label: '1º Grau',
        value: this.resolucaoData[7].value,
        desc: 'Servidores',
      },
      {
        label: '2º Grau',
        value: this.resolucaoData[6].value,
        desc: 'Servidores',
      },
      {
        label: '1º Grau (%)',
        value:
          ((this.resolucaoData[7].value / totalJud) * 100).toLocaleString(
            'pt-BR',
            {
              maximumFractionDigits: 2,
            }
          ) + '%',
        desc: 'Referência 91,5%',
      },
      {
        label: '2º Grau (%)',
        value:
          ((this.resolucaoData[6].value / totalJud) * 100).toLocaleString(
            'pt-BR',
            {
              maximumFractionDigits: 2,
            }
          ) + '%',
        desc: 'Referência 8,5%',
      },
      {
        label: 'Diferença',
        value: (totalJud * 0.915 - this.resolucaoData[7].value).toFixed(0),
        desc:
          totalJud * 0.915 - this.resolucaoData[7].value >= 0
            ? 'Migrar para o primeiro grau'
            : 'Não necessita migrar',
      },
      {
        label: 'Situação Item',
        value:
          this.resolucaoData[7].value / totalJud >= 0.915 ? '20pts' : '0pts',
        desc:
          this.resolucaoData[7].value / totalJud >= 0.915
            ? 'Cumprido'
            : 'Não cumprido',
        bgColor:
          this.resolucaoData[7].value / totalJud >= 0.915
            ? 'bg-green-50'
            : 'bg-rose-50',
        textColor:
          this.resolucaoData[7].value / totalJud >= 0.915
            ? 'text-green-800'
            : 'text-rose-800',
      },
      // Valores
      {
        label: '1º Grau',
        value: (
          this.resolucaoData[1].value + this.resolucaoData[4].value
        ).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc: 'Valor',
      },
      {
        label: '2º Grau',
        value: (
          this.resolucaoData[0].value + this.resolucaoData[3].value
        ).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc: 'Valor',
      },
      {
        label: '1º Grau (%)',
        value:
          (
            ((this.resolucaoData[1].value + this.resolucaoData[4].value) /
              totalJudValor) *
            100
          ).toLocaleString('pt-BR', {
            maximumFractionDigits: 2,
          }) + '%',
        desc: 'Referência 90,5%',
      },
      {
        label: '2º Grau (%)',
        value:
          (
            ((this.resolucaoData[0].value + this.resolucaoData[3].value) /
              totalJudValor) *
            100
          ).toLocaleString('pt-BR', {
            maximumFractionDigits: 2,
          }) + '%',
        desc: 'Referência 8,5%',
      },
      {
        label: 'Diferença',
        value: (
          totalJudValor * 0.915 -
          (this.resolucaoData[1].value + this.resolucaoData[4].value)
        ).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc:
          totalJudValor * 0.915 -
            (this.resolucaoData[1].value + this.resolucaoData[4].value) >=
          0
            ? 'Migrar para o primeiro grau'
            : 'Não necessita migrar',
      },
      {
        label: 'Situação Item',
        value:
          (this.resolucaoData[1].value + this.resolucaoData[4].value) /
            totalJudValor >=
          0.915
            ? '20pts'
            : '0pts',
        desc:
          (this.resolucaoData[1].value + this.resolucaoData[4].value) /
            totalJudValor >=
          0.915
            ? 'Cumprido'
            : 'Não cumprido',
        bgColor:
          (this.resolucaoData[1].value + this.resolucaoData[4].value) /
          totalJudValor
            ? 'bg-rose-50'
            : 'bg-green-50',
        textColor:
          (this.resolucaoData[1].value + this.resolucaoData[4].value) /
          totalJudValor
            ? 'text-rose-800'
            : 'text-green-800',
      },
    ];

    const totalApoio = this.resolucaoData[8].value + totalJud;
    const totalApoioValor =
      this.resolucaoData[0].value +
      this.resolucaoData[1].value +
      this.resolucaoData[2].value +
      this.resolucaoData[3].value +
      this.resolucaoData[4].value +
      this.resolucaoData[5].value;

    this.calculosApoio = [
      {
        label: 'Apoio Direto',
        value: totalJud,
        desc: 'Servidores',
      },
      {
        label: 'Apoio Indireto',
        value: this.resolucaoData[8].value,
        desc: 'Servidores',
      },
      {
        label: 'Apoio Direto (%)',
        value:
          (
            ((this.resolucaoData[7].value + this.resolucaoData[6].value) /
              totalApoio) *
            100
          ).toLocaleString('pt-BR', {
            maximumFractionDigits: 2,
          }) + '%',
        desc: 'Referência 70%',
      },
      {
        label: 'Apoio Indireto (%)',
        value:
          ((this.resolucaoData[8].value / totalApoio) * 100).toLocaleString(
            'pt-BR',
            {
              maximumFractionDigits: 2,
            }
          ) + '%',
        desc: 'Referência 30%',
      },
      {
        label: 'Diferença',
        value: (totalApoio * 0.7 - totalJud).toFixed(0),
        desc:
          totalApoio * 0.7 - totalJud >= 0
            ? 'Migrar para o apoio direto'
            : 'Não necessita migrar',
      },
      {
        label: 'Situação Item',
        value: totalJud / totalApoio >= 0.7 ? '20pts' : '0pts',
        desc: totalJud / totalApoio >= 0.7 ? 'Cumprido' : 'Não cumprido',
        bgColor: totalJud / totalApoio >= 0.7 ? 'bg-green-50' : 'bg-rose-50',
        textColor:
          totalJud / totalApoio >= 0.7 ? 'text-green-800' : 'text-rose-800',
      },

      // Valores
      {
        label: 'Apoio Direto',
        value: totalJudValor.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc: 'Valor',
      },
      {
        label: 'Apoio Indireto',
        value: (totalApoioValor - totalJudValor).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc: 'Valor',
      },
      {
        label: 'Apoio Direto (%)',
        value:
          ((totalJudValor / totalApoioValor) * 100).toLocaleString('pt-BR', {
            maximumFractionDigits: 2,
          }) + '%',
        desc: 'Referência 70%',
      },
      {
        label: 'Apoio Indireto (%)',
        value:
          (
            ((totalApoioValor - totalJudValor) / totalApoioValor) *
            100
          ).toLocaleString('pt-BR', {
            maximumFractionDigits: 2,
          }) + '%',
        desc: 'Referência 30%',
      },
      {
        label: 'Diferença',
        value: (totalApoioValor * 0.7 - totalJudValor).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc:
          totalApoioValor * 0.7 - totalJudValor >= 0
            ? 'Migrar para o apoio direto'
            : 'Não necessita migrar',
      },
      {
        label: 'Situação Item',
        value: totalJudValor / totalApoioValor >= 0.7 ? '20pts' : '0pts',
        desc:
          totalJudValor / totalApoioValor >= 0.7 ? 'Cumprido' : 'Não cumprido',
        bgColor:
          totalJudValor / totalApoioValor >= 0.7 ? 'bg-green-50' : 'bg-rose-50',
        textColor:
          totalJudValor / totalApoioValor >= 0.7
            ? 'text-green-800'
            : 'text-rose-800',
      },
    ];
  }

  clearTableFilters(table: Table) {
    table.clear();
    Object.keys(this.filterValues).forEach((key) => {
      this.filterValues[key] = [];
    });
  }

  getOptions(campo: string) {
    const arr = this.uniqueValues[campo] || [];
    return arr.map((v) => ({
      label: v || '<vazio>',
      value: v,
    }));
  }

  exportToCSV(
    data: any[] | null = null,
    columns: Column[] | null = null,
    filename: string = 'consulta-servidores'
  ) {
    try {
      // Se não passar dados, tenta pegar da tabela principal (dt)
      const tableData =
        data ||
        (this.dt && (this.dt.filteredValue ?? this.dt.value)) ||
        this.dados;

      // Se não passar colunas, usa as colunas principais
      const cols = columns || this.cols;

      if (!tableData || !tableData.length) return;

      const fields = cols.map((c) => c.field);
      const headers = cols.map((c) => c.header);

      const escapeValue = (value: any): string => {
        if (value == null) return '';

        // Se for número, formata com vírgula (pt-BR)
        if (typeof value === 'number') {
          return value.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
        }

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
      a.download = `${filename}.csv`;
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
  //      FILTROS DEPENDENTES
  // -----------------------

  onSecretariaChange(selectedSecretarias: string[]) {
    this.updateUnidadeOptions();
    this.updateSetorOptions();
    this.updateCentroOptions();
  }

  onUnidadeChange(selectedUnidades: string[]) {
    this.updateSetorOptions();
    this.updateCentroOptions();
  }

  onSetorChange(selectedSetores: string[]) {
    this.updateCentroOptions();
  }

  private updateUnidadeOptions() {
    const subset = this.getFilteredData('secretaria');
    this.updateOptionsFor('unidade', subset);
  }

  private updateSetorOptions() {
    const subset = this.getFilteredData('unidade');
    this.updateOptionsFor('setor', subset);
  }

  private updateCentroOptions() {
    const subset = this.getFilteredData('setor');
    this.updateOptionsFor('centro', subset);
  }

  /**
   * Retorna os dados filtrados até o nível solicitado.
   * Ex: 'unidade' retorna dados filtrados por Secretaria AND Unidade.
   * Se um filtro estiver vazio, ele não restringe (passa tudo do nível anterior).
   */
  private getFilteredData(
    level: 'secretaria' | 'unidade' | 'setor'
  ): Servidor[] {
    let data = this.initialValue;

    // 1. Filtra por Secretaria
    const secretarias = this.filterValues['secretaria'];
    if (secretarias && secretarias.length > 0) {
      data = data.filter((item) => secretarias.includes(item.secretaria));
    }
    if (level === 'secretaria') return data;

    // 2. Filtra por Unidade
    const unidades = this.filterValues['unidade'];
    if (unidades && unidades.length > 0) {
      data = data.filter((item) => unidades.includes(item.unidade));
    }
    if (level === 'unidade') return data;

    // 3. Filtra por Setor
    const setores = this.filterValues['setor'];
    if (setores && setores.length > 0) {
      data = data.filter((item) => setores.includes(item.setor));
    }
    return data; // level === 'setor'
  }

  private updateOptionsFor(field: string, data: Servidor[]) {
    const vals = data
      .map((d) => (d as any)[field])
      .filter((v) => v != null && v !== '');
    const unique = Array.from(new Set(vals)).sort((a, b) => a.localeCompare(b));
    this.uniqueValues[field] = unique;
  }

  // -----------------------
  //      3-ESTADOS (GENÉRICO)
  // -----------------------
  customSort(event: SortEvent, tableKey: string = 'main') {
    switch (tableKey) {
      case 'main':
        this.executeSort(
          event,
          this.dados,
          (d) => (this.dados = d),
          this.initialValue,
          'main',
          this.dt
        );
        break;
      case 'cargos':
        this.executeSort(
          event,
          this.cargosData,
          (d) => (this.cargosData = d),
          this.initialCargosData,
          'cargos',
          this.dt2
        );
        break;
    }
  }

  executeSort(
    event: SortEvent,
    currentData: any[],
    setData: (data: any[]) => void,
    initialData: any[],
    key: string,
    table?: Table
  ) {
    const eventWithData: SortEventWithData = {
      ...event,
      data: currentData,
    };

    const currentState = this.sortStates[key];

    if (currentState == null) {
      this.sortStates[key] = true;
      this.sortArray(eventWithData);
    } else if (currentState === true) {
      this.sortStates[key] = false;
      this.sortArray(eventWithData);
    } else if (currentState === false) {
      this.sortStates[key] = null;
      setData([...initialData]); // Restaura ordem inicial
      if (table) table.reset();
    }
  }

  sortArray(event: SortEventWithData) {
    const field = event.field!;

    event.data.sort((data1, data2) => {
      let value1 = (data1 as any)[field];
      let value2 = (data2 as any)[field];

      // normaliza null/undefined
      if (value1 == null && value2 != null) return (event.order ?? 1) * -1;
      if (value1 != null && value2 == null) return (event.order ?? 1) * 1;
      if (value1 == null && value2 == null) return 0;

      // Se ambos são strings, faz comparação robusta
      if (typeof value1 === 'string' && typeof value2 === 'string') {
        const s1 = value1.trim();
        const s2 = value2.trim();

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

  get globalFields() {
    return this.cols.map((c) => c.field);
  }
}
