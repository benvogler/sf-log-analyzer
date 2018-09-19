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

export interface SObjectField {
    name: string;
    label: string;
    length?: number;
    type: SFDataType;
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