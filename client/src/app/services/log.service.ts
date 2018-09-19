import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TestStep } from '../components/test-step/test-step.component';

export interface Log {
    id: number;
    time: string;
    code: number;
    content: string;
    isDebug: boolean;
    isStart: boolean;
    isEnd: boolean;
    children?: Array<Log>;
    parentId?: number;
}

export enum Filter {
    debug = 'isDebug',
}

export enum LogView {
    table,
    console,
    graph
}

@Injectable()
export class LogService {

    logs: Array<Log>;
    tree: Array<Log>;
    scopeLog: Log;
    private initialBuild = true;
    private filters: Array<Filter> = [];
    view: LogView = LogView.graph;
    hideEmpty = false;

    constructor(private http: HttpClient) {
        // this.executeDynamicTest();
    }

    getLogs(rebuild = false): Log[] {
        if (rebuild || !this.logs) {
            this.buildLogs();
        }
        return this.logs;
    }

    async getTree(rebuild = false): Promise<Log[]> {
        this.getLogs(rebuild);
        return this.tree;
    }

    filter(f: Filter, remove?: boolean): void {
        if (remove) {
            this.filters.splice(this.filters.indexOf(f), 1);
        } else if (!this.filters.includes(f)) {
            this.filters.push(f);
        } else {
            return;
        }
        this.logs = [];
        this.scopeLog ? this.scope(this.scopeLog.id) : this.buildLogs();
    }

    buildLogs(tree?: Array<Log>, parent?: Log, recursive?: boolean): void {
        if (!tree) {
            tree = this.tree;
            if (!tree) return;
            this.scopeLog = undefined;
        }

        if (parent && !recursive) {
            this.scopeLog = parent;
        }

        if (!this.logs) {
            this.logs = [];
        }

        for (const node of tree) {
            node.isStart = node.children !== undefined;
            if (this.initialBuild && parent) {
                node.parentId = parent.id;
            }
            let match = true;
            this.filters.forEach(filter => {
                if (!node[filter]) {
                    match = false;
                }
            });
            if (match) {
                this.logs.push(node);
            }
            if (node.children) {
                node.children[node.children.length - 1].isEnd = true;
                this.buildLogs(node.children, node, true);
            }
        }
    }

    scope(id: number, tree?: Array<Log>): void {
        if (!tree) {
            tree = this.tree;
        }

        for (const node of tree) {
            if (node.id === id) {
                this.logs = [];
                this.buildLogs([node], node);
                break;
            } else if (node.isStart) {
                this.scope(id, node.children);
            }
        }
    }

    unscope(id?: number, tree?: Array<Log>): void {
        if (!id) {
            id = this.tree[0].id;
        }

        if (!tree) {
            tree = this.tree;
        }

        for (const node of tree) {
            if (node.id === id) {
                this.logs = [];
                const parent = this.getLog(node.parentId);
                if (parent) {
                    const grandparent = this.getLog(parent.parentId);
                    if (grandparent) {
                        this.buildLogs([grandparent], grandparent);
                    } else {
                        this.buildLogs();
                    }
                } else {
                    this.buildLogs();
                }
                return;
            } else if (node.isStart) {
                this.unscope(id, node.children);
            }
        }
    }

    getLog(id: number, tree?: Array<Log>): Log {
        if (!tree) {
            tree = this.tree;
        }

        for (const node of tree) {
            if (node.id === id) {
                return node;
            } else if (node.isStart) {
                const result = this.getLog(id, node.children);
                if (result) {
                    return result;
                }
            }
        }

        return undefined;
    }

    executeDynamicTest(steps: TestStep[]): Promise<Log[]> {
        return this.http.post('/api/test/execute/', steps).toPromise()
            .then((res: any) => {
                this.tree = res;
                console.log('tree', this.tree);
                this.buildLogs();
                this.initialBuild = false;
                return this.logs;
            })
            .catch(err => {
                console.log(err);
                return Promise.reject(err);
            });
    }

}
