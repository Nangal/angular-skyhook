import { NgZone } from '@angular/core';
import { DropTargetMonitor } from '../target-monitor';
import { invariant } from './invariant';
import { DropTargetSpec } from '../drop-target-specification';

export class Target {

    constructor(
        private spec: DropTargetSpec,
        private zone: Zone,
        private monitor: DropTargetMonitor
    ) {
        this.monitor = monitor;
    }

    withChangeDetection<T>(fn: () => T): T {
        let x = fn();
        this.zone.scheduleMicroTask('DropTarget', () => { });
        return x;
    }

    receiveMonitor(monitor: any) {
        this.monitor = monitor;
    }

    canDrop() {
        if (!this.spec.canDrop) {
            return true;
        }

        // don't run isDragging in the zone. Should be a pure function of `this`.
        return this.spec.canDrop(this.monitor);
    }

    hover() {
        if (!this.spec.hover) {
            return;
        }
        this.withChangeDetection(() => {
            this.spec.hover(this.monitor);
        });
    }

    drop() {
        if (!this.spec.drop) {
            return undefined;
        }

        return this.withChangeDetection(() => {
            const dropResult = this.spec.drop(this.monitor);
            return dropResult;
        });
    }
}

export function createTargetFactory(spec: DropTargetSpec, zone: Zone): any {
    return function createTarget(monitor: any): any {
        return new Target(spec, zone, monitor);
    };
}
