export type MetadataValue = boolean | number | string;

export interface MetadataRecord {
    kind: string;
    value: MetadataValue;
}

export type MetadataMap = {[kind: string]: MetadataValue};
