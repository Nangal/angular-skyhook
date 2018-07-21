import { Data } from './data';
import { DraggedItem } from './dragged-item';
import { SortableSpec } from './SortableSpec';

export class SimpleSortable<T extends Data> implements SortableSpec<T> {
    beforeDrag: T[] = null;

    get either() {
        return this.beforeDrag || this.list;
    }

    constructor (
        public list: T[],
        public listId: any,
        public trackBy: (item: T) => any,
        public onChange?: (newValue: T[]) => void,
        public onCommit?: (newValue: T[]) => void
    ) { }

    tryUpdateList(list: T[]) {
        // if there is a drag in progress, don't set the list.
        if (this.beforeDrag === null) {
            this.list = list;
        }
    }

    move(item: DraggedItem<T>) {
        let without = this.either.slice(0);
        if (!item.isCopy && item.listId === this.listId) {
            without.splice(item.index, 1);
        }
        without.splice(item.hover.index, 0, item.data);
        this.list = without;
    }

    beginDrag = (item: DraggedItem<T>) => {
        this.beforeDrag = this.list;
    }
    hover = (item: DraggedItem<T>) => {
        if (this.beforeDrag === null) {
            this.beforeDrag = this.list;
        }
        this.move(item);
        if (this.onChange) {
            this.onChange(this.list);
        }
    }
    drop = (item: DraggedItem<T>) => {
        if (this.beforeDrag === null) {
            this.beforeDrag = this.list;
        }
        this.move(item);
        if (this.onCommit) {
            this.onCommit(this.list);
        }
    }
    endDrag = (item: DraggedItem<T>) => {
        this.list = this.either;
        this.beforeDrag = null;
        if (this.onChange) {
            this.onChange(this.list);
        }
    }
}


// TODO: use an injected service and create 'drakes',
// which are just lists + specs referring to the service
// call it SharedSortable

import { Injectable } from '@angular/core';

export interface SharedSortable<T extends Data> {
    list: {},
    spec: SortableSpec<T>
}

// @Injectable()
// export class SharedSortableService {
//     abstract register<T = Data>(
//         type: string|symbol,
//         listId: any,
//     ): SharedSortable<T>;
// }

// TODO: maybe not
// Better idea: create a { list1: [], list2: [] }-shaped
// many-buckets approach.
// If people want to use it in many components at once,
// they can share it using input properties.

