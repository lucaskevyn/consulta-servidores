import { Injectable } from '@angular/core';
import {
  AreaCargoStat,
  AreaVinculoStat,
} from '../models/consulta-servidores.models';

/**
 * Service responsible for building export data structures for Excel files.
 * Centralizes export formatting logic for better maintainability.
 */
@Injectable({
  providedIn: 'root',
})
export class ExportBuilderService {
  /**
   * Builds export header rows for Cargos e Funções tab.
   * Includes area-based statistics with monetary values and function details.
   */
  buildCargosExport(areaCargoStats: AreaCargoStat[]): any[][] {
    const headerRows: any[][] = [];
    headerRows.push(['Estatísticas de Cargos e Funções por Área']);

    areaCargoStats.forEach((area) => {
      headerRows.push(['Área', area.areaName]);
      headerRows.push(['  Valor Total da Área', area.totalValue]);

      // Summary counts for CJ and FC
      area.counts.forEach((c) => {
        headerRows.push([`  Total de ${c.label}`, c.count]);
      });

      // Detailed groups
      area.groups.forEach((group) => {
        headerRows.push([`  Detalhes ${group.category}`, group.totalValue]);
        group.items.forEach((item) => {
          headerRows.push([
            `    ${item.label}`,
            `${item.count} un.`,
            item.value,
          ]);
        });
      });
      headerRows.push(['']); // Spacer
    });

    headerRows.push(['Tabela Detalhada de Cargos']);
    return headerRows;
  }

  /**
   * Builds export header rows for Servidores tab.
   * Includes hierarchical area and vinculo statistics.
   */
  buildServidoresExport(areaVinculoStats: AreaVinculoStat[]): any[][] {
    const headerRows: any[][] = [];
    headerRows.push(['Distribuição de Servidores']);

    areaVinculoStats.forEach((area) => {
      headerRows.push(['Area', area.areaName]);
      headerRows.push(['Total', area.totalServidores]);

      area.groups.forEach((group) => {
        headerRows.push(['  Categoria', group.category, group.total]);
        group.items.forEach((item) => {
          headerRows.push(['    Item', item.label, item.count]);
        });
      });
      headerRows.push(['']); // Spacer
    });

    return headerRows;
  }

  /**
   * Builds export header rows for Comissionados tab.
   */
  buildComissionadosExport(stats: any): any[][] {
    return [
      ['Estatísticas de Comissionados'],
      ['Não Efetivos (Numerador)', stats.numerator],
      [' - Ad Nutum', stats.countAdNutum],
      [' - À Disposição', stats.countFp],
      [' - Comissionado (À Disposição)', stats.countComissionadoDisp],
      ['Efetivo Comissionado', stats.countEfetivoComissionado],
      ['Total (Denominador)', stats.denominator],
      ['Percentual', stats.percentage],
      [],
      ['Tabela de Comissionados'],
    ];
  }

  /**
   * Builds export header rows for Dotação tab.
   */
  buildDotacaoExport(stats: any): any[][] {
    const headerRows: any[][] = [];

    if (stats) {
      const s = stats;
      headerRows.push(
        ['Estatísticas de Dotação'],
        ['Categoria', 'Providos', 'Dotação', 'Vagas'],
        ['Total', s.total.providos, s.total.dotacao, s.total.vagas],
        [
          'Servidores',
          s.servidores.providos,
          s.servidores.dotacao,
          s.servidores.vagas,
        ],
        [
          'Colaboradores',
          s.colaboradores.providos,
          s.colaboradores.dotacao,
          s.colaboradores.vagas,
        ],
        [
          'Estagiários',
          s.estagiarios.providos,
          s.estagiarios.dotacao,
          s.estagiarios.vagas,
        ],
        [
          'Oficiais de Justiça',
          s.oficiais_justica.providos,
          s.oficiais_justica.dotacao,
          s.oficiais_justica.vagas,
        ],
        ['Com CJ', s.cj.providos, s.cj.dotacao, s.cj.vagas],
        ['Com FC', s.fc.providos, s.fc.dotacao, s.fc.vagas],
        [''],
        ['Detalhamento de CJ'],
        ['Função', 'Providos', 'Dotação', 'Vagas'],
      );

      Object.keys(s.cjDetails || {})
        .sort()
        .forEach((key) => {
          const item = s.cjDetails[key];
          headerRows.push([key, item.providos, item.dotacao, item.vagas]);
        });

      headerRows.push(
        [''],
        ['Detalhamento de FC'],
        ['Função', 'Providos', 'Dotação', 'Vagas'],
      );

      Object.keys(s.fcDetails || {})
        .sort()
        .forEach((key) => {
          const item = s.fcDetails[key];
          headerRows.push([key, item.providos, item.dotacao, item.vagas]);
        });

      headerRows.push([''], ['Tabela de Dotação Detalhada']);
    }

    return headerRows;
  }

  /**
   * Builds export header rows for Cálculos tab.
   */
  buildCalculosExport(calculosResolucao: any[]): any[][] {
    const headerRows: any[][] = [];
    headerRows.push(['Cálculos da Distribuição (Resolução CNJ 219/2016)']);

    calculosResolucao.forEach((item) => {
      headerRows.push([item.label, item.value, item.desc]);
    });

    return headerRows;
  }

  /**
   * Builds export header rows for Prêmio de Qualidade tab.
   */
  buildPremioExport(totalPontos: number, situacaoPremio: any[]): any[][] {
    const headerRows: any[][] = [];
    headerRows.push(
      ['Prêmio CNJ de Qualidade'],
      ['Pontos Obtidos', totalPontos],
      ['Máximo', 70],
      ['Percentual', totalPontos / 70],
      [''],
    );

    situacaoPremio.forEach((item) => {
      headerRows.push([item.label, item.value, item.desc]);
    });

    return headerRows;
  }

  /**
   * Builds simple header row for tabs that only need a title.
   */
  buildSimpleHeader(title: string): any[][] {
    return [[title]];
  }
}
