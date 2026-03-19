import { Component, ViewChild } from '@angular/core';
import { ExcelService, Servidor } from '../../services/excel.service';
import { Table, TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SortEvent } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import tlpList from '../../const/tlp.json';
import dotacaoList from '../../const/dotacao.json';
import {
  AreaCargoStat,
  AreaVinculoStat,
  CalculoResolucao,
  Column,
  ExportColumn,
  SortEventWithData,
  TlpRow,
} from './models/consulta-servidores.models';
import { TabGeralComponent } from './components/tab-geral/tab-geral.component';
import { TabCargosFuncoesComponent } from './components/tab-cargos-funcoes/tab-cargos-funcoes.component';
import { TabServidoresComponent } from './components/tab-servidores/tab-servidores.component';
import { TabCalculosDistribuicaoComponent } from './components/tab-calculos-distribuicao/tab-calculos-distribuicao.component';
import { TabPriorizacaoGrauComponent } from './components/tab-priorizacao-grau/tab-priorizacao-grau.component';
import { TabPremioQualidadeComponent } from './components/tab-premio-qualidade/tab-premio-qualidade.component';
import { TabTlpComponent } from './components/tab-tlp/tab-tlp.component';

import { TabComissionadosComponent } from './components/tab-comissionados/tab-comissionados.component';
import { TabDotacaoComponent } from './components/tab-dotacao/tab-dotacao.component';

import { DragDropDirective } from '../../core/directives/drag-drop.directive';
import { StatisticsService } from './services/statistics.service';
import { ExportBuilderService } from './services/export-builder.service';
import { DataFilterService } from './services/data-filter.service';
import { ALLOWED_VINCULOS } from './constants/consulta-servidores.constants';

@Component({
  selector: 'app-consulta-servidores',
  templateUrl: './consulta-servidores.component.html',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    MultiSelectModule,
    FormsModule,
    TooltipModule,
    DragDropDirective,
    TabGeralComponent,
    TabCargosFuncoesComponent,
    TabServidoresComponent,
    TabCalculosDistribuicaoComponent,
    TabPriorizacaoGrauComponent,
    TabPremioQualidadeComponent,
    TabTlpComponent,

    TabComissionadosComponent,
    TabDotacaoComponent,
  ],
})
export class ConsultaServidoresComponent {
  @ViewChild(TabGeralComponent) tabGeral?: TabGeralComponent;
  @ViewChild(TabCargosFuncoesComponent) tabCargos?: TabCargosFuncoesComponent;
  @ViewChild(TabTlpComponent) tabTlp?: TabTlpComponent;
  @ViewChild(TabComissionadosComponent)
  tabComissionados?: TabComissionadosComponent;
  @ViewChild(TabDotacaoComponent) tabDotacao?: TabDotacaoComponent;

  // Sidebar state
  activeTab = 0;
  sidebarCollapsed = false;

  menuItems = [
    { label: 'Geral', labelHeader: 'Geral', icon: 'pi pi-home', value: 0 },
    {
      label: 'Cargos e Funções',
      labelHeader: 'Cargos e Funções',
      icon: 'pi pi-list',
      value: 1,
    },
    {
      label: 'Servidores',
      labelHeader: 'Servidores',
      icon: 'pi pi-users',
      value: 2,
    },
    {
      label: 'Cálculos',
      labelHeader: 'Cálculos da Distribuição',
      icon: 'pi pi-calculator',
      value: 3,
    },
    {
      label: 'Priorização 1º Grau',
      labelHeader: 'Priorização 1º Grau',
      icon: 'pi pi-sort-amount-up',
      value: 4,
    },
    {
      label: 'Prêmio Qualidade',
      labelHeader: 'Prêmio de Qualidade (Art. 9 I, a-d)',
      icon: 'pi pi-star',
      value: 5,
    },
    {
      label: 'TLP',
      labelHeader: 'Tabela de Lotação de Pessoal',
      icon: 'pi pi-table',
      value: 6,
    },
    {
      label: 'Comissionados',
      labelHeader: 'Percentual de Comissionados Não Efetivos',
      icon: 'pi pi-chart-pie',
      value: 7,
    },
    {
      label: 'Dotação',
      labelHeader: 'Dotação TJAC_Resoluções Nº 108 e 331',
      icon: 'pi pi-server',
      value: 8,
    },
  ];

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  setActiveTab(idx: number) {
    this.activeTab = idx;
  }

  dados: Servidor[] = [];
  loading = false;

  rows = 10;
  globalFilterValue = '';

  cols!: Column[];
  exportColumns!: ExportColumn[];

  uniqueValues: { [key: string]: any[] } = {
    apoio: [],
    grau: [],
    secretaria: [],
    unidade: [],
    setor: [],
    centro: [],
    vinculo: [],
    cargo: [],
    // padrao: [],
    funcao: [],
    // padrao_funcao: [],
    jurisdicao: [],
    classificacao_tlp: [],
  };

  tlpList: any[] = tlpList;
  dotacaoList: any[] = dotacaoList;
  tlpData: TlpRow[] = [];

  // Armazena todas as opções originais para restaurar quando necessário
  fullUniqueValues: { [key: string]: string[] } = {};

  filterValues: { [key: string]: any[] } = {
    tlp_tlp: [],
    tlp_unidade: [],
    classificacao_tlp: [],
  };

  initialValue: Servidor[] = [];
  initialCargosData: any[] = [];
  initialTlpData: TlpRow[] = [];
  initialComissionadosData: Servidor[] = [];

  // Estado de ordenação por tabela (null = padrão, true = asc, false = desc)
  sortStates: { [key: string]: boolean | null } = {
    main: null,
    cargos: null,
    tlp: null,
    comissionados: null,
  };

  inputPt = {
    root: {
      class: 'border border-surface-300 rounded px-2 py-1 h-7',
    },
  };

  multiselectPt = {
    root: { class: 'h-7 min-h-7' },
  };

  allowedVinculos = ALLOWED_VINCULOS as unknown as string[];

  calculosResolucao: CalculoResolucao[] = [];

  situacaoPremio: CalculoResolucao[] = [];

  totalPontos: number = 0;

  constructor(
    private excelService: ExcelService,
    private statisticsService: StatisticsService,
    private exportBuilderService: ExportBuilderService,
    private filterService: DataFilterService,
  ) {}

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
      // { field: 'padrao', header: 'Padrão' },
      { field: 'funcao', header: 'Função' },
      { field: 'jurisdicao', header: 'Jurisdicão' },
      { field: 'classificacao_tlp', header: 'Classificação TLP' },
      { field: 'situacao', header: 'Situação' },
      // { field: 'padrao_funcao', header: 'Padrão Função' },
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

    this.tlpCols = [
      { field: 'grau', header: 'Grau' },
      { field: 'tipo', header: 'Tipo' },
      { field: 'dsc_unidade', header: 'Unidade' },
      { field: 'uf', header: 'UF' },
      { field: 'municipio', header: 'Município' },
      { field: 'lr_efet', header: 'LR-EFET' },
      { field: 'lr_i', header: 'LR-I' },
      { field: 'lr_sv', header: 'LR-SV' },
      { field: 'cj_1g_1', header: 'CJ-1G-1' },
      { field: 'cj_2g_1', header: 'CJ-2G-1' },
      { field: 'cj_2g_2', header: 'CJ-2G-2' },
      { field: 'cj_2g_3', header: 'CJ-2G-3' },
      { field: 'cj_2g_4', header: 'CJ-2G-4' },
      { field: 'cj_2g_5', header: 'CJ-2G-5' },
      { field: 'cj_2g_6', header: 'CJ-2G-6' },
      { field: 'cj_2g_7', header: 'CJ-2G-7' },
      { field: 'fc_1g_1', header: 'FC-1G-1' },
      { field: 'fc_1g_2', header: 'FC-1G-2' },
      { field: 'fc_2g_1', header: 'FC-2G-1' },
      { field: 'fc_2g_2', header: 'FC-2G-2' },
      { field: 'fc_2g_3', header: 'FC-2G-3' },
      { field: 'fc_2g_4', header: 'FC-2G-4' },
      { field: 'fc_2g_5', header: 'FC-2G-5' },
      { field: 'fc_2g_6', header: 'FC-2G-6' },
    ];
  }

  cargosCols!: Column[];
  resolucaoCols!: Column[];
  tlpCols!: Column[];

  // Drag state
  isDragging = false;

  handleDragOver(isOver: boolean) {
    this.isDragging = isOver;
  }

  handleFileDrop(file: File) {
    this.processFile(file);
  }

  onFileSelected(event: any) {
    // Input file standard event
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  processFile(file: File) {
    if (!file) return;

    this.loading = true;

    this.excelService
      .readFile(file)
      .then((res) => {
        this.dados = res.map((d) => ({
          ...d,
          classificacao_tlp: d.classificacao_tlp
            ? String(d.classificacao_tlp).trim()
            : '',
        }));
        this.initialValue = [...this.dados];
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

    this.calculateStats();
    this.calculateTlpData();
    this.calculateComissionadosStats();
  }

  comissionadosData: Servidor[] = [];
  comissionadosStats = {
    numerator: 0,
    denominator: 0,
    percentage: 0,
    countAdNutum: 0,
    countFp: 0,
    countComissionadoDisp: 0,
    countEfetivoComissionado: 0,
  };

  calculateComissionadosStats() {
    const vinculosAdNutum = ['ad nutum comissionado'];
    const vinculosComissDispBase = ['comissionado (à disposição)'];
    const vinculosComissDispFp = ['à disposição fprev', 'à disposição fps'];
    const vinculosEfetivoComiss = ['efetivo comissionado (resolução 03/2013)'];
    const vinculosEfetivoComiss2 = ['efetivo comissionado'];

    // Filter lists
    const adNutum = this.dados.filter((d) =>
      vinculosAdNutum.includes((d.vinculo || '').toLowerCase().trim()),
    );
    const comissDisp = this.dados.filter((d) => {
      const v = (d.vinculo || '').toLowerCase().trim();
      const f = (d.funcao || '').toLowerCase();
      if (vinculosComissDispBase.includes(v)) return true;
      return false;
    });
    const comissFp = this.dados.filter((d) => {
      const v = (d.vinculo || '').toLowerCase().trim();
      const f = (d.funcao || '').toLowerCase();
      if (vinculosComissDispFp.includes(v)) {
        return f.includes('cj');
      }

      return false;
    });
    const efetivoComiss = this.dados.filter((d) =>
      vinculosEfetivoComiss.includes((d.vinculo || '').toLowerCase().trim()),
    );
    const efetivoComiss2 = this.dados.filter((d) =>
      vinculosEfetivoComiss2.includes((d.vinculo || '').toLowerCase().trim()),
    );

    // Counts
    this.comissionadosStats.countAdNutum = adNutum.length;
    this.comissionadosStats.countComissionadoDisp = comissDisp.length;
    this.comissionadosStats.countFp = comissFp.length;
    this.comissionadosStats.countEfetivoComissionado =
      efetivoComiss.length + efetivoComiss2.length;

    // Totals
    this.comissionadosStats.numerator =
      this.comissionadosStats.countAdNutum +
      this.comissionadosStats.countComissionadoDisp +
      this.comissionadosStats.countFp;
    this.comissionadosStats.denominator =
      this.comissionadosStats.numerator +
      this.comissionadosStats.countEfetivoComissionado;

    // Percentage
    this.comissionadosStats.percentage =
      this.comissionadosStats.denominator > 0
        ? this.comissionadosStats.numerator /
          this.comissionadosStats.denominator
        : 0;

    // Combined Data for Table
    // The user wants a table with "servers that have the links cited above".
    // I am including all 3 groups as they are the ones involved in the calculation.
    this.comissionadosData = [
      ...adNutum,
      ...comissFp,
      ...comissDisp,
      ...efetivoComiss,
    ];
    this.initialComissionadosData = [...this.comissionadosData];
  }

  calculateStats() {
    this.calculateFunctionCounts();
    this.calculateCargosData();
    this.calculateResolucaoData();
    this.calculateAreaVinculoStats();
    this.calculateAreaCargoStats();
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

  areaVinculoStats: AreaVinculoStat[] = [];
  areaCargoStats: AreaCargoStat[] = [];

  calculateAreaVinculoStats() {
    this.areaVinculoStats = this.statisticsService.calculateAreaVinculoStats(
      this.dados,
      this.allowedVinculos,
    );
  }

  calculateAreaCargoStats() {
    this.areaCargoStats = this.statisticsService.calculateAreaCargoStats(
      this.dados,
      this.references,
    );
  }

  calculateTlpData() {
    this.tlpData = [];

    this.tlpList.forEach((item: any) => {
      // Normaliza o nome da unidade do TLP para comparação
      const unidadeTlp = this.filterService.normalizeString(item.unidade);

      // Filtra os dados (servidores) que pertencem a essa unidade
      const matchingServidores = this.dados.filter((d) => {
        const unidadeDados = this.filterService.normalizeString(d.unidade);
        return unidadeDados === unidadeTlp;
      });

      // Se não houver servidores, ainda criamos a linha, mas com counts 0?
      // Ou pegamos grau/ tipo de algum lugar? Vamos tentar pegar do primeiro servidor.
      // Se não tiver servidor, grau/tipo ficam vazios.
      const first = matchingServidores[0];
      const grau = first ? first.grau || '' : '';
      const tipo = first ? first.jurisdicao || '' : ''; // tipo = campo jurisdicao
      const dsc_unidade = first ? first.unidade : item.unidade;
      const tlp = first ? String(first.classificacao_tlp || '').trim() : '';

      let lr_efet = 0;
      let lr_i = 0;
      let lr_sv = 0;

      // Funções
      let cj_1g_1 = 0;
      // cj-2g
      let cj_2g_1 = 0;
      let cj_2g_2 = 0;
      let cj_2g_3 = 0;
      let cj_2g_4 = 0;
      let cj_2g_5 = 0;
      let cj_2g_6 = 0;
      let cj_2g_7 = 0;
      // fc-1g
      let fc_1g_1 = 0;
      let fc_1g_2 = 0;
      // fc-2g
      let fc_2g_1 = 0;
      let fc_2g_2 = 0;
      let fc_2g_3 = 0;
      let fc_2g_4 = 0;
      let fc_2g_5 = 0;
      let fc_2g_6 = 0;

      matchingServidores.forEach((s) => {
        const vinculo = (s.vinculo || '').toLowerCase().trim();
        const funcao = (s.funcao || '').toLowerCase().trim();

        // --- Contagem por Vínculo ---
        if (
          [
            'efetivo não comissionado',
            'efetivo comissionado (resolução 03/2013)',
            'transitório não comissionado',
          ].includes(vinculo)
        ) {
          lr_efet++;
        }

        if (
          [
            'à disposição fprev',
            'à disposição fps',
            'comissionado (à disposição)',
            'diversos (requisitados reg prev rgps)',
            'diversos (requisitados reg prev rpps)',
          ].includes(vinculo)
        ) {
          lr_i++;
        }

        if (['ad nutum comissionado'].includes(vinculo)) {
          lr_sv++;
        }

        // --- Contagem por Função ---
        if (funcao.includes('cj-1g-1')) cj_1g_1++;

        if (funcao.includes('cj-2g-1')) cj_2g_1++;
        if (funcao.includes('cj-2g-2')) cj_2g_2++;
        if (funcao.includes('cj-2g-3')) cj_2g_3++;
        if (funcao.includes('cj-2g-4')) cj_2g_4++;
        if (funcao.includes('cj-2g-5')) cj_2g_5++;
        if (funcao.includes('cj-2g-6')) cj_2g_6++;
        if (funcao.includes('cj-2g-7')) cj_2g_7++;

        if (funcao.includes('fc-1g-1')) fc_1g_1++;
        if (funcao.includes('fc-1g-2')) fc_1g_2++;

        if (funcao.includes('fc-2g-1')) fc_2g_1++;
        if (funcao.includes('fc-2g-2')) fc_2g_2++;
        if (funcao.includes('fc-2g-3')) fc_2g_3++;
        if (funcao.includes('fc-2g-4')) fc_2g_4++;
        if (funcao.includes('fc-2g-5')) fc_2g_5++;
        if (funcao.includes('fc-2g-6')) fc_2g_6++;
      });

      this.tlpData.push({
        grau,
        tipo,
        dsc_unidade,
        uf: 'AC',
        municipio: item.municipio,
        tlp,
        lp: 0,
        lr_efet,
        lr_i,
        lr_sv,
        cj_1g_1,
        cj_2g_1,
        cj_2g_2,
        cj_2g_3,
        cj_2g_4,
        cj_2g_5,
        cj_2g_6,
        cj_2g_7,
        fc_1g_1,
        fc_1g_2,
        fc_2g_1,
        fc_2g_2,
        fc_2g_3,
        fc_2g_4,
        fc_2g_5,
        fc_2g_6,
      });
    });

    this.initialTlpData = [...this.tlpData];

    // Popula filtros TLP
    const tlps = this.tlpData.map((d) => String(d.tlp || '').trim());
    this.uniqueValues['tlp_tlp'] = Array.from(new Set(tlps)).sort((a, b) => {
      // Sort numérico ou string
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });

    const unidades = this.tlpData.map((d) => d.dsc_unidade).filter((v) => !!v);
    this.uniqueValues['tlp_unidade'] = Array.from(new Set(unidades)).sort(
      (a, b) => a.localeCompare(b),
    );
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
        (d.funcao || '').toUpperCase().includes(ref.funcao.toUpperCase()),
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

    const totalApoio = this.resolucaoData[8].value + totalJud;
    const totalApoioValor =
      this.resolucaoData[0].value +
      this.resolucaoData[1].value +
      this.resolucaoData[2].value +
      this.resolucaoData[3].value +
      this.resolucaoData[4].value +
      this.resolucaoData[5].value;

    this.calculosResolucao = [
      // item a)
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
        label: '1º Grau Ideal',
        value: (totalJud * 0.901).toFixed(0),
        desc: 'Servidores',
      },
      {
        label: '2º Grau Ideal',
        value: (totalJud * 0.099).toFixed(0),
        desc: 'Servidores',
      },
      {
        label: 'Diferença',
        value: (totalJud * 0.901 - this.resolucaoData[7].value).toFixed(0),
        desc:
          totalJud * 0.901 - this.resolucaoData[7].value >= 0
            ? 'Migrar para o primeiro grau'
            : 'Não necessita migrar',
      },

      // item b)
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
        label: '1º Grau  Ideal',
        value: (totalJudValor * 0.901).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc: 'Valor',
      },
      {
        label: '2º Grau Ideal',
        value: (totalJudValor * 0.099).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc: 'Valor',
      },
      {
        label: 'Diferença',
        value: (
          totalJudValor * 0.901 -
          (this.resolucaoData[1].value + this.resolucaoData[4].value)
        ).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc:
          totalJudValor * 0.901 -
            (this.resolucaoData[1].value + this.resolucaoData[4].value) >=
          0
            ? 'Migrar para o primeiro grau'
            : 'Não necessita migrar',
      },

      // item c)
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
        label: 'Apoio Direto Ideal',
        value: (totalApoio * 0.7).toFixed(0),
        desc: 'Servidores',
      },
      {
        label: 'Apoio Indireto Ideal',
        value: (totalApoio * 0.3).toFixed(0),
        desc: 'Servidores',
      },
      {
        label: 'Diferença',
        value: (totalApoio * 0.7 - totalJud).toFixed(0),
        desc:
          totalApoio * 0.7 - totalJud >= 0
            ? 'Migrar para o apoio direto'
            : 'Não necessita migrar',
      },

      // item d)
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
        label: 'Apoio Direto Ideal',
        value: (totalApoioValor * 0.7).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc: 'Valor',
      },
      {
        label: 'Apoio Indireto Ideal',
        value: (totalApoioValor * 0.3).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }),
        desc: 'Valor',
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
    ];

    this.situacaoPremio = [
      {
        label: '1º Grau (%)',
        value:
          ((this.resolucaoData[7].value / totalJud) * 100).toLocaleString(
            'pt-BR',
            {
              maximumFractionDigits: 2,
            },
          ) + '%',
        desc: 'Referência 90,1%',
      },

      // item: 'a) Distribuição de servidores por grau de jurisdição (90,1% - Triênio 2024)',
      {
        label: 'Situação (90,1%)',
        value:
          this.resolucaoData[7].value / totalJud >= 0.901 ? '20pts' : '0pts',
        desc:
          this.resolucaoData[7].value / totalJud >= 0.901
            ? 'Cumprido'
            : 'Não cumprido',
      },
      {
        label: 'Situação (Tolerância)',
        value:
          this.resolucaoData[7].value / totalJud >= 0.89 ? '20pts' : '0pts',
        desc:
          this.resolucaoData[7].value / totalJud >= 0.89
            ? 'Cumprido'
            : 'Não cumprido',
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
        desc: 'Referência 90,1%',
      },
      // item: 'b) Distribuição de cargos e funções por grau de jurisdição',
      {
        label: 'Situação (90,1%)',
        value:
          (this.resolucaoData[1].value + this.resolucaoData[4].value) /
            totalJudValor >=
          0.901
            ? '20pts'
            : '0pts',
        desc:
          (this.resolucaoData[1].value + this.resolucaoData[4].value) /
            totalJudValor >=
          0.901
            ? 'Cumprido'
            : 'Não cumprido',
      },
      {
        label: 'Situação (Tolerância)',
        value:
          (this.resolucaoData[1].value + this.resolucaoData[4].value) /
            totalJudValor >=
          0.89
            ? '20pts'
            : '0pts',
        desc:
          (this.resolucaoData[1].value + this.resolucaoData[4].value) /
            totalJudValor >=
          0.89
            ? 'Cumprido'
            : 'Não cumprido',
      },

      {
        label: 'Apoio Indireto (%)',
        value:
          ((this.resolucaoData[8].value / totalApoio) * 100).toLocaleString(
            'pt-BR',
            {
              maximumFractionDigits: 2,
            },
          ) + '%',
        desc: 'Referência 30%',
      },
      {
        // item: 'c) Limite de 30% de servidores na área de apoio indireto (Administrativo)',
        label: 'Situação Item',
        value: totalJud / totalApoio >= 0.7 ? '15pts' : '0pts',
        desc: totalJud / totalApoio >= 0.7 ? 'Cumprido' : 'Não cumprido',
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
        // item: 'd) Limite de 30% de cargos e funções na área de apoio indireto (Administrativo)',
        label: 'Situação Item',
        value: totalJudValor / totalApoioValor >= 0.7 ? '15pts' : '0pts',
        desc:
          totalJudValor / totalApoioValor >= 0.7 ? 'Cumprido' : 'Não cumprido',
      },
    ];

    const indices = [2, 5, 7, 9];
    this.totalPontos = indices.reduce((acc, index) => {
      const item = this.situacaoPremio[index];
      if (item && item.value) {
        // extract number from "20pts" -> 20
        const val = parseInt(item.value.toString().replace(/\D/g, ''), 10) || 0;
        return acc + val;
      }
      return acc;
    }, 0);
  }

  clearTableFilters() {
    this.globalFilterValue = '';
    Object.keys(this.filterValues).forEach((key) => {
      this.filterValues[key] = [];
    });
    this.buildUniqueValues();
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
    filename: string = 'consulta-servidores',
  ) {
    // Deprecated in favor of generic onTabExportRequest
    // Kept just in case, but redirecting logic where possible
  }

  onTabExportRequest(tabName: string) {
    let json: any[] = [];
    let headerRows: any[][] = [];
    const fileName = `export_${tabName}`;

    switch (tabName) {
      case 'geral': {
        const tableData =
          (this.tabGeral?.dt &&
            (this.tabGeral.dt.filteredValue ?? this.tabGeral.dt.value)) ||
          this.dados;
        if (!tableData) return;
        json = tableData;
        headerRows = this.exportBuilderService.buildSimpleHeader(
          'Tabela Geral de Servidores',
        );
        break;
      }

      case 'cargos': {
        if (!this.cargosData) return;
        json = this.cargosData;

        headerRows = this.exportBuilderService.buildCargosExport(
          this.areaCargoStats,
        );
        break;
      }

      case 'servidores': {
        headerRows = this.exportBuilderService.buildServidoresExport(
          this.areaVinculoStats,
        );
        break;
      }

      case 'calculos': {
        headerRows = this.exportBuilderService.buildCalculosExport(
          this.calculosResolucao,
        );
        break;
      }

      case 'resolucao': {
        // Priorização 1º Grau
        if (!this.resolucaoData) return;
        json = this.resolucaoData;
        headerRows.push(['Priorização do 1º Grau']);
        break;
      }

      case 'premio': {
        headerRows = this.exportBuilderService.buildPremioExport(
          this.totalPontos,
          this.situacaoPremio,
        );
        break;
      }

      case 'tlp': {
        if (!this.tlpData) return;
        json = this.tlpData;
        headerRows = this.exportBuilderService.buildSimpleHeader(
          'Taxa de Lotação Paradigma (TLP)',
        );
        break;
      }

      case 'comissionados': {
        if (!this.comissionadosData) return;
        json = this.comissionadosData;

        headerRows = this.exportBuilderService.buildComissionadosExport(
          this.comissionadosStats,
        );
        break;
      }

      case 'dotacao': {
        if (!this.tabDotacao) return;
        json = this.tabDotacao.filteredServidores;

        if (this.tabDotacao.stats) {
          headerRows = this.exportBuilderService.buildDotacaoExport(
            this.tabDotacao.stats,
          );
        }
        break;
      }
    }

    this.excelService.exportAsExcelFile(json, fileName, headerRows);
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
    level: 'secretaria' | 'unidade' | 'setor',
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
          this.tabGeral?.dt,
        );
        break;
      case 'cargos':
        this.executeSort(
          event,
          this.cargosData,
          (d) => (this.cargosData = d),
          this.initialCargosData,
          'cargos',
          this.tabCargos?.dt2,
        );
        break;
      case 'tlp':
        this.executeSort(
          event,
          this.tlpData,
          (d) => (this.tlpData = d),
          this.initialTlpData,
          'tlp',
          this.tabTlp?.dtTlp,
        );
        break;
      case 'comissionados':
        this.executeSort(
          event,
          this.comissionadosData,
          (d) => (this.comissionadosData = d),
          this.initialComissionadosData,
          'comissionados',
          this.tabComissionados?.tabGeral?.dt,
        );
        break;
      case 'dotacao':
        this.executeSort(
          event,
          this.tabDotacao?.filteredServidores || [],
          (d) => {
            if (this.tabDotacao) this.tabDotacao.filteredServidores = d;
          },
          this.initialValue, // Or appropriate initial value for dotacao
          'dotacao',
          this.tabDotacao?.tabGeral?.dt,
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
    table?: Table,
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
