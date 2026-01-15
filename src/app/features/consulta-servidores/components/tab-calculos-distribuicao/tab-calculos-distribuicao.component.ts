import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalculoResolucao } from '../../models/consulta-servidores.models';

@Component({
  selector: 'app-tab-calculos-distribuicao',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-calculos-distribuicao.component.html',
  styleUrls: ['./tab-calculos-distribuicao.component.css'],
})
export class TabCalculosDistribuicaoComponent {
  @Input() calculosResolucao: CalculoResolucao[] = [];
}
