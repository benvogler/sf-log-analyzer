import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TestExecutionComponent } from './components/test-execution/test-execution.component';
import { LogsComponent } from './components/logs/logs.component';
import { ToolbarItems } from './components/toolbar/toolbar.component';
import { LogView } from './services/log.service';

const defaultRoute = 'test';

const routes: Routes = [
    {
        path: '',
        redirectTo: defaultRoute,
        pathMatch: 'full'
    },
    {
        path: 'test',
        component: TestExecutionComponent,
        data: {
            toolbarItems: [
                ToolbarItems.file
            ]
        }
    },
    {
        path: 'logs',
        component: LogsComponent,
        data: {
            toolbarItems: [
                ToolbarItems.file,
                ToolbarItems.view,
                ToolbarItems.debug,
                ToolbarItems.scope,
                ToolbarItems.hideEmpty
            ],
            views: [
                {
                    view: LogView.console,
                    toolbarItems: [
                        ToolbarItems.file,
                        ToolbarItems.view,
                        ToolbarItems.debug,
                        ToolbarItems.scope,
                        ToolbarItems.search
                    ]
                },
                {
                    view: LogView.table,
                    toolbarItems: [
                        ToolbarItems.file,
                        ToolbarItems.view,
                        ToolbarItems.debug,
                        ToolbarItems.scope,
                        ToolbarItems.search
                    ]
                },
                {
                    view: LogView.graph,
                    toolbarItems: [
                        ToolbarItems.file,
                        ToolbarItems.view,
                        ToolbarItems.hideEmpty
                    ]
                }
            ]
        }
    },
    {
        path: '',
        component: TestExecutionComponent
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: false })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
