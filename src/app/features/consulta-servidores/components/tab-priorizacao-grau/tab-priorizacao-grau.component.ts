import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { Column } from '../../models/consulta-servidores.models';

@Component({
  selector: 'app-tab-priorizacao-grau',
  standalone: true,
  imports: [CommonModule, TableModule, Button, TooltipModule],
  templateUrl: './tab-priorizacao-grau.component.html',
  styleUrls: ['./tab-priorizacao-grau.component.css'],
})
export class TabPriorizacaoGrauComponent {
  @Input() resolucaoData: any[] = [];
  @Input() resolucaoCols: Column[] = [];
  @Output() exportRequest = new EventEmitter<void>();

  onExport() {
    this.exportRequest.emit();
  }
}
