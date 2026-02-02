import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreaVinculoStat } from '../../models/consulta-servidores.models';

import { Button } from 'primeng/button';

@Component({
  selector: 'app-tab-servidores',
  standalone: true,
  imports: [CommonModule, Button],
  templateUrl: './tab-servidores.component.html',
  styleUrls: ['./tab-servidores.component.css'],
})
export class TabServidoresComponent {
  @Input() areaVinculoStats: AreaVinculoStat[] = [];

  @Output() exportRequest = new EventEmitter<void>();

  onExport() {
    this.exportRequest.emit();
  }
}
