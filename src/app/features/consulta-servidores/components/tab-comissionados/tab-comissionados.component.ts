import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabGeralComponent } from '../tab-geral/tab-geral.component';
import { CardModule } from 'primeng/card';
import { Column } from '../../models/consulta-servidores.models';
import { SortEvent } from 'primeng/api';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-tab-comissionados',
  standalone: true,
  imports: [CommonModule, TabGeralComponent, CardModule, DividerModule],
  templateUrl: './tab-comissionados.component.html',
})
export class TabComissionadosComponent {
  @ViewChild(TabGeralComponent) tabGeral?: TabGeralComponent;

  @Input() comissionadosData: any[] = [];
  @Input() cols: Column[] = [];
  @Input() uniqueValues: { [key: string]: any[] } = {};
  @Input() filterValues: { [key: string]: any[] } = {};
  @Input() inputPt: any;
  @Input() multiselectPt: any;

  @Input() stats: {
    numerator: number; // Ad nutum + Comissionado à disposição
    denominator: number; // A + Efetivo comissionado
    percentage: number;
    countAdNutum: number;
    countComissionadoDisp: number;
    countEfetivoComissionado: number;
  } = {
    numerator: 0,
    denominator: 0,
    percentage: 0,
    countAdNutum: 0,
    countComissionadoDisp: 0,
    countEfetivoComissionado: 0,
  };

  @Output() sortRequest = new EventEmitter<{ event: SortEvent; key: string }>();
  @Output() exportRequest = new EventEmitter<void>();
  @Output() secretariaChange = new EventEmitter<string[]>();
  @Output() unidadeChange = new EventEmitter<string[]>();
  @Output() setorChange = new EventEmitter<string[]>();
  @Output() clearFiltersRequest = new EventEmitter<void>();

  // Forwarding events from TabGeral
  onSortRequest(event: { event: SortEvent; key: string }) {
    this.sortRequest.emit(event);
  }

  onExportRequest() {
    this.exportRequest.emit();
  }
}
