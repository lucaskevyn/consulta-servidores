import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

export type CardMode = 'default' | 'success' | 'fail';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
})
export class CardComponent {
  @Input() mode: CardMode = 'default';
  @Input() styleClass: string = '';
}
