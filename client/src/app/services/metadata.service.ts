import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SObject, SObjectDescribe } from '../../../../typings/metadata';
import { Option } from '../components/test-step/test-step.component';
import { ReplaySubject } from '../../../node_modules/rxjs';

@Injectable()
export class MetadataService {

    private describes: Array<SObjectDescribe> = [];
    describeOptions = new ReplaySubject<Option[]>();

    constructor(private http: HttpClient) {
        this.getSObjectDescribes();
    }

    private async getSObjectDescribes() {
        const describes = await this.http.get<SObjectDescribe[]>('/api/sobjects').toPromise();
        const describeOptions: Option[] = [];
        this.describes = describes;
        for (const describe of this.describes) {
            describeOptions.push({
                id: describe.name,
                name: describe.label
            });
        }
        this.describeOptions.next(describeOptions);
    }

    async getSObject(sObjectName: string): Promise<any | void> {
        try {
            const res = await this.http.get<any>(`/api/sobject/${sObjectName}`).toPromise();
            console.log(res);
            const describeFields = ['createable', 'label', 'name', 'queryable', 'updateable'];
            const fields = [];
            for (const field of res.fields) {
                fields.push({
                    name: field.name,
                    label: field.label,
                    length: field.length,
                    type: field.type
                });
            }
            const sObject: SObject = {
                describe: {
                    createable: res['createable'],
                    label: res['label'],
                    name: res['name'],
                    queryable: res['queryable'],
                    updateable: res['updateable']
                },
                fields: fields
            };
            console.log(sObject);
            return sObject;
        } catch (err) {
            return err;
        }
    }

}
