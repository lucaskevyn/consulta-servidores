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
import { ButtonModule } from 'primeng/button';

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

interface DotacaoTableData {
  unidade: string;
  cod_unidade: string;
  cod_secretaria: string;
  secretaria: string;
  cod_setor: string;
  setor: string;
  desc_cargo: string;
  nom_especifico_fc: string;
  quant_cargo: number;
  cod_cargo: string;
  lotacao: number;
  nome: string;
  vaga: number;
  lotacao_origem: string;
  setor_servidor: string;
  detalhes_ocupantes: Array<{ nome: string; origin: string; sector: string }>;
  resolucao: string;
  desc_aldenice: string;
  apoio: string;
  conta_dotacao: string;
}

interface StatsGroup {
  providos: number;
  origem: number;
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
  oficiais_justica: StatsGroup;
  cjDetails: { [key: string]: StatsGroup };
  fcDetails: { [key: string]: StatsGroup };
}

const EXCLUDED_VINCULOS = [
  'inativos',
  'pensao alimento',
  'pensionista',
  'policial militar',
  'residente tecnologico',
  'voluntarios',
  'diversos (requisitados reg prev rgps)',
  'diversos (requisitados reg prev rpps)',
  'a disposicao fprev',
  'a disposicao fps',
];

@Component({
  selector: 'app-tab-dotacao',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MultiSelectModule,
    TableModule,
    CardComponent,
    ButtonModule,
  ],
  templateUrl: './tab-dotacao.component.html',
})
export class TabDotacaoComponent implements OnChanges {
  @ViewChild('dt') dt?: any;
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
  dotacaoTableData: DotacaoTableData[] = [];

  // Stats
  stats: DotacaoCardStats = {
    total: { providos: 0, origem: 0, dotacao: 0, vagas: 0 },
    servidores: { providos: 0, origem: 0, dotacao: 0, vagas: 0 },
    colaboradores: { providos: 0, origem: 0, dotacao: 0, vagas: 0 },
    estagiarios: { providos: 0, origem: 0, dotacao: 0, vagas: 0 },
    cj: { providos: 0, origem: 0, dotacao: 0, vagas: 0 },
    fc: { providos: 0, origem: 0, dotacao: 0, vagas: 0 },
    oficiais_justica: { providos: 0, origem: 0, dotacao: 0, vagas: 0 },
    cjDetails: {},
    fcDetails: {},
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

  getObjectKeys(obj: any): string[] {
    return Object.keys(obj || {}).sort();
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
      // Ignore completely empty rows from JSON
      if (!row.unidade && !row.cargo_admrh && !row.cargos_criados) return false;

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

    // 3. Generate Dotacao Table Data
    this.generateDotacaoTableData();

    // 4. Calculate Stats
    this.calculateStats();
  }

  generateDotacaoTableData() {
    this.dotacaoTableData = this.filteredDotacao.map((row) => {
      const matchPeople = this.dados.filter((s) => {
        // Global Exclusion Check for people (mirroring updateResults logic)
        const vinculo = this.normalize(s.vinculo || '');
        if (
          EXCLUDED_VINCULOS.some((excluded) => vinculo.includes(excluded)) ||
          vinculo.includes('inativo')
        ) {
          return false;
        }

        const sCodOrigem = String(s.cod_lotacao_origem || '').trim();
        const rowCodSetor = String(row.cod_setor).trim();
        const rowCodUnidade = String(row.cod_unidade).trim();

        if (sCodOrigem) {
          // Priority: Match by origin location code
          if (sCodOrigem !== rowCodSetor) return false;
        } else {
          // Fallback: Match by current unit and sector
          if (String(s.cod_unidade).trim() !== rowCodUnidade) return false;
          if (String(s.cod_setor).trim() !== rowCodSetor) return false;
        }

        const sFuncao = this.normalize(s.funcao || '');
        const sCargo = this.normalize(s.cargo || '');
        const sVinculo = this.normalize(s.vinculo || '');
        const cargoAdmrh = this.normalize(row.cargo_admrh || '');

        if (cargoAdmrh.includes('cj') || cargoAdmrh.includes('fc')) {
          return sFuncao.includes(cargoAdmrh);
        }
        if (cargoAdmrh === 'estagiario') {
          return sFuncao.includes('estagiario');
        }
        if (cargoAdmrh === 'oficial de justica') {
          return sCargo.includes('oficial de justica');
        }
        if (cargoAdmrh === 'colaborador') {
          return sVinculo.includes('colaborador');
        }

        const isExclType =
          sFuncao.includes('cj') ||
          sFuncao.includes('fc') ||
          sFuncao.includes('estagiario') ||
          sCargo.includes('oficial de justica') ||
          sVinculo.includes('colaborador');

        if (cargoAdmrh.startsWith('servidor - ')) {
          const specialty = cargoAdmrh.replace('servidor - ', '');
          const sAreaAtuacao = this.normalize(s.area_atuacao || '');
          return !isExclType && sAreaAtuacao.includes(specialty);
        }

        if (cargoAdmrh === 'servidor') {
          return !isExclType;
        }
        return false;
      });

      const detalhes_ocupantes = matchPeople.map((p) => ({
        nome: p.nome,
        origin: p.lotacao_origem || '',
        sector: p.setor || '',
      }));

      const names = detalhes_ocupantes.map((o) => o.nome).join('\n');
      const origins = detalhes_ocupantes.map((o) => o.origin).join('\n');
      const setoresServidor = detalhes_ocupantes.map((o) => o.sector).join('\n');

      // Extrair "ocupante de função de"
      let nomEspecificoFc = '';
      const regex = /ocupante(?:s)? de função de ([^;.]+)/i;
      const match = row.desc_aldenice.match(regex);
      if (match) {
        nomEspecificoFc = match[1].trim();
      }

      const quant_cargo = parseInt(row.cargos_criados, 10) || 0;
      const lotacao = matchPeople.length;

      return {
        unidade: row.unidade,
        cod_unidade: row.cod_unidade,
        cod_secretaria: row.cod_secretaria,
        secretaria: row.secretaria,
        cod_setor: row.cod_setor,
        setor: row.setor,
        desc_cargo: row.desc_admrh,
        nom_especifico_fc: nomEspecificoFc,
        quant_cargo: quant_cargo,
        cod_cargo: row.cargo_admrh,
        lotacao: lotacao,
        nome: names,
        vaga: quant_cargo - lotacao,
        lotacao_origem: origins,
        setor_servidor: setoresServidor,
        detalhes_ocupantes: detalhes_ocupantes,
        resolucao: row.resolucao,
        desc_aldenice: row.desc_aldenice,
        apoio: row.apoio,
        conta_dotacao: row.conta_dotacao,
      };
    });
  }

  calculateStats() {
    // 0. Preparar nomes para match de origem
    const targetNames = new Set<string>();
    this.filteredDotacao.forEach((d) => {
      targetNames.add(this.normalize(d.unidade));
      targetNames.add(this.normalize(d.setor));
    });

    const isMatchOrigem = (s: Servidor) => {
      const orig = this.normalize(s.lotacao_origem);
      return targetNames.has(orig);
    };

    // Reset Stats
    const emptyGroup = () => ({ providos: 0, origem: 0, dotacao: 0, vagas: 0 });
    const stats: DotacaoCardStats = {
      total: emptyGroup(),
      servidores: emptyGroup(),
      colaboradores: emptyGroup(),
      estagiarios: emptyGroup(),
      cj: emptyGroup(),
      fc: emptyGroup(),
      oficiais_justica: emptyGroup(),
      cjDetails: {},
      fcDetails: {},
    };

    // --- Servidores (Origem) Counting ---
    // Precisamos contar todos os servidores cujo lotacao_origem bate com os filtros,
    // indepentende de onde estão lotados agora (mas respeitando as exclusões globais).
    this.dados.forEach((s) => {
      // Global Exclusion
      const vinculo = this.normalize(s.vinculo || '');
      if (
        EXCLUDED_VINCULOS.some((excluded) => vinculo.includes(excluded)) ||
        vinculo.includes('inativo')
      ) {
        return;
      }

      if (!isMatchOrigem(s)) return;

      const func = this.normalize(s.funcao || '');
      const isOficialOrigem =
        s.cargo && this.normalize(s.cargo).includes('oficial de justica');

      // 1. TOTAL ORIGEM
      stats.total.origem++;

      // 2. ESTAGIÁRIOS
      if (func.includes('estagiario')) {
        stats.estagiarios.origem++;
      }

      // 3. COLABORADORES
      if (vinculo.includes('colaborador')) {
        stats.colaboradores.origem++;
      }

      // 4. SERVIDORES
      if (
        !func.includes('estagiario') &&
        !vinculo.includes('colaborador') &&
        !func.includes('cj') &&
        !func.includes('fc') &&
        !isOficialOrigem
      ) {
        stats.servidores.origem++;
      }

      // 5. CJ
      if (func.includes('cj')) {
        stats.cj.origem++;
        if (!stats.cjDetails[func]) stats.cjDetails[func] = emptyGroup();
        stats.cjDetails[func].origem++;
      }

      // 6. FC
      if (func.includes('fc')) {
        stats.fc.origem++;
        if (!stats.fcDetails[func]) stats.fcDetails[func] = emptyGroup();
        stats.fcDetails[func].origem++;
      }

      // 7. OFICIAL DE JUSTIÇA
      if (isOficialOrigem) {
        stats.oficiais_justica.origem++;
      }
    });

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
      // Contar tudo que NÃO tenha "estagiários", "colaboradores", "cj", "fc" ou "oficial de justiça"
      const isOficialProvido =
        s.cargo && this.normalize(s.cargo).includes('oficial de justica');

      if (
        !func.includes('estagiario') &&
        !vinculo.includes('colaborador') &&
        !func.includes('cj') &&
        !func.includes('fc') &&
        !isOficialProvido
      ) {
        stats.servidores.providos++;
      }

      // 5. CJ
      if (func.includes('cj')) {
        stats.cj.providos++;
        if (!stats.cjDetails[func]) stats.cjDetails[func] = emptyGroup();
        stats.cjDetails[func].providos++;
      }

      // 6. FC
      if (func.includes('fc')) {
        stats.fc.providos++;
        if (!stats.fcDetails[func]) stats.fcDetails[func] = emptyGroup();
        stats.fcDetails[func].providos++;
      }

      // 7. OFICIAL DE JUSTIÇA
      if (isOficialProvido) {
        stats.oficiais_justica.providos++;
      }
    });

    // --- Dotação Counting ---
    this.filteredDotacao.forEach((d) => {
      const qtd = parseInt(d.cargos_criados, 10) || 0;
      const cargo_admrh = this.normalize(d.cargo_admrh || '');
      const desc_admrh = this.normalize(d.desc_admrh || '');
      const resolucao = d.resolucao;

      const isEstagiario = cargo_admrh.includes('estagiario');
      const isColaborador = cargo_admrh.includes('colaborador');
      const isCJ = cargo_admrh.includes('cj');
      const isFC = cargo_admrh.includes('fc');
      const isServidor = cargo_admrh === 'servidor';
      const isServidorEspecialidade = cargo_admrh.startsWith('servidor - ');
      const isOficial = cargo_admrh === 'oficial de justica';

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
        if (!stats.cjDetails[desc_admrh])
          stats.cjDetails[desc_admrh] = emptyGroup();
        stats.cjDetails[desc_admrh].dotacao += qtd;
      }

      // 4. FC
      if (isFC) {
        stats.fc.dotacao += qtd;
        if (!stats.fcDetails[desc_admrh])
          stats.fcDetails[desc_admrh] = emptyGroup();
        stats.fcDetails[desc_admrh].dotacao += qtd;
      }

      // 5. SERVIDORES
      if (isServidor || isServidorEspecialidade) {
        stats.servidores.dotacao += qtd;
      }

      // 6. OFICIAL DE JUSTIÇA
      if (isOficial) {
        stats.oficiais_justica.dotacao += qtd;
      }

      // 7. TOTAL
      // Regra: cj + servidor + servidorEspecialidade + colaborador + estagiário + oficial + fc (somente se resolução for 108)
      if (
        isCJ ||
        isServidor ||
        isServidorEspecialidade ||
        isColaborador ||
        isEstagiario ||
        isOficial
      ) {
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
    calcVagas(stats.oficiais_justica);

    Object.values(stats.cjDetails).forEach(calcVagas);
    Object.values(stats.fcDetails).forEach(calcVagas);

    this.stats = stats;
  }
}
