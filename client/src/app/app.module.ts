import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { SuiModule } from 'ng2-semantic-ui';
import { AppRoutingModule } from './app.routing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

import { TestExecutionComponent } from './components/test-execution/test-execution.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { TestStepComponent } from './components/test-step/test-step.component';
import { LogsComponent } from './components/logs/logs.component';
import { MessageComponent } from './components/message/message.component';

import { SessionService } from './services/session.service';
import { MetadataService } from './services/metadata.service';
import { LogService } from './services/log.service';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        SidebarComponent,
        TestExecutionComponent,
        ToolbarComponent,
        TestStepComponent,
        LogsComponent,
        MessageComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        FlexLayoutModule,
        AppRoutingModule,
        SuiModule,
        FormsModule,
        BrowserAnimationsModule
    ],
    providers: [
        SessionService,
        MetadataService,
        LogService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
