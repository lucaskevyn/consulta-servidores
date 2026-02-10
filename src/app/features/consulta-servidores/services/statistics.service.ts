import { Injectable } from '@angular/core';
import { Servidor } from '../../../services/excel.service';
import {
  AreaCargoStat,
  AreaVinculoStat,
} from '../models/consulta-servidores.models';
import {
  AREAS,
  EXCLUDED_KEYWORDS,
  VINCULO_GROUPS,
  FUNCTION_GROUPS,
} from '../constants/consulta-servidores.constants';

/**
 * Service responsible for calculating statistics from server data.
 * Extracts business logic from components for better testability and reusability.
 */
@Injectable({
  providedIn: 'root',
})
export class StatisticsService {
  /**
   * Calculates area-based statistics for server distribution by vinculo (bond type).
   *
   * @param dados - Array of server data
   * @param allowedVinculos - List of allowed vinculo types
   * @returns Array of statistics per area (Administrativa, 1º Grau, 2º Grau, TOTAIS)
   */
  calculateAreaVinculoStats(
    dados: Servidor[],
    allowedVinculos: string[],
  ): AreaVinculoStat[] {
    const areas = [
      AREAS.ADMINISTRATIVA,
      AREAS.PRIMEIRO_GRAU,
      AREAS.SEGUNDO_GRAU,
    ];

    const groupsDefinition = VINCULO_GROUPS;

    const calculateStatsForData = (
      dataSubset: Servidor[],
      name: string,
    ): AreaVinculoStat => {
      const groups = groupsDefinition.map((group) => {
        let groupTotal = 0;
        const items = group.matchers.map((matcher) => {
          const count = dataSubset.filter((d) => {
            const v = (d.vinculo || '').toLowerCase().trim();
            return v === matcher;
          }).length;
          groupTotal += count;
          return { label: matcher, count };
        });

        return {
          category: group.category,
          total: groupTotal,
          items: items,
        };
      });

      return {
        areaName: name,
        totalServidores: dataSubset.length,
        groups,
      };
    };

    const isExcluded = (apoio: string): boolean => {
      const a = apoio.toLowerCase();
      return a.includes('esjud') || a.includes('tecnologia');
    };

    const isAllowedVinculo = (vinculo: string): boolean => {
      return allowedVinculos.includes(vinculo.toLowerCase().trim());
    };

    // Calculate stats for each area
    const areaStats = areas.map((areaRef) => {
      const subset = dados.filter((d) => {
        const a = (d.apoio || '').toLowerCase();
        const v = (d.vinculo || '').toLowerCase().trim();

        if (!a.includes(areaRef.search)) return false;
        if (isExcluded(a)) return false;
        if (!isAllowedVinculo(v)) return false;

        return true;
      });
      return calculateStatsForData(subset, areaRef.label);
    });

    // Calculate TOTAIS column
    const totalSubset = dados.filter((d) => {
      const a = (d.apoio || '').toLowerCase();
      const v = (d.vinculo || '').toLowerCase().trim();

      const inAreas = areas.some((areaRef) => a.includes(areaRef.search));

      if (!inAreas) return false;
      if (isExcluded(a)) return false;
      if (!isAllowedVinculo(v)) return false;

      return true;
    });

    const totalStats = calculateStatsForData(totalSubset, 'TOTAIS');

    return [...areaStats, totalStats];
  }

  /**
   * Calculates area-based statistics for positions and functions (cargos e funções).
   *
   * @param dados - Array of server data
   * @param references - Reference data for functions with their values
   * @returns Array of statistics per area including monetary values
   */
  calculateAreaCargoStats(
    dados: Servidor[],
    references: any[],
  ): AreaCargoStat[] {
    const areas = [
      AREAS.ADMINISTRATIVA,
      AREAS.PRIMEIRO_GRAU,
      AREAS.SEGUNDO_GRAU,
    ];

    const isExcluded = (apoio: string): boolean => {
      const a = apoio.toLowerCase();
      return a.includes('esjud') || a.includes('tecnologia');
    };

    const calculateStatsForData = (
      dataSubset: Servidor[],
      name: string,
    ): AreaCargoStat => {
      const groupsDefinition = FUNCTION_GROUPS;

      const counts: { label: string; count: number }[] = [];

      const groups = groupsDefinition.map((group) => {
        let groupTotalValue = 0;
        let groupCount = 0;
        const itemsMap = new Map<string, { count: number; value: number }>();

        references
          .filter((ref) => ref.funcao.startsWith(group.prefix))
          .forEach((ref) => {
            const count = dataSubset.filter((d) =>
              (d.funcao || '').toUpperCase().includes(ref.funcao.toUpperCase()),
            ).length;

            if (count > 0) {
              const total = count * ref.valor;
              groupTotalValue += total;
              groupCount += count;
              itemsMap.set(ref.funcao, { count, value: total });
            }
          });

        counts.push({ label: group.category, count: groupCount });

        const items = Array.from(itemsMap.entries())
          .map(([label, data]) => ({
            label,
            count: data.count,
            value: data.value,
          }))
          .sort((a, b) => a.label.localeCompare(b.label));

        return {
          category: group.category,
          totalValue: groupTotalValue,
          items,
        };
      });

      const totalAreaValue = groups.reduce((acc, g) => acc + g.totalValue, 0);

      return {
        areaName: name,
        totalValue: totalAreaValue,
        counts,
        groups,
      };
    };

    // Calculate for each area
    const areaStats = areas.map((areaRef) => {
      const subset = dados.filter((d) => {
        const a = (d.apoio || '').toLowerCase();
        if (!a.includes(areaRef.search)) return false;
        if (isExcluded(a)) return false;
        return true;
      });
      return calculateStatsForData(subset, areaRef.label);
    });

    // Calculate TOTAIS
    const totalSubset = dados.filter((d) => {
      const a = (d.apoio || '').toLowerCase();
      const inAreas = areas.some((areaRef) => a.includes(areaRef.search));
      if (!inAreas) return false;
      if (isExcluded(a)) return false;
      return true;
    });

    const totalStats = calculateStatsForData(totalSubset, 'TOTAIS');

    return [...areaStats, totalStats];
  }
}
