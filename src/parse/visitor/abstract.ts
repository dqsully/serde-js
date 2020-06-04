import { VisitorContext } from './context';
import { MetadataValue } from '../../types/metadata';

export interface AbstractVisitor<C extends VisitorContext> {
    _C: C;

    pushInvisible(context: C, kind: string, value: MetadataValue): void;
    setMetadata(context: C, kind: string, value: MetadataValue): void;

    visitValue(context: C, value: any): void;
}

export interface AbstractRootVisitor<
    C extends VisitorContext,
> extends AbstractVisitor<C> {
    initialize(): C;
    finalize(context: C): any;
}

export interface AbstractObjectVisitor<
    C extends VisitorContext,
    PC extends VisitorContext,
> extends AbstractVisitor<C> {
    initialize(parent: PC): C;
    finalize(context: C): any;

    seedKey(context: C): Visitor<AbstractObjectKeyVisitor<any>>;
}

export interface AbstractObjectKeyVisitor<
    C extends VisitorContext,
> extends AbstractVisitor<C> {
    finalize(context: C): void;
    abort(context: C): void;
}

export interface AbstractArrayVisitor<
    C extends VisitorContext,
    PC extends VisitorContext,
> extends AbstractVisitor<C> {
    initialize(parent: PC): C;
    finalize(context: C): any;

    markNextValue(context: C): void;
}

export interface Visitor<V extends AbstractVisitor<any> = AbstractVisitor<any>> {
    impl: V;
    context: ReturnType<V['_C']>;
}

export interface Visitors {
    root: AbstractRootVisitor<VisitorContext>;
    object: AbstractObjectVisitor<VisitorContext, VisitorContext>;
    objectKey: AbstractObjectKeyVisitor<VisitorContext>;
    array: AbstractArrayVisitor<VisitorContext, VisitorContext>;
}
