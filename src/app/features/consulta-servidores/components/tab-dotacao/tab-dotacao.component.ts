import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { TableModule } from 'primeng/table';
import { Servidor } from '../../../../services/excel.service';

interface DotacaoRow {
  Resolução: string;
  Secretaria: string;
  Unidade: string;
  Setor: string;
  'Cargos Criados': string;
  Descrição: string;
}

interface DotacaoCardStats {
  servidoresSemEstagiario: number;
  cargosSemEstagiario: number;
  servidoresCJ: number;
  cargosCJ: number;
  servidoresFC: number;
  cargosFC: number;
  servidoresEstagiario: number;
  cargosEstagiario: number;
}

@Component({
  selector: 'app-tab-dotacao',
  standalone: true,
  imports: [CommonModule, FormsModule, MultiSelectModule, TableModule],
  templateUrl: './tab-dotacao.component.html',
})
export class TabDotacaoComponent implements OnChanges {
  @Input() dados: Servidor[] = [];
  @Input() dotacaoData: DotacaoRow[] = [];

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
    servidoresSemEstagiario: 0,
    cargosSemEstagiario: 0,
    servidoresCJ: 0,
    cargosCJ: 0,
    servidoresFC: 0,
    cargosFC: 0,
    servidoresEstagiario: 0,
    cargosEstagiario: 0,
  };

  cols = [
    { field: 'matricula', header: 'Matrícula' },
    { field: 'nome', header: 'Nome' },
    { field: 'secretaria', header: 'Secretaria' },
    { field: 'unidade', header: 'Unidade' },
    { field: 'setor', header: 'Setor' },
    { field: 'cargo', header: 'Cargo' },
    { field: 'funcao', header: 'Função' },
    { field: 'vinculo', header: 'Vínculo' },
  ];

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
    const secretarias = new Set(this.dotacaoData.map((d) => d.Secretaria));
    this.secretariaOptions = Array.from(secretarias)
      .sort()
      .map((s) => ({ label: s, value: s }));
  }

  onSecretariaChange() {
    // When secretariat changes, we might need to filter selected units if they don't belong to the new set of secretarias?
    // Or just clear them? Usually safer to clear dependent children or re-validate them.
    // Let's clear for simplicity to ensure consistency.
    this.selectedUnidade = [];
    this.selectedSetor = [];
    this.unidadeOptions = [];
    this.setorOptions = [];

    if (this.selectedSecretaria && this.selectedSecretaria.length > 0) {
      // Get all units that belong to ANY of the selected secretarias
      const unidades = new Set(
        this.dotacaoData
          .filter((d) => this.selectedSecretaria.includes(d.Secretaria))
          .map((d) => d.Unidade),
      );
      this.unidadeOptions = Array.from(unidades)
        .sort()
        .map((u) => ({ label: u, value: u }));
    }

    this.updateResults();
  }

  onUnidadeChange() {
    this.selectedSetor = [];
    this.setorOptions = [];

    if (this.selectedUnidade && this.selectedUnidade.length > 0) {
      // Logic: It must be in one of the selected Secretarias AND one of the selected Unidades.
      // But practically, if we follow the flow, checking Units is enough since Units are filtered by Secretarias.
      // However, to be strict:
      const setores = new Set(
        this.dotacaoData
          .filter(
            (d) =>
              this.selectedSecretaria.includes(d.Secretaria) &&
              this.selectedUnidade.includes(d.Unidade),
          )
          .map((d) => d.Setor),
      );
      this.setorOptions = Array.from(setores)
        .sort()
        .map((s) => ({ label: s, value: s }));
    }

    this.updateResults();
  }

  onSetorChange() {
    this.updateResults();
  }

  updateResults() {
    // 1. Filter Dotacao
    this.filteredDotacao = this.dotacaoData.filter((row) => {
      let match = true;
      if (
        this.selectedSecretaria &&
        this.selectedSecretaria.length > 0 &&
        !this.selectedSecretaria.includes(row.Secretaria)
      )
        match = false;

      if (
        this.selectedUnidade &&
        this.selectedUnidade.length > 0 &&
        !this.selectedUnidade.includes(row.Unidade)
      )
        match = false;

      if (
        this.selectedSetor &&
        this.selectedSetor.length > 0 &&
        !this.selectedSetor.includes(row.Setor)
      )
        match = false;
      return match;
    });

    // 2. Filter Servidores
    this.filteredServidores = this.dados.filter((serv) => {
      let match = true;

      const servSec = this.normalize(serv.secretaria);
      const servUni = this.normalize(serv.unidade);
      const servSet = this.normalize(serv.setor);

      // Normalize selected values for comparison
      // We can pre-normalize selected arrays for performance, but array size is small.
      if (this.selectedSecretaria && this.selectedSecretaria.length > 0) {
        const normalizedSelection = this.selectedSecretaria.map((s) =>
          this.normalize(s),
        );
        if (!normalizedSelection.includes(servSec)) match = false;
      }

      if (this.selectedUnidade && this.selectedUnidade.length > 0) {
        const normalizedSelection = this.selectedUnidade.map((u) =>
          this.normalize(u),
        );
        if (!normalizedSelection.includes(servUni)) match = false;
      }

      if (this.selectedSetor && this.selectedSetor.length > 0) {
        const normalizedSelection = this.selectedSetor.map((s) =>
          this.normalize(s),
        );
        if (!normalizedSelection.includes(servSet)) match = false;
      }

      return match;
    });

    // 3. Calculate Stats
    this.calculateStats();
  }

  calculateStats() {
    // Initialize
    let s_semEstagiario = 0;
    let s_cj = 0;
    let s_fc = 0;
    let s_estagiario = 0;

    let c_semEstagiario = 0;
    let c_cj = 0;
    let c_fc = 0;
    let c_estagiario = 0;

    // Servidores Stats
    this.filteredServidores.forEach((s) => {
      const func = this.normalize(s.funcao || '');
      // const vinculo = this.normalize(s.vinculo || ''); // If needed

      // Estagiário check
      if (func.includes('estagiário') || func.includes('estagiario')) {
        s_estagiario++;
      } else {
        s_semEstagiario++;
      }

      if (func.includes('cj')) s_cj++;
      if (func.includes('fc')) s_fc++;
    });

    // Cargos Criados (Dotacao) Stats
    this.filteredDotacao.forEach((d) => {
      const qtd = parseInt(d['Cargos Criados'], 10) || 0;
      const desc = this.normalize(d.Descrição);

      if (desc.includes('estagiário') || desc.includes('estagiario')) {
        c_estagiario += qtd;
      } else {
        c_semEstagiario += qtd;
      }

      if (desc.includes('cj')) c_cj += qtd;
      if (desc.includes('fc')) c_fc += qtd;
    });

    this.stats = {
      servidoresSemEstagiario: s_semEstagiario,
      cargosSemEstagiario: c_semEstagiario,
      servidoresCJ: s_cj,
      cargosCJ: c_cj,
      servidoresFC: s_fc,
      cargosFC: c_fc,
      servidoresEstagiario: s_estagiario,
      cargosEstagiario: c_estagiario,
    };
  }
}
