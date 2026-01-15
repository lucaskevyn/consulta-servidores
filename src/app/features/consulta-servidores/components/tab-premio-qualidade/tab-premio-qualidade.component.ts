import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculoResolucao } from '../../models/consulta-servidores.models';

@Component({
  selector: 'app-tab-premio-qualidade',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-premio-qualidade.component.html',
  styleUrls: ['./tab-premio-qualidade.component.css'],
})
export class TabPremioQualidadeComponent {
  @Input() totalPontos: number = 0;
  @Input() situacaoPremio: CalculoResolucao[] = [];
}
