import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { SortEvent } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { Servidor } from '../../../../services/excel.service';
import { Column } from '../../models/consulta-servidores.models';
import { TabGeralComponent } from '../tab-geral/tab-geral.component';
import { CardComponent } from '../../../../shared/components/card/card.component';

interface DotacaoRow {
  resolucao: string;
  cod_secretaria: string;
  secretaria: string;
  cod_unidade: string;
  unidade: string;
  cod_setor: string;
  setor: string;
  cargos_criados: string;
  desc_aldenice: string;
  apoio: string;
  desc_admrh: string;
  cargo_admrh: string;
  conta_dotacao: string;
}

interface StatsGroup {
  providos: number;
  dotacao: number;
  vagas: number;
}

interface DotacaoCardStats {
  total: StatsGroup;
  servidores: StatsGroup;
  colaboradores: StatsGroup;
  estagiarios: StatsGroup;
  cj: StatsGroup;
  fc: StatsGroup;
}

const EXCLUDED_VINCULOS = [
  'inativos',
  'pensão alimento',
  'pensionista',
  'policial militar',
  'residente tecnologico',
  'voluntários',
];

@Component({
  selector: 'app-tab-dotacao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MultiSelectModule,
    TableModule,
    TabGeralComponent,
    CardComponent,
  ],
  templateUrl: './tab-dotacao.component.html',
})
export class TabDotacaoComponent implements OnChanges {
  @ViewChild(TabGeralComponent) tabGeral?: TabGeralComponent;
  @Input() dados: Servidor[] = [];
  @Input() dotacaoData: DotacaoRow[] = [];

  // Inputs for TabGeral
  @Input() cols: Column[] = [];
  @Input() uniqueValues: { [key: string]: any[] } = {};
  @Input() filterValues: { [key: string]: any[] } = {};
  @Input() inputPt: any;
  @Input() multiselectPt: any;

  // Outputs for TabGeral
  @Output() sortRequest = new EventEmitter<{ event: SortEvent; key: string }>();
  @Output() exportRequest = new EventEmitter<void>();
  @Output() clearFiltersRequest = new EventEmitter<void>();

  // Dropdown options
  secretariaOptions: any[] = [];
  unidadeOptions: any[] = [];
  setorOptions: any[] = [];

  // Selected values
  selectedSecretaria: string[] = [];
  selectedUnidade: string[] = [];
  selectedSetor: string[] = [];

  // Filtered Data
  filteredServidores: Servidor[] = [];
  filteredDotacao: DotacaoRow[] = [];

  // Stats
  stats: DotacaoCardStats = {
    total: { providos: 0, dotacao: 0, vagas: 0 },
    servidores: { providos: 0, dotacao: 0, vagas: 0 },
    colaboradores: { providos: 0, dotacao: 0, vagas: 0 },
    estagiarios: { providos: 0, dotacao: 0, vagas: 0 },
    cj: { providos: 0, dotacao: 0, vagas: 0 },
    fc: { providos: 0, dotacao: 0, vagas: 0 },
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dotacaoData'] && this.dotacaoData.length > 0) {
      this.initFilters();
    }
    if (changes['dados'] || changes['dotacaoData']) {
      this.updateResults();
    }
  }

  normalize(str: string): string {
    return str
      ? str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim()
      : '';
  }

  initFilters() {
    // Populate Secretaria options from dotacaoData
    const secretarias = new Set(this.dotacaoData.map((d) => d.secretaria));
    this.secretariaOptions = Array.from(secretarias)
      .sort()
      .map((s) => ({ label: s, value: s }));
  }

  onSecretariaChange() {
    this.selectedUnidade = [];
    this.selectedSetor = [];
    this.unidadeOptions = [];
    this.setorOptions = [];

    if (this.selectedSecretaria && this.selectedSecretaria.length > 0) {
      const uniqueUnits = new Map<string, string>(); // code -> name
      this.dotacaoData
        .filter((d) => this.selectedSecretaria.includes(d.secretaria))
        .forEach((d) => uniqueUnits.set(d.cod_unidade, d.unidade));

      this.unidadeOptions = Array.from(uniqueUnits.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([code, name]) => ({ label: name, value: code }));
    }

    this.updateResults();
  }

  onUnidadeChange() {
    this.selectedSetor = [];
    this.setorOptions = [];

    if (this.selectedUnidade && this.selectedUnidade.length > 0) {
      const uniqueSectors = new Map<string, string>(); // code -> name
      this.dotacaoData
        .filter(
          (d) =>
            this.selectedSecretaria.includes(d.secretaria) &&
            this.selectedUnidade.includes(d.cod_unidade),
        )
        .forEach((d) => uniqueSectors.set(d.cod_setor, d.setor));

      this.setorOptions = Array.from(uniqueSectors.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([code, name]) => ({ label: name, value: code }));
    }

    this.updateResults();
  }

  onSetorChange() {
    this.updateResults();
  }

  updateResults() {
    // 1. Filter Dotacao
    this.filteredDotacao = this.dotacaoData.filter((row) => {
      // Logic for Globla Exclusion on Dotacao
      const cargo_admrh = this.normalize(row.cargo_admrh || '');
      if (
        EXCLUDED_VINCULOS.some((excluded) => cargo_admrh.includes(excluded)) ||
        cargo_admrh.includes('inativo')
      ) {
        return false;
      }

      if (
        this.selectedSecretaria?.length &&
        !this.selectedSecretaria.includes(row.secretaria)
      )
        return false;
      if (
        this.selectedUnidade?.length &&
        !this.selectedUnidade.includes(row.cod_unidade)
      )
        return false;
      if (
        this.selectedSetor?.length &&
        !this.selectedSetor.includes(row.cod_setor)
      )
        return false;
      return true;
    });

    // 2. Filter Servidores
    this.filteredServidores = this.dados.filter((serv) => {
      // Global Exclusion
      const vinculo = this.normalize(serv.vinculo || '');
      if (
        EXCLUDED_VINCULOS.some((excluded) => vinculo.includes(excluded)) ||
        vinculo.includes('inativo') // Extra safety
      ) {
        return false;
      }

      const servSec = this.normalize(serv.secretaria);

      if (this.selectedSecretaria?.length) {
        const normalizedSelection = this.selectedSecretaria.map((s) =>
          this.normalize(s),
        );
        if (!normalizedSelection.includes(servSec)) return false;
      }

      if (this.selectedUnidade?.length) {
        if (!this.selectedUnidade.includes(String(serv.cod_unidade).trim()))
          return false;
      }

      if (this.selectedSetor?.length) {
        if (!this.selectedSetor.includes(String(serv.cod_setor).trim()))
          return false;
      }

      return true;
    });

    // 3. Calculate Stats
    this.calculateStats();
  }

  calculateStats() {
    // Reset Stats
    const emptyGroup = () => ({ providos: 0, dotacao: 0, vagas: 0 });
    const stats: DotacaoCardStats = {
      total: emptyGroup(),
      servidores: emptyGroup(),
      colaboradores: emptyGroup(),
      estagiarios: emptyGroup(),
      cj: emptyGroup(),
      fc: emptyGroup(),
    };

    // --- Servidores (Providos) Counting ---
    this.filteredServidores.forEach((s) => {
      const vinculo = this.normalize(s.vinculo || '');
      const func = this.normalize(s.funcao || '');
      // Global exclusions already applied in filter

      // 1. TOTAL PROVIDOS
      // Contar todos os registros sem exclusão (exceto os globais já filtrados)
      stats.total.providos++;

      // 2. ESTAGIÁRIOS
      if (func.includes('estagiario')) {
        stats.estagiarios.providos++;
      }

      // 3. COLABORADORES
      if (vinculo.includes('colaborador')) {
        stats.colaboradores.providos++;
      }

      // 4. SERVIDORES
      // Contar tudo que NÃO tenha "estagiários", "colaboradores", "cj" ou "fc"
      if (
        !func.includes('estagiario') &&
        !vinculo.includes('colaborador') &&
        !func.includes('cj') &&
        !func.includes('fc')
      ) {
        stats.servidores.providos++;
      }

      // 5. CJ
      if (func.includes('cj')) {
        stats.cj.providos++;
      }

      // 6. FC
      if (func.includes('fc')) {
        stats.fc.providos++;
      }
    });

    // --- Dotação Counting ---
    this.filteredDotacao.forEach((d) => {
      const qtd = parseInt(d.cargos_criados, 10) || 0;
      const cargo_admrh = this.normalize(d.cargo_admrh || '');
      const resolucao = d.resolucao;

      const isEstagiario = cargo_admrh.includes('estagiario');
      const isColaborador = cargo_admrh.includes('colaborador');
      const isCJ = cargo_admrh.includes('cj');
      const isFC = cargo_admrh.includes('fc');
      const isServidor = cargo_admrh === 'servidor';

      // 1. ESTAGIÁRIOS
      if (isEstagiario) {
        stats.estagiarios.dotacao += qtd;
      }

      // 2. COLABORADORES
      if (isColaborador) {
        stats.colaboradores.dotacao += qtd;
      }

      // 3. CJ
      if (isCJ) {
        stats.cj.dotacao += qtd;
      }

      // 4. FC
      if (isFC) {
        stats.fc.dotacao += qtd;
      }

      // 5. SERVIDORES
      if (isServidor) {
        stats.servidores.dotacao += qtd;
      }

      // 6. TOTAL
      // Regra: cj + servidor + colaborador + estagiário + fc (somente se resolução for 108)
      if (isCJ || isServidor || isColaborador || isEstagiario) {
        stats.total.dotacao += qtd;
      } else if (isFC && resolucao === '108') {
        stats.total.dotacao += qtd;
      }
    });

    // --- Vagas Calculation ---
    const calcVagas = (group: StatsGroup) => {
      group.vagas = group.dotacao - group.providos;
    };

    calcVagas(stats.total);
    calcVagas(stats.servidores);
    calcVagas(stats.colaboradores);
    calcVagas(stats.estagiarios);
    calcVagas(stats.cj);
    calcVagas(stats.fc);

    this.stats = stats;
  }
}
