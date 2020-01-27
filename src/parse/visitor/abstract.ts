import { VisitorContext } from './context';

type MetadataValueAtom = boolean | number | string;
export type MetadataValue = MetadataValueAtom | MetadataValueAtom[];

export interface AbstractVisitor<C extends VisitorContext> {
    _C: C;

    addMetadata(context: C, kind: string, value: MetadataValue): void;
    getMetadata(context: C, kind: string): MetadataValue | undefined;

    visitValue(context: C, value: any): void;
}

export interface AbstractValueVisitor<C extends VisitorContext> extends AbstractVisitor<C> {
    initialize(): C;
    finalize(context: C): any;
}

export interface AbstractObjectVisitor<C extends VisitorContext> extends AbstractVisitor<C> {
    initialize(): C;
    finalize(context: C): object;

    seedKey(context: C): Visitor<AbstractObjectKeyVisitor<any>>;
}

export interface AbstractObjectKeyVisitor<C extends VisitorContext> extends AbstractVisitor<C> {
    finalize(context: C): void;
}

export interface AbstractArrayVisitor<C extends VisitorContext> extends AbstractVisitor<C> {
    initialize(): C;
    finalize(context: C): any[];
}

export interface Visitor<V extends AbstractVisitor<any> = AbstractVisitor<any>> {
    impl: V;
    context: ReturnType<V['_C']>;
}

export interface Visitors {
    value: AbstractValueVisitor<VisitorContext>,
    object: AbstractObjectVisitor<VisitorContext>,
    objectKey: AbstractObjectKeyVisitor<VisitorContext>,
    array: AbstractArrayVisitor<VisitorContext>,
}
