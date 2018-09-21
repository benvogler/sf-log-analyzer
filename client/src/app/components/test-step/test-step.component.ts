import { Component, EventEmitter, OnInit, Output, ViewChild, Input } from '@angular/core';
import { SuiModalService, ModalTemplate, SuiSelectModule } from 'ng2-semantic-ui';
import { SObject } from '../../../../../typings/metadata';
import { MetadataService } from '../../services/metadata.service';
import { LogService } from '../../services/log.service';

export interface Option {
    id: string;
    name: string;
}

interface Field {
    selectedOption: Option;
}

interface Condition {
    field: Field;
    value: any;
    id: number;
    picklistOptions?: Option[];
    type: string;
    sObjectType?: string;
    referenceOptions?: Option[];
}

export enum TestStepEventType {
    delete,
    variableNameChange,
    subscribe,
    unsubscribe,
    sObjectCompleteChange,
    sObjectStartChange,
    fieldChange
}

export interface TestStepEvent {
    type: TestStepEventType;
    payload: any;
    step: TestStep;
}

export class TestStep {
    conditions: Condition[] = [];
    maxConditionId = -1;
    id: number;
    typeOptions: Option[] = [];
    fieldOptions: Option[] = [];
    type: Option;
    sObject: SObject;
    selectedSObject: Option;
    canDelete: boolean;
    variableName: string;
    updateVariable: Option;
    previousVariables: Option[] = [];
    formDimmed = false;
    subscribed: TestStep;
    subscribers: TestStep[] = [];
    show = true;

    private insert: Option = {
        id: 'insert',
        name: 'Insert'
    };

    private update: Option = {
        id: 'update',
        name: 'Update'
    };

    constructor(id) {
        this.changeId(id);
        this.newCondition();
    }

    changeId(id): void {
        if (id === this.id) {
            return;
        }
        this.id = id;
        this.typeOptions = this.id === 1 ? [this.insert] : [this.insert, this.update];
        if (!this.type) {
            this.type = this.typeOptions[0];
        }
    }

    newCondition(): void {
        // Make id 1 greater than the current greatest, or 1 if there are none
        this.maxConditionId += 1;
        const id = this.maxConditionId;
        this.conditions.push({ id: id, field: { selectedOption: undefined }, value: undefined, type: undefined, picklistOptions: [] });
    }

    removeCondition(condition: Condition): void {
        this.conditions = this.conditions.filter(compare => compare.id !== condition.id);
    }
}

@Component({
    selector: 'app-test-step',
    templateUrl: './test-step.component.html',
    styleUrls: ['./test-step.component.scss']
})
export class TestStepComponent implements OnInit {

    @ViewChild('modalTemplate')
    public modalTemplate: ModalTemplate<any, string, string>;

    @Output() dim = new EventEmitter<string | boolean>();

    @Output() event = new EventEmitter<TestStepEvent>();

    @Input() step: TestStep;

    lastInputTime = new Date();

    fields = [];

    constructor(private modalService: SuiModalService, private metadataService: MetadataService,
        private logService: LogService) {
        this.metadataService.describeOptions.subscribe(describes => {
            this.dim.emit(false);
        });
    }

    emitString(type: string, payload?: any) {
        if (TestStepEventType[type] !== undefined) {
            this.emit(TestStepEventType[type], payload);
        } else {
            console.log('Unknown event type', type);
            console.log(TestStepEventType);
            console.log(TestStepEventType['subscribe']);
            console.log(TestStepEventType['delete']);
        }
    }

    emit(type: TestStepEventType, payload: any) {
        // Prevent input events from spamming for loops and causing memory issues
        if (type === TestStepEventType.variableNameChange) {
            const now = new Date();
            console.log(now.getTime() - this.lastInputTime.getTime());
            if ((now.getTime() - this.lastInputTime.getTime()) < 500) {
                this.lastInputTime = now;
                setTimeout(() => {
                    if (this.lastInputTime === now) {
                        const newEvent: TestStepEvent = {
                            type: type,
                            payload: payload,
                            step: this.step
                        };
                        this.event.emit(newEvent);
                    }
                }, 500);
                return;
            } else {
                this.lastInputTime = now;
            }
        }
        const event: TestStepEvent = {
            type: type,
            payload: payload,
            step: this.step
        };
        // Notify parent
        this.event.emit(event);
    }

    ngOnInit() {
    }

    setSObject(option: Option) {

        console.log(option);
        this.step.formDimmed = true;
        this.metadataService.getSObject(option.id)
            .then(sObject => {
                console.log('sObject', sObject);
                this.step.formDimmed = false;
                if (!sObject) {
                    console.log('no sobject');
                    // err occurred
                    return;
                }
                this.step.sObject = sObject;
                this.step.fieldOptions = [];
                console.log('setting options');
                this.fields = sObject.fields;
                for (const field of sObject.fields) {
                    this.step.fieldOptions.push({
                        id: field.name,
                        name: field.label
                    });
                }
                console.log(this.step.fieldOptions);
                this.emit(TestStepEventType.sObjectCompleteChange, this.step.selectedSObject);
            });
    }

    changeType(): void {
        if (this.step.type.id === 'insert') {
            this.emit(TestStepEventType.unsubscribe, this.step.updateVariable);
            if (this.step.selectedSObject) {
                this.setSObject(this.step.selectedSObject);
            } else {
                this.step.fieldOptions = [];
            }
        } else {
            this.step.variableName = undefined;
        }
    }

    onChangeField(option: Option, condition: Condition) {
        let updateField = true;
        let field = this.fields.filter(f => f.name === option.id)[0];
        if (!field) return;
        console.log('using', field);
        condition.type = field.type;
        if (field.type === 'picklist') {
            condition.picklistOptions = field.picklistValues.map(value => {
                return {
                    'id': value.value,
                    'name': value.label
                };
            }) || [];
            console.log('condition', condition);
        } else if (field.type === 'reference') {
            console.log('set sObjectType', condition.sObjectType);
            condition.sObjectType = field.referenceTo[0];
        }
        this.emit(TestStepEventType.fieldChange, field);
    }

    logPickist(data) {
        console.log(data);
    }
}
