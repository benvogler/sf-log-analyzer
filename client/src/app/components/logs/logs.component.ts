import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { LogService, Log, LogView } from '../../services/log.service';

@Component({
    selector: 'app-logs',
    templateUrl: './logs.component.html',
    styleUrls: ['./logs.component.scss']
})
export class LogsComponent implements OnInit {

    logService: LogService;
    LogView = LogView;
    graphTemplate = '';
    selectedNodes: number[] = [];
    graphRows: Log[][] = [];
    showExplanation = true;

    constructor(logService: LogService, private domSanitizer: DomSanitizer) {
        this.logService = logService;
        this.logService.getTree()
            .then(tree => {
                const row = [];
                if (!tree) return;
                for (const node of tree) {
                    row.push(node);
                }
                this.graphRows[0] = row;
            });
    }

    ngOnInit() {
    }

    getGraphTemplate(): SafeHtml {
        return this.domSanitizer.bypassSecurityTrustHtml(this.graphTemplate);
    }

    selectNode(node: Log, row: number): void {
        this.graphRows = this.graphRows || [];
        while (this.graphRows[this.graphRows.length - 1].filter(child => child.id === node.id).length === 0) {
            this.graphRows.splice(this.graphRows.length - 1, 1);
            this.selectedNodes.splice(this.selectedNodes.length - 1, 1);
        }
        this.selectedNodes[row] = node.id;
        if (!node.children) {
            return;
        }
        this.graphRows.push(node.children);
    }

}
