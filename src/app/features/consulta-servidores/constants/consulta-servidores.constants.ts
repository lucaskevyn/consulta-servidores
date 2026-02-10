/**
 * Constants and configurations for the Consulta Servidores feature.
 * Centralizes magic strings, area definitions, and other configuration values.
 */

/** Area definitions for filtering and categorization */
export const AREAS = {
  ADMINISTRATIVA: {
    id: 'adm',
    label: 'ÁREA ADMINISTRATIVA',
    search: 'área administrativa do tjac',
  },
  PRIMEIRO_GRAU: {
    id: '1g',
    label: '1º GRAU',
    search: 'área judiciária de 1º grau',
  },
  SEGUNDO_GRAU: {
    id: '2g',
    label: '2º GRAU',
    search: 'área judiciária de 2º grau',
  },
  TOTAIS: {
    id: 'totais',
    label: 'TOTAIS',
    search: '',
  },
} as const;

/** Excluded areas from calculations */
export const EXCLUDED_KEYWORDS = ['esjud', 'tecnologia'] as const;

/** Vinculo (bond type) categories and their matchers */
export const VINCULO_GROUPS = [
  {
    category: 'Efetivos',
    matchers: [
      'efetivo não comissionado',
      'efetivo comissionado (resolução 03/2013)',
      'transitório não comissionado',
    ],
  },
  {
    category: 'Requisitados',
    matchers: [
      'à disposição fprev',
      'à disposição fps',
      'comissionado (à disposição)',
      'diversos (requisitados reg prev rgps)',
      'diversos (requisitados reg prev rpps)',
    ],
  },
  {
    category: 'Comissionado s/ Vínculo',
    matchers: ['ad nutum comissionado'],
  },
] as const;

/** Function/Position type groups */
export const FUNCTION_GROUPS = [
  { category: 'CJ', prefix: 'CJ' },
  { category: 'FC', prefix: 'FC' },
] as const;

/** Allowed vinculo types for filtering */
export const ALLOWED_VINCULOS = [
  'à disposição fprev',
  'à disposição fps',
  'ad nutum comissionado',
  'comissionado (à disposição)',
  'diversos (requisitados reg prev rgps)',
  'diversos (requisitados reg prev rpps)',
  'efetivo comissionado (resolução 03/2013)',
  'efetivo não comissionado',
  'transitório não comissionado',
] as const;

/** Prêmio CNJ thresholds */
export const PREMIO_THRESHOLDS = {
  MAX_POINTS: 70,
  APOIO_INDIRETO_PERCENTAGE_LIMIT: 0.3,
  PRIMEIRO_GRAU_PERCENTAGE_TARGET: 0.7,
  POINTS_PER_ITEM: 15,
} as const;

/** Resolução CNJ 219/2016 thresholds */
export const RESOLUCAO_THRESHOLDS = {
  PRIMEIRO_GRAU_PERCENTAGE: 0.915, // 91.5%
  SEGUNDO_GRAU_PERCENTAGE: 0.085, // 8.5%
} as const;
