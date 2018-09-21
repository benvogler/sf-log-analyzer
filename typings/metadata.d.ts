export interface SObjectDescribe {
    createable: boolean;
    label: string;
    name: string;
    queryable: boolean;
    updateable: boolean;
}

export interface SObject {
    describe: SObjectDescribe;
    fields: SObjectField[];
}

export interface PicklistValue {
    active: boolean;
    defaultValue: boolean;
    label: string;
    validFor?: any;
    value: string;
}

export interface SObjectField {
    name: string;
    label: string;
    length?: number;
    type: SFDataType;
    createable: boolean;
    updateable: boolean;
    picklistValues?: Array<PicklistValue>
    referenceTo?: Array<string>
}

export enum SFDataType {
    id,
    reference,
    integer,
    textarea,
    string,
    double,
    date,
    datetime,
    boolean,
    picklist,
    address
}