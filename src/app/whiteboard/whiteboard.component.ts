import { Component, ViewChild, ElementRef, Input, AfterViewInit } from '@angular/core';
//import domtoimage from 'dom-to-image';
//import * as jsPDF from 'jspdf';
import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise } from 'rxjs/operators';
import { WhiteboardService } from './whiteboard.service';

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss']
})
export class WhiteboardComponent implements AfterViewInit {
  @Input() parentElement: HTMLElement;
  @ViewChild('testCanvas') public canvas: ElementRef;
  @ViewChild('mainCanvas') public mainCanvas: ElementRef;
  loading: boolean = false;
  input: any = {};
  ctx: CanvasRenderingContext2D;
  postions: any = {}
  ctx_main: CanvasRenderingContext2D;
  id: number;


  constructor(private wbService: WhiteboardService) { }

  ngAfterViewInit() {
    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    const canvasEl_main: HTMLCanvasElement = this.mainCanvas.nativeElement;
    this.ctx = canvasEl.getContext("2d");
    this.ctx_main = canvasEl_main.getContext("2d");
    this.wbService.setDefault(this.ctx);
    this.wbService.setDefault(this.ctx_main, true);
    this.captureEvents(canvasEl);
    this.onMouseUp(canvasEl)
    this.wbService.action.subscribe(action => {
      this.doAction(action);
    })
  }


  captureEvents(canvasEl: HTMLCanvasElement) {
    let firstPos: any;
    const rect = canvasEl.getBoundingClientRect();
    this.mouseDown(canvasEl)
      .pipe(
        switchMap((e: MouseEvent) => {
          if (this.wbService.type) {
            this.id = Date.now();
            if (this.wbService.type === 'draw') {
              this.wbService.drawHistory[this.id] = [];
            }

          }
          firstPos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
          }
          return this.mouseMove(canvasEl).pipe(
            takeUntil(fromEvent(canvasEl, "mouseup")),
            takeUntil(fromEvent(canvasEl, "mouseleave")),
            pairwise() /* Return the previous and last values as array */
          );
        })
      ).subscribe((res: [MouseEvent, MouseEvent]) => {
        const prevPos = {
          x: res[0].clientX - rect.left,
          y: res[0].clientY - rect.top
        };

        const currentPos = {
          x: res[1].clientX - rect.left,
          y: res[1].clientY - rect.top
        };
        this.postions = { firstPos, prevPos, currentPos };
        if (this.wbService.type === 'draw') {
          this.drawOnCanvas(this.ctx_main)
          this.wbService.drawHistory[this.id].push({ ...this.postions })
        }
        if (this.wbService.type === 'circle') {
          this.ctx.clearRect(0, 0, this.parentElement.offsetWidth, this.parentElement.offsetHeight);
          this.drawCircle(this.ctx);
        }
        if (this.wbService.type === 'line') {
          this.ctx.clearRect(0, 0, this.parentElement.offsetWidth, this.parentElement.offsetHeight);
          this.drawLine(this.ctx)
        }
        if (this.wbService.type === 'rect') {
          this.ctx.clearRect(0, 0, this.parentElement.offsetWidth, this.parentElement.offsetHeight);
          this.drawRect(this.ctx)
        }
      })
  }



  mouseDown(canvasEl) {
    return fromEvent(canvasEl, "mousedown")
  }

  onMouseUp(canvasEl) {
    fromEvent(canvasEl, "mouseup").subscribe((res: MouseEvent) => {
      this.ctx.clearRect(0, 0, this.parentElement.offsetWidth, this.parentElement.offsetHeight);
      const { strokeStyle, fillStyle } = this.ctx_main;
      if (this.wbService.type === 'circle') {
        this.drawCircle(this.ctx_main);
      }
      if (this.wbService.type === 'line') {
        this.drawLine(this.ctx_main);
      }
      if (this.wbService.type === 'rect') {
        this.drawRect(this.ctx_main);
      }

      if (this.wbService.type === 'draw') {
        this.wbService.actionStack.push({ id: this.id, positionsArray: this.wbService.drawHistory[this.id], type: this.wbService.type, options: { strokeStyle } })
      }
      if (this.wbService.type != 'text' && this.wbService.type != 'draw' && this.wbService.type) {
        this.wbService.actionStack.push({ id: this.id, postions: this.postions, type: this.wbService.type, options: { strokeStyle, fillStyle } })
      }
      console.log(this.wbService.actionStack)
    })
  }

  clear() {
    this.ctx_main.clearRect(0, 0, this.parentElement.offsetWidth, this.parentElement.offsetHeight);
    this.wbService.actionStack = [];
    this.wbService.redoStack = []
  }

  doAction(action) {
    if (action === 'clear') this.clear();
    if (action === 'undo') this.undo();
    if (action === 'redo') this.redo();
    //if (action === 'download') this.downloadPDF()
  }

  mouseMove(canvasEl) {
    return fromEvent(canvasEl, "mousemove")
  }
  drawLine(ctx, postions?, options?) {
    const { firstPos, currentPos } = postions || this.postions;
    const oldOptions = this.applySettings(ctx, options);
    ctx.beginPath();
    ctx.moveTo(firstPos.x, firstPos.y);
    ctx.lineTo(currentPos.x, currentPos.y);
    ctx.stroke();
    this.applySettings(ctx, oldOptions);
  }

  drawCircle(ctx, postions?, options?) {
    const { firstPos, currentPos } = postions || this.postions;
    const oldOptions = this.applySettings(ctx, options);
    ctx.beginPath();
    ctx.moveTo(firstPos.x, firstPos.y + (currentPos.y - firstPos.y) / 2);
    ctx.bezierCurveTo(firstPos.x, firstPos.y, currentPos.x, firstPos.y, currentPos.x, firstPos.y + (currentPos.y - firstPos.y) / 2);
    ctx.bezierCurveTo(currentPos.x, currentPos.y, firstPos.x, currentPos.y, firstPos.x, firstPos.y + (currentPos.y - firstPos.y) / 2);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
    this.applySettings(ctx, oldOptions);
  }

  drawRect(ctx, postions?, options?) {
    const { firstPos, currentPos } = postions || this.postions;
    const width = currentPos.x - firstPos.x;
    const height = currentPos.y - firstPos.y;
    const oldOptions = this.applySettings(ctx, options);
    ctx.beginPath();
    ctx.rect(firstPos.x, firstPos.y, width, height);
    ctx.stroke();
    ctx.fill();
    this.applySettings(ctx, oldOptions);
  }

  applySettings(ctx, options) {
    const { strokeStyle, fillStyle } = this.ctx;
    for (const key in options) {
      ctx[key] = options[key];
    }
    return { strokeStyle, fillStyle };
  }

  drawOnCanvas(ctx, postions?, options?) {
    const { prevPos, currentPos } = postions || this.postions;
    const oldOptions = this.applySettings(ctx, options);
    ctx.beginPath();
    if (prevPos) {
      ctx.moveTo(prevPos.x, prevPos.y); // from
      ctx.lineTo(currentPos.x, currentPos.y);
      ctx.stroke();
    }
    this.applySettings(ctx, oldOptions);
  }

  onClick(e) {
    if (this.wbService.type === 'text') {
      this.input.enabled = true;
      this.input.x = e.offsetX;
      this.input.y = e.offsetY;
    }
  }

  redo() {
    if (!this.wbService.redoStack.length) return;
    const action = this.wbService.redoStack.pop()
    this.wbService.actionStack.push({ ...action })
    this.performAction(action)
  }


  performAction(action) {
    if (action.type === 'circle') {
      this.drawCircle(this.ctx_main, action.postions, action.options);
    }
    if (action.type === 'line') {
      this.drawLine(this.ctx_main, action.postions, action.options);
    }
    if (action.type === 'rect') {
      this.drawRect(this.ctx_main, action.postions, action.options);
    }
    if (action.type === 'text') {
      this.fillText(action)
    }
    if (action.type === 'draw') {
      for (const positions of action.positionsArray) {
        this.drawOnCanvas(this.ctx_main, positions, action.options)
      }
    }
  }

  undo() {
    if (!this.wbService.actionStack.length) return
    this.ctx_main.clearRect(0, 0, this.parentElement.offsetWidth, this.parentElement.offsetHeight);
    const removedAction = this.wbService.actionStack.pop()
    this.wbService.redoStack.push({ ...removedAction });
    for (const action of this.wbService.actionStack) {
      this.performAction(action)
    }
  }


  addText() {
    if (!this.input.text) return;
    const { fillStyle } = this.ctx_main;
    this.ctx_main.fillText(this.input.text, this.input.x, this.input.y)
    this.wbService.actionStack.push({ type: this.wbService.type, input: { ...this.input }, font: this.ctx.font, options: { fillStyle } })
    this.input.enabled = false;
    this.input.text = "";
  }


  fillText({ input, options }) {
    const oldOptions = this.applySettings(this.ctx_main, options);
    this.ctx_main.fillText(input.text, input.x, input.y)
    this.applySettings(this.ctx_main, oldOptions);
  }



  // async downloadPDF() {
  //   const node = this.parentElement
  //   const scale = 2;
  //   const settings = { bgcolor: '#fff', height: node['offsetHeight'] * scale, style: { transform: `scale(${scale}) translate(${node['offsetWidth'] / 2 / scale}px, ${node['offsetHeight'] / 2 / scale}px)` }, width: node['offsetWidth'] * scale }
  //   var img;
  //   var filename;
  //   var newImage;

  //   try {
  //     const dataUrl = await domtoimage.toPng(node, settings)
  //     img = new Image();
  //     img.src = dataUrl;
  //     newImage = img.src;
  //     img.onload = () => {
  //       var pdfWidth = img.width;
  //       var pdfHeight = img.height;
  //       // FileSaver.saveAs(dataUrl, 'my-pdfimage.png'); // Save as Image
  //       var doc;
  //       if (pdfWidth > pdfHeight) {
  //         doc = new jsPDF('l', 'px', [pdfWidth, pdfHeight]);
  //       }
  //       else {
  //         doc = new jsPDF('p', 'px', [pdfWidth, pdfHeight]);
  //       }
  //       var width = doc.internal.pageSize.getWidth();
  //       var height = doc.internal.pageSize.getHeight();
  //       doc.addImage(newImage, 'PNG', 10, 10, width, height);
  //       filename = 'ibi_dashboard_export' + '.pdf';
  //       doc.save(filename);
  //       this.loading = false;
  //     };

  //   } catch (error) {

  //   }
  // }

  ngOnDestroy() {
    this.wbService.type = "";
    this.clear();
  }
}
