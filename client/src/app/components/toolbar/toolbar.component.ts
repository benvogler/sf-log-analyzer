import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { LogService, Filter, LogView } from '../../services/log.service';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import { HttpClient } from '@angular/common/http';

export enum ToolbarItems {
    file,
    view,
    debug,
    scope,
    hideEmpty,
    search
}

@Component({
    selector: 'app-toolbar',
    templateUrl: './toolbar.component.html',
    styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

    logService: LogService;
    debug = false;
    LogView = LogView;
    showItems;

    constructor(logService: LogService, private route: ActivatedRoute, private router: Router, private http: HttpClient) {
        this.logService = logService;

        this.showItems = {};
        for (const item in ToolbarItems) {
            if (ToolbarItems[item]) {
                this.showItems[ToolbarItems[item]] = true;
            }
        }
        this.router.events.subscribe((data) => {
            if (data instanceof RoutesRecognized) {
                this.showItems = {};
                for (const item in ToolbarItems) {
                    if (!isNaN(Number(item))) {
                        this.showItems[ToolbarItems[item]] = data.state.root.firstChild.data['toolbarItems'] !== undefined &&
                            data.state.root.firstChild.data['toolbarItems'][item] !== undefined;
                    }
                }
            }
        });
    }

    ngOnInit() {
    }

    toggleDebug(): void {
        this.debug = !this.debug;
        this.logService.filter(Filter.debug, !this.debug);
    }

    toggleHideEmpty(): void {
        this.logService.hideEmpty = !this.logService.hideEmpty;
    }

    setView(view: LogView): void {
        this.logService.view = view;
    }

}
