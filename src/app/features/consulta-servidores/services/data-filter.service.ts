import { Injectable } from '@angular/core';
import { Servidor } from '../../../services/excel.service';

/**
 * Service responsible for data filtering and string normalization utilities.
 * Centralizes filter logic for better reusability and testability.
 */
@Injectable({
  providedIn: 'root',
})
export class DataFilterService {
  /**
   * Normalizes a string for comparison by:
   * - Converting to uppercase
   * - Removing accents/diacritics
   * - Trimming whitespace
   *
   * @param str - String to normalize
   * @returns Normalized string
   */
  normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase();
  }

  /**
   * Filters data based on hierarchical filter values.
   * Supports cascading filters for secretaria -> unidade -> setor.
   *
   * @param data - Initial dataset
   * @param filterValues - Object containing filter selections
   * @param level - Level to filter up to ('secretaria', 'unidade', or 'setor')
   * @returns Filtered dataset
   */
  getFilteredData(
    data: Servidor[],
    filterValues: { [key: string]: any[] },
    level: 'secretaria' | 'unidade' | 'setor',
  ): Servidor[] {
    let filteredData = data;

    // 1. Filter by Secretaria
    const secretarias = filterValues['secretaria'];
    if (secretarias && secretarias.length > 0) {
      filteredData = filteredData.filter((item) =>
        secretarias.includes(item.secretaria),
      );
    }
    if (level === 'secretaria') return filteredData;

    // 2. Filter by Unidade
    const unidades = filterValues['unidade'];
    if (unidades && unidades.length > 0) {
      filteredData = filteredData.filter((item) =>
        unidades.includes(item.unidade),
      );
    }
    if (level === 'unidade') return filteredData;

    // 3. Filter by Setor
    const setores = filterValues['setor'];
    if (setores && setores.length > 0) {
      filteredData = filteredData.filter((item) =>
        setores.includes(item.setor),
      );
    }
    return filteredData;
  }

  /**
   * Updates unique values for a specific field based on filtered data.
   * Useful for updating dropdown options dynamically as filters change.
   *
   * @param field - Field name to extract unique values for
   * @param data - Dataset to extract values from
   * @returns Sorted array of unique values
   */
  getUniqueValuesFor(field: string, data: Servidor[]): string[] {
    const vals = data
      .map((d) => (d as any)[field])
      .filter((v) => v != null && v !== '');
    return Array.from(new Set(vals)).sort((a, b) => a.localeCompare(b));
  }
}
