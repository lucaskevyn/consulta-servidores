import {
  Directive,
  EventEmitter,
  HostBinding,
  HostListener,
  Output,
} from '@angular/core';

@Directive({
  selector: '[appDragDrop]',
  standalone: true,
})
export class DragDropDirective {
  @Output() fileDropped = new EventEmitter<any>();
  @Output() dragOverChange = new EventEmitter<boolean>();

  @HostBinding('class.fileover') fileOver: boolean = false;

  // Dragover listener
  @HostListener('dragover', ['$event']) onDragOver(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = true;
    this.dragOverChange.emit(true);
  }

  // Dragleave listener
  @HostListener('dragleave', ['$event']) public onDragLeave(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();

    // Check if we really left the element (and not just entered a child)
    const relatedTarget = evt.relatedTarget;
    if (!relatedTarget || !evt.currentTarget.contains(relatedTarget)) {
      this.fileOver = false;
      this.dragOverChange.emit(false);
    }
  }

  // Drop listener
  @HostListener('drop', ['$event']) public ondrop(evt: any) {
    evt.preventDefault();
    evt.stopPropagation();
    this.fileOver = false;
    this.dragOverChange.emit(false);

    const files = evt.dataTransfer.files;
    if (files.length > 0) {
      this.fileDropped.emit(files[0]);
    }
  }
}
