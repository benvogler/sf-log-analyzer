import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

    private beforeInit = true;

    @Input()
    visible = false;

    @Input()
    class: string;

    @Input()
    showClose = true;

    @Input()
    toast = false;

    @Input()
    timeout = 5000;

    constructor() { }

    ngOnInit() {
        window.setTimeout(() => this.beforeInit = false, 1000);
        if (this.visible) this.setTimeout();
    }

    show(options?: {class?: string, showClose?: boolean, toast?: boolean, timeout?: number}) {
        if (options) {
            for (let property of ['class', 'showClose', 'toast', 'timeout']) {
                if (options.hasOwnProperty(property)) this[property] = options[property];
            }
        }
        this.visible = true;
        if (this.visible) this.setTimeout();
    }

    hide() {
        this.visible = false;
    }

    toggle() {
        this.visible = !this.visible;
        if (this.visible) this.setTimeout();
    }

    private setTimeout() {
        if (this.toast && this.timeout) {
            window.setTimeout(() => this.visible = false, this.timeout);
        }
    }

}
