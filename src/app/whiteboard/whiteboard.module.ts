import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiComponentsModule } from '@exalink/ui-components-angular';
import { ToolbarComponent } from './toolbar/toolbar.component';
import { WhiteboardComponent } from './whiteboard.component';
import { WhiteboardService } from './whiteboard.service';

@NgModule({
    declarations:[
        WhiteboardComponent,
        ToolbarComponent
    ],
    imports:[CommonModule, FormsModule, UiComponentsModule],
    exports:[WhiteboardComponent, ToolbarComponent],
    providers:[WhiteboardService]
})
export class WhiteboardModule { }
