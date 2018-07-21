import {
    Directive,
    Component,
    Output,
    EventEmitter,
    Input,
    ContentChild,
    TemplateRef,
    ElementRef,
    ChangeDetectionStrategy,
    OnInit,
    OnDestroy,
    HostBinding,
    ChangeDetectorRef,
    ViewChild,
    SimpleChange
} from "@angular/core";
import {
    SkyhookDndService,
    Offset,
    DropTargetMonitor,
    DragSourceMonitor,
    DropTargetDirective
} from "angular-skyhook";
import { ItemTypes } from "./item-types";
import { HoverEvent, BeginEvent } from "./hover-event";
import { DraggedItem } from "./dragged-item";
import { Data } from "./data";
import { tap, startWith } from "rxjs/operators";
import { BehaviorSubject, Subscription } from "rxjs";
import { Size } from "./size";
import { Observable } from "rxjs";
import { DropTarget, DragSource } from 'angular-skyhook';

import { CardRendererInput } from "./card-template.directive";

// TODO: render target box at full width (vertical) or full height (horiz)

@Directive({
    selector: '[cardRenderer]',
    exportAs: 'cardRenderer'
})
export class CardRendererDirective implements OnInit, OnDestroy {
    context: CardRendererInput;
    @Input('cardRenderer') set _context(c: CardRendererInput) {
        this.context = c;
    }

    get data() { return this.context.data; }
    get type() { return this.context.type; }
    get listId() { return this.context.listId; }
    get index() { return this.context.index; }
    get horizontal() { return this.context.horizontal; }
    get item() { return this.context.item; }
    @HostBinding("style.display")
    get hidden() { return this.context.hidden ? 'none' : null; }

    private get spec() { return this.context.spec; }

    /** @ignore */
    target = this.dnd.dropTarget<DraggedItem>(null, {
        // this is a hover-only situation
        canDrop: monitor => false,
        hover: monitor => {
            const item = monitor.getItem();
            this.hover(monitor.getItem(), monitor.getClientOffset());
        }
    });

    /** @ignore */
    source = this.dnd.dragSource<DraggedItem>(null, {
        isDragging: monitor => {
            return this.sameId(monitor.getItem());
        },
        beginDrag: monitor => {
            let item: DraggedItem = {
                data: this.data,
                index: this.index,
                isCopy: false,
                size: this.size(),
                type: this.type,
                isInternal: true,
                listId: this.listId,
                hover: {
                    index: this.index,
                    listId: this.listId
                }
            };
            if (this.spec && this.spec.copy && this.spec.copy(item)) {
                if (!this.spec.clone) {
                    throw new Error("must provide clone function");
                }
                let clone = this.spec.clone(item);
                if (clone !== item.data || this.sameIds(item.data, clone)) {
                    throw new Error("clone must return a new object with a different id / trackBy result");
                }
                item.data = clone;
                item.hover.index ++;
                item.isCopy = true;
            }
            this.spec && this.spec.beginDrag && this.spec.beginDrag(item);
            if (item.isCopy) {
                // Chrome bug means an immediate dragend would fire
                // if you did this synchronously
                let canDrop = true;
                if (this.spec && this.spec.canDrop) {
                    canDrop = this.spec.canDrop(item);
                }
                if (canDrop) {
                    setTimeout(() => {
                        this.spec && this.spec.hover && this.spec.hover(item);
                    }, 0);
                }
            }
            return item;
        },
        endDrag: monitor => {
            // if (!monitor.didDrop()) // {
                this.spec && this.spec.endDrag && this.spec.endDrag(monitor.getItem());
            // }
        }
    });

    isDragging$ = this.source.listen(m => m.isDragging());

    constructor(
        private dnd: SkyhookDndService,
        private el: ElementRef<HTMLElement>,
    ) {
    }

    sameIds(data: Data, other: Data) {
        return data && other && this.spec.trackBy(data) === this.spec.trackBy(other);
    }
    sameId(item: DraggedItem) {
        return this.sameIds(this.data, item.data);
    }

    //     ~ List ~
    // [
    //   [ index 0 ]
    //   [ index 1 ] <-- index 1 gets picked up
    //   [ index 2 ]
    // ]
    //
    // We want to emit a hover when:
    //   - the mouse moves over the top half of 0
    //   - the mouse moves over the bottom half of 2
    //
    // ,----------------------,
    // | target 0 top half    | => emits 0
    // |----------------------|
    // | target 0 bottom half | => computes 1, doesn't emit
    // '----------------------'
    // ,----------------------,
    // | target 1 (inert)     | => computes 1, doesn't emit
    // '----------------------'
    // ,----------------------,
    // | target 2 top half    | => computes 1, doesn't emit
    // |----------------------|
    // | target 2 bottom half | => emits 2
    // '----------------------'
    //

    hover(item: DraggedItem, clientOffset: Offset): void {
        // hovering on yourself should do nothing
        if (this.sameId(item)) {
            return;
        }
        const size = this.size();
        const dim = this.horizontal ? size.width : size.height;
        const start = this.top();
        const targetCentre = start + dim / 2.0;
        const mouse = this.horizontal ? clientOffset.x : clientOffset.y;
        const topHalf = mouse < targetCentre;

        const { hover, isCopy } = item;

        let suggestedIndex: number;

        if (this.listId === hover.listId) {
            if (this.index < hover.index) {
                suggestedIndex = topHalf ? this.index : this.index + 1;
            } else {
                suggestedIndex = topHalf ? this.index - 1 : this.index;
            }
        } else {
            // first hover on a different list;
            // there is no relevant hover.index to compare to
            suggestedIndex = topHalf ? this.index : this.index + 1;
        }

        // // happens if you're copying from index=0
        // if (suggestedIndex < 0) {
        //     suggestedIndex = 0;
        // }

        // move the item if its new position is different
        if (suggestedIndex !== hover.index || this.listId !== hover.listId) {
            item.hover = {
                index: suggestedIndex,
                listId: this.listId
            };
            if (this.spec && this.spec.canDrop && !this.spec.canDrop(item)) {
                return;
            }
            // shallow clone so library consumers don't mutate our items
            this.spec && this.spec.hover && this.spec.hover({
                ...item
            });
        }

    }

    /** @ignore */
    rect() {
        if (!this.el) {
            throw new Error("cardRenderer expected to be attached to a real DOM element");
        }
        const rect = (this.el.nativeElement as Element).getBoundingClientRect();
        return rect;
    }

    /** @ignore */
    size() {
        return new Size(this.width(), this.height());
    }

    /** @ignore */
    width() {
        const rect = this.rect();
        return rect.width || rect.right - rect.left;
    }

    /** @ignore */
    height() {
        const rect = this.rect();
        return rect.height || rect.bottom - rect.top;
    }

    /** @ignore */
    top() {
        return this.horizontal ? this.rect().left : this.rect().top;
    }

    /** @ignore */
    mouse(monitor: DropTargetMonitor) {
        const offset = monitor.getClientOffset();
        return this.horizontal ? offset.x : offset.y;
    }

    ngOnInit() {
        this.target.setTypes(this.type);
        this.source.setType(this.type);
    }

    ngAfterViewInit() {
        if (this.el) {
            this.target.connectDropTarget(this.el.nativeElement);
        }
    }

    ngOnChanges() {
        this.target.setTypes(this.type);
        this.source.setType(this.type);
    }

    ngOnDestroy() {
        this.source.unsubscribe();
        this.target.unsubscribe();
    }

}
