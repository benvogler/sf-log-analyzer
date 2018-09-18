import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { HttpClientModule } from '@angular/common/http';
import { SuiModule } from 'ng2-semantic-ui';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

import { SessionService } from './services/session.service';

@NgModule({
    declarations: [
        AppComponent,
        LoginComponent,
        SidebarComponent
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        FlexLayoutModule,
        SuiModule
    ],
    providers: [
        SessionService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
