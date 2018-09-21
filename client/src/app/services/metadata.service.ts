import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SObject, SObjectDescribe, SObjectField } from '../../../../typings/metadata';
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
            console.log('res', res);
            const fields: SObjectField[] = [];
            for (const field of res.fields) {
                fields.push({
                    name: field.name,
                    label: field.label,
                    length: field.length,
                    type: field.type,
                    updateable: field.updateable,
                    createable: field.createable,
                    picklistValues: field.picklistValues,
                    referenceTo: field.referenceTo
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
            return sObject;
        } catch (err) {
            return err;
        }
    }

}
