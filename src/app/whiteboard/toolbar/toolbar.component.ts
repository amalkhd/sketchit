import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { WhiteboardService } from '../whiteboard.service';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {
  edit: boolean = false;
  color: string = "#000000";
  fillColor: string = "#FF0000";
  isFillEnabled: boolean = false;
  tools = ['draw', 'text', 'line','circle', 'rect']
  @Output() editClicked: EventEmitter<boolean> = new EventEmitter();
  constructor(public wbService: WhiteboardService) { }

  ngOnInit() {
  }


  onChange(ev, type) {
    if (type && this.isFillEnabled) this.wbService.setFill(this.fillColor);
    else this.wbService.setColor(this.color);
  }

  onCheck($event) {
    if (!this.isFillEnabled) this.wbService.setFill("transparent");
    else this.wbService.setFill(this.fillColor);
  }

  onSelect({value}) {
    if (value != 'text') {
      this.isFillEnabled = false;
      this.wbService.setFill('transparent');
      return;
    }
    this.isFillEnabled = true;
    this.wbService.setFill(this.fillColor);
  }


}
