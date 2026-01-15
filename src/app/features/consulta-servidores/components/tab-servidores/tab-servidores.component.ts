import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AreaVinculoStat } from '../../models/consulta-servidores.models';

@Component({
  selector: 'app-tab-servidores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tab-servidores.component.html',
  styleUrls: ['./tab-servidores.component.css'],
})
export class TabServidoresComponent {
  @Input() areaVinculoStats: AreaVinculoStat[] = [];
}
