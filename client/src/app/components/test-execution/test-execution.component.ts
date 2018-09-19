import { Component, OnInit, ViewChild } from '@angular/core';
import { trigger, style, state, animate, transition } from '@angular/animations';
import { MetadataService } from '../../services/metadata.service';
import { LogService } from '../../services/log.service';
import { TestStep, Option, TestStepEvent, TestStepEventType } from '../test-step/test-step.component';
import { TemplateModalConfig, ModalTemplate, SuiModalService } from 'ng2-semantic-ui';

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
export class TestExecutionComponent implements OnInit {

    @ViewChild('modalTemplate')
    public modalTemplate: ModalTemplate<any, string, string>;

    dimmed = true;
    dimMessage = 'Loading';
    steps: TestStep[] = [];

    constructor(private metadataService: MetadataService, private logService: LogService, private modalService: SuiModalService) {
        this.createStep();
        this.metadataService.describeOptions.subscribe(() => {
            if (this.dimMessage === 'Loading') this.dimmed = false;
        });
    }

    ngOnInit() {
    }

    dim(event: any): void {
        if (typeof event === 'boolean') {
            this.dimmed = event;
        } else if (typeof event === 'string') {
            this.dimMessage = event;
            this.dimmed = true;
        }
    }

    deleteStep(step: TestStep): void {
        this.steps = this.steps.filter(currentStep => currentStep.getId() !== step.getId());
        this.updateSteps();
    }

    createStep(): void {
        this.steps.push(new TestStep(this.steps.length + 1));
        this.updateSteps();
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
                    id: this.steps[i].getId().toString(),
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
                .then(() => this.dimmed = false);
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
                    if (step.getId().toString() === id) {
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
                event.step.subscribed.subscribers = event.step.subscribed.subscribers.filter(step => step.getId() !== event.step.getId());
                // Remove the step's reference to the subscribed step
                event.step.subscribed = undefined;
                event.step.updateVariable = undefined;
                break;
            // When the name input field changes, update the subscribers
            case TestStepEventType.variableNameChange:
                this.updateSteps();
                break;
            // When the sObject field changes, dim the subscribers
            case TestStepEventType.sObjectStartChange:
                for (const step of event.step.subscribers) {
                    step.formDimmed = true;
                }
                break;
            case TestStepEventType.sObjectCompleteChange:
                for (const step of event.step.subscribers) {
                    step.formDimmed = false;
                    step.fieldOptions = event.step.fieldOptions;
                }
                break;
        }
    }

}
