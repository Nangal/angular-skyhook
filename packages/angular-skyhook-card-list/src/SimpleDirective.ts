import { Directive, Input, Host, Self, ChangeDetectorRef, EventEmitter, Output, OnChanges, SimpleChange } from "@angular/core";
import { CardListComponent } from "./card-list.component";
import { Data } from "./data";
import { DraggedItem } from "./dragged-item";
import { SortableSpec } from './SortableSpec';
import { SimpleSortable } from "./SimpleSortable";
import { Subscription } from 'rxjs';


@Directive({
    selector: '[simple]'
})
export class SimpleSortableDirective<T extends Data> {
    listValue: T[];
    @Output() simpleChange = new EventEmitter<T[]>();
    @Input() set simple(list: T[]) {
        this.listValue = list;
        this.host.updateChildren(list);
        if (this._sortable) {
            this._sortable.tryUpdateList(list);
        }
    }
    get simple() {
        return this.listValue;
    }
    _sortable: SimpleSortable<T>;

    constructor(@Host() @Self() private host: CardListComponent) {}

    ngOnInit() {
        this._sortable = new SimpleSortable(this.simple, this.host.listId,
            (x) => 0, // todo: trackBy
            (neu) => {
                this.simple = neu;
            }, (neu) => {
                this.simple = neu;
                this.simpleChange.emit(neu);
            }
        );
        this.host.spec = this._sortable;
    }
    ngOnChanges(changes: { list?: SimpleChange }) {
        if (this._sortable) {
            this._sortable.listId = this.host.listId;
        }
    }
}

import { SharedSortableService } from "./SharedSortableService";

@Directive({
    selector: '[shared]'
})
export class DragulaDirective<T extends Data> implements OnChanges {
    @Output() sharedChange = new EventEmitter<T[]>();
    @Input() shared: T[];

    subs = new Subscription();

    constructor(
        @Host() @Self() private host: CardListComponent,
        private service: SharedSortableService<T>
    ) {}

    ngOnInit() {
        this.host.updateChildren(this.shared);
        this.service.tryUpdateList(this.host.type, this.host.listId, this.shared);
        this.subs.add(this.service.specFor(this.host.type).subscribe(spec => {
            this.host.spec = spec;
        }));
        this.subs.add(this.service.listFor(this.host.type, this.host.listId).subscribe(list => {
            this.host.updateChildren(list);
            this.sharedChange.emit(list);
        }));
    }
    ngOnChanges(changes: { shared?: SimpleChange }) {
        if (changes.shared) {
            this.host.updateChildren(this.shared);
            this.service.tryUpdateList(this.host.type, this.host.listId, this.shared);
        }
    }
}
