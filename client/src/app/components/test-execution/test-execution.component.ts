import { Component, OnInit, ViewChild, AfterViewInit, ViewChildren, QueryList } from '@angular/core';
import { trigger, style, state, animate, transition } from '@angular/animations';
import { Router } from '@angular/router';
import { TemplateModalConfig, ModalTemplate, SuiModalService } from 'ng2-semantic-ui';
import { MetadataService } from '../../services/metadata.service';
import { LogService } from '../../services/log.service';
import { TestStep, Option, TestStepEvent, TestStepEventType, TestStepComponent } from '../test-step/test-step.component';
import { MessageComponent } from '../message/message.component';

@Component({
    selector: 'app-test-execution',
    templateUrl: './test-execution.component.html',
    styleUrls: ['./test-execution.component.scss'],
    animations: [
    trigger('fadeIn', [
        transition(':enter', [
            style({ opacity: '0' }),
            animate('1s ease-out', style({ opacity: '1' })),
            ]),
        ]),
    ]
})
export class TestExecutionComponent implements OnInit, AfterViewInit {

    @ViewChild('modalTemplate')
    public modalTemplate: ModalTemplate<any, string, string>;

    @ViewChild('testDataSuccess')
    testDataSuccessToast: MessageComponent;

    @ViewChildren(TestStepComponent)
    public stepComponents: QueryList<TestStepComponent>;

    showExplanation = true;
    dimmed = true;
    showComplete = false;
    dimMessage = 'Loading';
    steps: TestStep[] = [];
    isFillingTestData = false;

    constructor(private metadataService: MetadataService, private logService: LogService,
                private modalService: SuiModalService, private router: Router) {
        this.createStep();
        this.metadataService.describeOptions.subscribe(() => {
            if (this.dimMessage === 'Loading') {
                this.showComplete = false;
                this.dimmed = false;
            }
        });
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.stepComponents.notifyOnChanges();
    }

    dim(event: any): void {
        if (typeof event === 'boolean') {
            this.showComplete = false;
            this.dimmed = event;
        } else if (typeof event === 'string') {
            this.showComplete = false;
            this.dimMessage = event;
            this.dimmed = true;
        }
    }

    deleteStep(step: TestStep): void {
        this.steps = this.steps.filter(currentStep => currentStep.id !== step.id);
        this.updateSteps();
    }

    createStep(): void {
        this.steps.push(new TestStep(this.steps.length + 1));
        this.updateSteps();
    }

    populateReferenceConditions() {
        this.steps.forEach((step, i) => {
            // Get the steps that are the same data type of each condition
            step.conditions.forEach(condition => {
                let referenceOptions: Option[] = [];
                this.steps.forEach((innerStep, j) => {
                    console.log('i !== j', (i !== j), 'innerStep.type.id === \'insert\'', innerStep.type.id,
                    'innerStep.sObject', innerStep.sObject, 'describe.name', innerStep.sObject.describe.name, 'condition.sObjectType',
                    condition.sObjectType, step, innerStep, condition);
                    if (i !== j && innerStep.type.id === 'insert' && innerStep.sObject &&
                        innerStep.sObject.describe.name === condition.sObjectType) {
                        referenceOptions.push({
                            'id': innerStep.variableName,
                            'name': innerStep.variableName
                        });
                    }
                });
                condition.referenceOptions = referenceOptions;
                console.log('updated condition', condition);
            });
        });
    }

    updateSteps(offset?: number): void {

        offset = offset || 0;
        const previousVariables: Option[] = [];
        for (let i = 0; i < this.steps.length; i++) {
            this.steps[i].canDelete = this.steps.length - offset > 1;
            this.steps[i].changeId(i + 1);
            this.steps[i].previousVariables = JSON.parse(JSON.stringify(previousVariables));
            if (this.steps[i].variableName && this.steps[i].variableName !== '') {
                previousVariables.push({
                    id: this.steps[i].id.toString(),
                    name: this.steps[i].variableName
                });
            }
            if (!this.steps[i].updateVariable) {
                continue;
            }
            for (const option of this.steps[i].previousVariables) {
                if (option.id === this.steps[i].updateVariable.id) {
                    this.steps[i].updateVariable = option;
                }
            }
        }
    }

    updateFieldsForSObject(event: Option, step: TestStep): void {
        for (const currentStep of this.steps) {
            if (currentStep.updateVariable && currentStep.updateVariable.name === step.variableName) {
                currentStep.fieldOptions = step.fieldOptions;
                currentStep.formDimmed = false;
            }
        }
    }

    dimChildren(event: Option, step: TestStep): void {
        for (const currentStep of this.steps) {
            if (currentStep.updateVariable && currentStep.updateVariable.name === step.variableName) {
                currentStep.formDimmed = true;
            }
        }
    }

    runTest(): void {
        const config = new TemplateModalConfig<any, string, string>(this.modalTemplate);

        config.closeResult = 'closed!';

        this.modalService
            .open(config)
            .onApprove(result => {
                this.dimMessage = 'Your test is running now';
                this.showComplete = false;
                this.dimmed = true;
                const steps = [];
                for (const step of this.steps) {
                    steps.push({
                        type: step.type,
                        selectedSObject: step.selectedSObject,
                        variableName: step.variableName,
                        conditions: step.conditions
                    });
                }
                this.logService.executeDynamicTest(steps)
                .then(() => {
                    this.showComplete = true;
                    window.setTimeout(() => {
                        this.dimmed = false;
                        this.router.navigate(['logs']);
                    }, 500);
                });
            });
    }

    listen(event: TestStepEvent) {
        console.log(TestStepEventType[event.type], event);
        switch (event.type) {
            case TestStepEventType.delete:
                event.step.show = false;
                this.updateSteps(1);
                setTimeout(() => this.deleteStep(event.step), 500);
                break;
            case TestStepEventType.subscribe:
                const id: string = event.payload.id;
                console.log(id);
                for (const step of this.steps) {
                    if (step.id.toString() === id) {
                        console.log('found', step);
                        event.step.fieldOptions = step.fieldOptions;
                        event.step.subscribed = step;
                        step.subscribers.push(event.step);
                        return;
                    }
                }
                break;
            case TestStepEventType.unsubscribe:
                // Remove the step from the subscribed step's subscriber list
                event.step.subscribed.subscribers = event.step.subscribed.subscribers.filter(step => step.id !== event.step.id);
                // Remove the step's reference to the subscribed step
                event.step.subscribed = undefined;
                event.step.updateVariable = undefined;
                break;
            // When the name input field changes, update the subscribers
            case TestStepEventType.variableNameChange:
                this.updateSteps();
                this.populateReferenceConditions();
                break;
            // When the sObject field changes, dim the subscribers
            case TestStepEventType.sObjectStartChange:
                for (const step of event.step.subscribers) {
                    step.formDimmed = true;
                }
                break;
            case TestStepEventType.sObjectCompleteChange:
                this.populateReferenceConditions();
                if (this.isFillingTestData) {
                    let comp: TestStepComponent = this.stepComponents.toArray()[0];
                    comp.step.conditions[0].field.selectedOption = comp.step.fieldOptions.filter(field => field.id === 'Name')[0];
                    this.isFillingTestData = false;
                    this.testDataSuccessToast.show();
                }
                for (const step of event.step.subscribers) {
                    step.formDimmed = false;
                    step.fieldOptions = event.step.fieldOptions;
                }
                break;
            case TestStepEventType.fieldChange:
                this.populateReferenceConditions();
                break;
        }
    }

    async autofillStep() {
        let comp: TestStepComponent = this.stepComponents.toArray()[0];

        this.isFillingTestData = true;
        this.metadataService.describeOptions.subscribe(options => {
            if (this.isFillingTestData) {
                let option = options.filter(opt => opt.id === 'Account')[0];
                comp.step.selectedSObject = option;
                comp.setSObject(option);

                comp.step.variableName = 'accountExample';
                comp.step.conditions[0].value = 'Made-up Company #528';
                // We still need to select the name field, but we'll have to wait for the event to fire since the field
                // describes will be loading in still. This will be handled in the listen function
            }
        });
    }
}
