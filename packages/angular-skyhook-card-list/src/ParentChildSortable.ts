import { DraggedItem } from "./dragged-item";
import { Data } from "./data";
import { SortableSpec } from './SortableSpec';

export class ParentChildSortable<P extends { id: any; } & { children: C[] }, C extends { id: any; }> {
    beforeDrag: P[] = null;

    get either() {
        return this.beforeDrag || this.parents;
    }

    tracker = (x: C | P) => x.id;

    constructor (
        public parents: P[],
        public options: {
            parent?: {
                copy?: (item: DraggedItem<P>) => P,
                canDrop?: (item: DraggedItem<P>) => boolean,
            },
            child?: {
                copy?: (item: DraggedItem<C>) => C,
                canDrop?: (item: DraggedItem<C>) => boolean,
            }
        } = { }
    ) {
    }

    moveParent(item: DraggedItem<P>) {
        let without = this.beforeDrag.slice(0);
        if (!item.isCopy) {
            without.splice(item.index, 1);
        }
        without.splice(item.hover.index, 0, item.data);
        this.parents = without;
    }

    moveChild(item: DraggedItem<C>) {
        const fromListIdx = this.either.findIndex(p => p.id === item.listId)
        const toListIdx = this.either.findIndex(p => p.id === item.hover.listId)
        let neu = this.either.slice(0);

        if (!item.isCopy) {
            let fromChildren = neu[fromListIdx].children.slice(0);
            fromChildren.splice(item.index, 1);
            const fromList: P = Object.assign({}, neu[fromListIdx], {
                children: fromChildren
            });
            neu[fromListIdx] = fromList;
        }

        let toChildren = neu[toListIdx].children.slice(0);
        toChildren.splice(item.hover.index, 0, item.data);
        const toList: P = Object.assign({}, neu[toListIdx], {
            children: toChildren
        });
        neu[toListIdx] = toList;

        this.parents = neu;
    }

    parentSpec: SortableSpec<P> = {
        trackBy: this.tracker,
        copy: this.options.parent && this.options.parent.copy,
        canDrop: this.options.parent && this.options.parent.canDrop,
        beginDrag: (item: DraggedItem<P>) => {
            this.beforeDrag = this.parents;
        },
        hover: (item: DraggedItem<P>) => {
            this.moveParent(item);
        },
        drop: (item: DraggedItem<P>) => {
            this.moveParent(item);
            this.beforeDrag = null;
        },
        endDrag: (item: DraggedItem<P>) => {
            this.parents = this.either;
            this.beforeDrag = null;
        }
    };

    childSpec: SortableSpec<C> = {
        trackBy: this.tracker,
        copy: this.options.child && this.options.child.copy,
        canDrop: this.options.child && this.options.child.canDrop,
        beginDrag: (item: DraggedItem<C>) => {
            this.beforeDrag = this.parents;
        },
        hover: (item: DraggedItem<C>) => {
            this.beforeDrag = this.either;
            this.moveChild(item);
        },
        drop: (item: DraggedItem<C>) => {
            this.beforeDrag = this.either;
            this.moveChild(item);
            this.beforeDrag = null;
        },
        endDrag: (item: DraggedItem<C>) => {
            this.parents = this.either;
            this.beforeDrag = null;
        }
    }
}

