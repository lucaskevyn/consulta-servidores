import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Table, TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';
import { SortEvent } from 'primeng/api';
import { Column, TlpRow } from '../../models/consulta-servidores.models';

@Component({
  selector: 'app-tab-tlp',
  standalone: true,
  imports: [CommonModule, TableModule, Button, MultiSelectModule, FormsModule],
  templateUrl: './tab-tlp.component.html',
  styleUrls: ['./tab-tlp.component.css'],
})
export class TabTlpComponent {
  @Input() tlpData: TlpRow[] = [];
  @Input() tlpCols: Column[] = [];
  @Input() lpOptions: any[] = [];
  @Input() unidadeOptions: any[] = [];
  @Input() filterValues: { [key: string]: any[] } = {};

  @Output() sortRequest = new EventEmitter<{ event: SortEvent; key: string }>();
  @Output() exportRequest = new EventEmitter<void>();

  @ViewChild('dtTlp') dtTlp!: Table;

  onCustomSort(event: SortEvent) {
    this.sortRequest.emit({ event, key: 'tlp' });
  }

  onExport() {
    this.exportRequest.emit();
  }

  clearFilters() {
    this.dtTlp.clear();
    this.filterValues['tlp_tlp'] = [];
    this.filterValues['tlp_unidade'] = [];
  }
}
