export interface Visitor<V extends AbstractVisitor<any>> {
    impl: V;
    context: V['_C'];
}

export interface VisitorContext {
    state: number;
}

export interface ChildVisitorContext<
    P = AbstractVisitor<any>
> extends VisitorContext {
    parent: P;
}

export const INITIAL_STATE = 0;
export const FINALIZED_FLAG    = 0b0000_0001;

export abstract class AbstractVisitor<C extends VisitorContext> {
    public _C!: C;

    public isFinalized(context: C): boolean {
        return (context.state & FINALIZED_FLAG) > 0;
    }
    public setFinalized(context: C) {
        context.state = context.state | FINALIZED_FLAG;
    }

    public abstract initialize(): C;

    public abstract addMetadata(context: C, kind: string): void;
    public abstract getMetadata(context: C, kind: string): void;

    public abstract finalize(context: C): any;
}

export abstract class AbstractValueVisitor<
    C extends VisitorContext,
> extends AbstractVisitor<C> {
    public abstract visitValue(context: C, value: any): void;
    public abstract visitObject(context: C): AbstractObjectVisitor<any>;
    public abstract visitArray(context: C): AbstractArrayVisitor<any>;
}

export abstract class AbstractObjectVisitor<
    C extends ChildVisitorContext,
> extends AbstractVisitor<C> {
    public abstract visitProperty(context: C): AbstractObjectKeyVisitor<any>;
}

export abstract class AbstractObjectKeyVisitor<
    C extends ChildVisitorContext<AbstractObjectVisitor<any>>
> extends AbstractVisitor<C> {
    public abstract visitKey(context: C, key: any): AbstractValueVisitor<any>;
}

export abstract class AbstractArrayVisitor<
    C extends ChildVisitorContext,
> extends AbstractVisitor<C> {
    public abstract visitItem(context: C): AbstractValueVisitor<any>;
}
