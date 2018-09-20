import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { LogService, Filter, LogView } from '../../services/log.service';
import { ActivatedRoute, Router, RoutesRecognized, ActivatedRouteSnapshot, Data } from '@angular/router';
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
    lastRouteData: Data;

    constructor(logService: LogService, private route: ActivatedRoute, private router: Router, private http: HttpClient) {
        this.logService = logService;

        this.showItems = {};
        for (const item in ToolbarItems) {
            if (ToolbarItems[item]) {
                this.showItems[ToolbarItems[item]] = true;
            }
        }
        this.lastRouteData = this.route.snapshot.firstChild.data;
        this.handleRoute(this.route.snapshot.firstChild.data);
        this.router.events.subscribe((data) => {
            if (data instanceof RoutesRecognized) {
                this.lastRouteData = data.state.root.firstChild.data;
                this.handleRoute(data.state.root.firstChild.data);
            }
        });
    }

    private handleRoute(data: Data) {
        this.showItems = {};
        let view;
        if (data.views) {
            view = data.views.filter(d => d.view === this.logService.view)[0];
        }
        console.log('view', view);
        let toolbarItems = view ? view.toolbarItems : data.toolbarItems;
        for (const item in ToolbarItems) {
            if (!isNaN(Number(item))) {
                this.showItems[ToolbarItems[item]] = toolbarItems !== undefined ? toolbarItems[item] : false;
            }
        }
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
        this.handleRoute(this.lastRouteData);
    }

}
