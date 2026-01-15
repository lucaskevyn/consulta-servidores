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
import { InputText } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SortEvent } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { Column } from '../../models/consulta-servidores.models';

@Component({
  selector: 'app-tab-geral',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    Button,
    InputText,
    MultiSelectModule,
    FormsModule,
    TooltipModule,
  ],
  templateUrl: './tab-geral.component.html',
  styleUrls: ['./tab-geral.component.css'],
})
export class TabGeralComponent {
  @Input() dados: any[] = [];
  @Input() cols: Column[] = [];
  @Input() uniqueValues: { [key: string]: any[] } = {};
  @Input() filterValues: { [key: string]: any[] } = {};
  @Input() inputPt: any;
  @Input() multiselectPt: any;
  @Input() rows = 10;

  globalFilterValue = '';

  @Output() sortRequest = new EventEmitter<{ event: SortEvent; key: string }>();
  @Output() exportRequest = new EventEmitter<void>();
  @Output() secretariaChange = new EventEmitter<string[]>();
  @Output() unidadeChange = new EventEmitter<string[]>();
  @Output() setorChange = new EventEmitter<string[]>();
  @Output() clearFiltersRequest = new EventEmitter<void>();

  @ViewChild('dt') dt!: Table;

  onCustomSort(event: SortEvent) {
    this.sortRequest.emit({ event, key: 'main' });
  }

  onExport() {
    this.exportRequest.emit();
  }

  getOptions(campo: string) {
    if (!this.uniqueValues[campo]) return [];
    return this.uniqueValues[campo].map((v) => ({ label: v, value: v }));
  }

  clearTableFilters() {
    this.dt.clear();
    this.globalFilterValue = '';
    this.clearFiltersRequest.emit();
  }

  onSecretariaChangeHandler(values: string[]) {
    this.secretariaChange.emit(values);
  }

  onUnidadeChangeHandler(values: string[]) {
    this.unidadeChange.emit(values);
  }

  onSetorChangeHandler(values: string[]) {
    this.setorChange.emit(values);
  }
}
