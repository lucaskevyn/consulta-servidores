import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculoResolucao } from '../../models/consulta-servidores.models';

import { Button } from 'primeng/button';
import { CardComponent } from '../../../../shared/components/card/card.component';

@Component({
  selector: 'app-tab-calculos-distribuicao',
  standalone: true,
  imports: [CommonModule, Button, CardComponent],
  templateUrl: './tab-calculos-distribuicao.component.html',
  styleUrls: ['./tab-calculos-distribuicao.component.css'],
})
export class TabCalculosDistribuicaoComponent {
  @Input() calculosResolucao: CalculoResolucao[] = [];

  @Output() exportRequest = new EventEmitter<void>();

  onExport() {
    this.exportRequest.emit();
  }
}
