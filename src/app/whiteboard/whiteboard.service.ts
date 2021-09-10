import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: "root"
})
export class WhiteboardService {
  type: string;
  action: Subject<string> = new Subject();
  actionStack: any[] = [];
  redoStack: any[] = [];
  drawHistory = {};
  color:'#000000';
  default = {
    strokeStyle: '#000000',
    font: "18px sans-serif",
    textBaseline: 'top',
    textAlign: 'left',
    lineWidth: 2,
    lineCap: "round",
    fillStyle: "transparent"
  }
  ctx: any;
  ctx_main: any;
  constructor() { }


  setDefault(ctx, isMain?) {
    if (isMain) this.ctx_main = ctx;
    else this.ctx = ctx;
    for (const key in this.default) {
      ctx[key] = this.default[key];
    }
  }


  setColor(color) {
    this.ctx.strokeStyle = color;
    this.ctx_main.strokeStyle = color;
  }

  setFill(color) {
    this.ctx.fillStyle = color;
    this.ctx_main.fillStyle = color;
  }

  isActionDisabled(action: 'undo' | 'redo') {
    return action === 'undo' ? this.actionStack.length : this.redoStack.length;
  }
}
