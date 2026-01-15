import { SortEvent } from 'primeng/api';

export interface SortEventWithData extends SortEvent {
  data: any[];
}

export interface Column {
  field: string;
  header: string;
}

export interface ExportColumn {
  title: string;
  dataKey: string;
}

export interface TlpRow {
  grau: string;
  tipo: string;
  dsc_unidade: string;
  uf: string;
  municipio: number;
  lp: number;
  lr_efet: number;
  lr_i: number;
  lr_sv: number;
  cj_1g_1: number;
  cj_2g_1: number;
  cj_2g_2: number;
  cj_2g_3: number;
  cj_2g_4: number;
  cj_2g_5: number;
  cj_2g_6: number;
  cj_2g_7: number;
  fc_1g_1: number;
  fc_1g_2: number;
  fc_2g_1: number;
  fc_2g_2: number;
  fc_2g_3: number;
  fc_2g_4: number;
  fc_2g_5: number;
  fc_2g_6: number;
}

export interface ApoioCount {
  label: string;
  count: number;
}

export interface VinculoGroup {
  category: string;
  total: number;
  items: { label: string; count: number }[];
}

export interface AreaVinculoStat {
  areaName: string;
  groups: { category: string; count: number }[];
}

export interface CalculoResolucao {
  label: string;
  value: any;
  desc?: string;
  bgColor?: string;
  textColor?: string;
}
