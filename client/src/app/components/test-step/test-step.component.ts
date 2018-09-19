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
}

export enum TestStepEventType {
    delete,
    variableNameChange,
    subscribe,
    unsubscribe,
    sObjectCompleteChange,
    sObjectStartChange
}

export interface TestStepEvent {
    type: TestStepEventType;
    payload: any;
    step: TestStep;
}

export class TestStep {
    conditions: Condition[] = [];
    maxConditionId = -1;
    private id: number;
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

    getId(): number {
        return this.id;
    }

    newCondition(): void {
        // Make id 1 greater than the current greatest, or 1 if there are none
        this.maxConditionId += 1;
        const id = this.maxConditionId;
        this.conditions.push({ id: id, field: { selectedOption: undefined }, value: undefined });
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

    constructor(private modalService: SuiModalService, private metadataService: MetadataService,
        private logService: LogService) {
        this.metadataService.describeOptions.subscribe(describes => {
            this.dim.emit(false);
        });
    }

    emitString(type: string, payload: any) {
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
                this.step.formDimmed = false;
                if (!sObject) {
                    console.log('no sobject');
                    // err occurred
                    return;
                }
                this.step.sObject = sObject;
                this.step.fieldOptions = [];
                console.log('setting options');
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
        console.log('in change');
        if (this.step.type.id === 'insert') {
            console.log('in insert');
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


    /*
    submit(): void {

      const config = new TemplateModalConfig<any, string, string>(this.modalTemplate);

      config.closeResult = 'closed!';

      this.modalService
        .open(config)
        .onApprove(result => {
          this.dim.emit('Your test is running now');

          const initialFields = [];
          const initialValues = [];
          for (const pair of this.step.conditions) {
            initialFields.push(pair.field.selectedOption.id);
            initialValues.push(pair.value);
          }
          const updatedFields = [];
          const updatedValues = [];
          for (const pair of this.step.postconditions) {
            updatedFields.push(pair.field.selectedOption.id);
            updatedValues.push(pair.value);
          }
          console.log(this.step.sObject.describe.name);
          console.log(initialFields);
          console.log(initialValues);
          console.log(updatedFields);
          console.log(updatedValues);
          this.logService.executeDynamicTest(
            this.step.sObject.describe.name,
            initialFields,
            initialValues,
            updatedFields,
            updatedValues
          ).then(res => {
            this.dim.emit(false);
          });
        });
    }
    */
}
