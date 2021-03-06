import { Component, Input, EventEmitter } from "@angular/core";
import { Card } from "../card";
import { DragSource, SkyhookDndService } from "angular-skyhook";
import { DropEvent, DraggedItem, HoverEvent, SortableSpec } from "angular-skyhook-card-list";
import { Output } from "@angular/core";
import { getEmptyImage } from "react-dnd-html5-backend";
import { ItemTypes } from "../item-types";
import { KanbanList } from "app/kanban/lists";
import { Observable } from "rxjs";

type Source = DragSource<DraggedItem<KanbanList>>;

@Component({
    selector: "kanban-list",
    templateUrl: "./kanban-list.component.html",
    styleUrls: ["./kanban-list.component.scss"]
})
export class KanbanListComponent {
    @Input() list: KanbanList;

    source: Source;
    isDragging$: Observable<boolean>;

    @Input('source') set _source(src: Source) {
        this.source = src;
        this.isDragging$ = this.source.listen(m => m.isDragging());
    }

    @Input() dragging = false;
    @Input() spec: SortableSpec;
    @Input() placeholder: DraggedItem<KanbanList>;

    @Output() beginDrag = new EventEmitter<DraggedItem>();
    @Output() hovered = new EventEmitter<HoverEvent>();
    @Output() endDrag = new EventEmitter<DraggedItem>();
    @Output() dropCard = new EventEmitter<DropEvent>();
    @Output() addCard = new EventEmitter<string>();

    ItemTypes = ItemTypes;
}
