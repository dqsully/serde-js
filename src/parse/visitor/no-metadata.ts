import {
    AbstractValueVisitor,
    AbstractObjectVisitor,
    AbstractArrayVisitor,
    Visitors,
    AbstractObjectKeyVisitor,
} from './abstract';
import { VisitorContext } from './context';

interface ValueContext extends VisitorContext {
    value?: any;
}
interface ObjectContext extends VisitorContext {
    value: {[key: string]: any};
    key: string | undefined;
}
interface ArrayContext extends VisitorContext {
    value: any[];
}

export type NoMetadataValueVisitor = AbstractValueVisitor<ValueContext>;
const NoMetadataValueVisitor: NoMetadataValueVisitor = {
    _C: null!,

    initialize() {
        return VisitorContext.new();
    },

    addMetadata() {},
    getMetadata() {
        return undefined;
    },

    finalize(context: ValueContext) {
        VisitorContext.assertIsSet(context, 'Did not visit a value');

        return context.value;
    },

    visitValue(context: ValueContext, value: any) {
        VisitorContext.assertIsNotSet(context, 'Already visited a value');
        VisitorContext.set(context);

        context.value = value;
    },
};

export type NoMetadataObjectVisitor = AbstractObjectVisitor<ObjectContext>;
const NoMetadataObjectVisitor: NoMetadataObjectVisitor = {
    _C: null!,

    initialize() {
        return {
            ...VisitorContext.new(),
            value: {},
            key: undefined,
        };
    },

    addMetadata() {},
    getMetadata() {
        return undefined;
    },

    finalize(context: ObjectContext) {
        VisitorContext.assertIsNotSet(context, 'Already finalized this object');
        VisitorContext.assertDoesntHaveScratch(context, 'Unfinished object key visit');
        VisitorContext.set(context);

        return context.value;
    },

    visitValue(context: ObjectContext, value: any) {
        VisitorContext.assertHasScratch(context, 'Not visiting a key yet');
        VisitorContext.clearHasScratch(context);

        context.value[context.key!] = value;
    },

    seedKey(context: ObjectContext) {
        VisitorContext.getLock(context, 'Already seeding a key');

        return {
            context,
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            impl: NoMetadataObjectKeyVisitor,
        };
    },
};

export type NoMetadataObjectKeyVisitor = AbstractObjectKeyVisitor<ObjectContext>;
const NoMetadataObjectKeyVisitor: NoMetadataObjectKeyVisitor = {
    _C: null!,

    addMetadata() {},
    getMetadata() {
        return undefined;
    },

    finalize(context: ObjectContext) {
        VisitorContext.assertHasScratch(context, 'Did not visit a key');
        VisitorContext.releaseLock(context);
    },

    visitValue(context: ObjectContext, value: any) {
        if (typeof value !== 'string') {
            throw new Error('Cannot visit a key that isn\'t a string');
        }

        VisitorContext.assertDoesntHaveScratch(context, 'Already visited a key');
        VisitorContext.setHasScratch(context);

        context.key = value;
    },
};

export type NoMetadataArrayVisitor = AbstractArrayVisitor<ArrayContext>;
const NoMetadataArrayVisitor: NoMetadataArrayVisitor = {
    _C: null!,

    initialize() {
        return {
            ...VisitorContext.new(),
            value: [],
        };
    },

    addMetadata() {},
    getMetadata() {
        return undefined;
    },

    finalize(context: ArrayContext) {
        VisitorContext.assertIsNotSet(context, 'Already finalized this array');
        VisitorContext.set(context);

        return context.value;
    },

    visitValue(context: ArrayContext, value: any) {
        context.value.push(value);
    },
};

const visitors: Visitors = {
    value: NoMetadataValueVisitor,
    object: NoMetadataObjectVisitor,
    objectKey: NoMetadataObjectKeyVisitor,
    array: NoMetadataArrayVisitor,
};

export default visitors;
