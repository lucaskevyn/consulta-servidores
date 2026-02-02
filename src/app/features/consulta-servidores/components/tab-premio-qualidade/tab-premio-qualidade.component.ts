import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculoResolucao } from '../../models/consulta-servidores.models';

import { Button } from 'primeng/button';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-tab-premio-qualidade',
  standalone: true,
  imports: [CommonModule, Button, CardComponent],
  templateUrl: './tab-premio-qualidade.component.html',
  styleUrls: ['./tab-premio-qualidade.component.css'],
})
export class TabPremioQualidadeComponent {
  @Input() totalPontos: number = 0;
  @Input() situacaoPremio: CalculoResolucao[] = [];

  @Output() exportRequest = new EventEmitter<void>();

  onExport() {
    this.exportRequest.emit();
  }
}
