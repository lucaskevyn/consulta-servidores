import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { SortEvent } from 'primeng/api';
import { Column } from '../../models/consulta-servidores.models';

@Component({
  selector: 'app-tab-cargos-funcoes',
  standalone: true,
  imports: [CommonModule, TableModule, Button],
  templateUrl: './tab-cargos-funcoes.component.html',
  styleUrls: ['./tab-cargos-funcoes.component.css'],
})
export class TabCargosFuncoesComponent {
  @Input() functionCounts: { label: string; count: number }[] = [];
  @Input() cargosData: any[] = [];
  @Input() cargosCols: Column[] = [];

  @ViewChild('dt2') dt2!: Table;

  @Output() sortRequest = new EventEmitter<{ event: SortEvent; key: string }>();
  @Output() exportRequest = new EventEmitter<void>();

  onCustomSort(event: SortEvent) {
    this.sortRequest.emit({ event, key: 'cargos' });
  }

  onExport() {
    this.exportRequest.emit();
  }
}
