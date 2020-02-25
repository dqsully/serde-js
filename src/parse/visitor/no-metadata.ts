import {
    AbstractRootVisitor,
    AbstractObjectVisitor,
    AbstractArrayVisitor,
    Visitors,
    AbstractObjectKeyVisitor,
} from './abstract';
import { VisitorContext } from './context';

interface RootContext extends VisitorContext {
    value?: any;
}
interface ObjectContext extends VisitorContext {
    value: {[key: string]: any};
    key: string | undefined;
}
interface ArrayContext extends VisitorContext {
    value: any[];
}

export type NoMetadataValueVisitor = AbstractRootVisitor<RootContext>;
const NoMetadataRootVisitor: NoMetadataValueVisitor = {
    _C: null!,

    initialize() {
        return VisitorContext.new();
    },

    pushInvisible() {},
    setMetadata() {},

    finalize(context: RootContext) {
        VisitorContext.assertIsSet(context, 'Did not visit a value');

        return context.value;
    },

    visitValue(context: RootContext, value: any) {
        VisitorContext.assertIsNotSet(context, 'Already visited a value');
        VisitorContext.set(context);

        context.value = value;
    },
};

export type NoMetadataObjectVisitor = AbstractObjectVisitor<ObjectContext, any>;
const NoMetadataObjectVisitor: NoMetadataObjectVisitor = {
    _C: null!,

    initialize() {
        return {
            ...VisitorContext.new(),
            value: {},
            key: undefined,
        };
    },

    pushInvisible() {},
    setMetadata() {},

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

    pushInvisible() {},
    setMetadata() {},

    finalize(context: ObjectContext) {
        VisitorContext.assertHasScratch(context, 'Did not visit a key');
        VisitorContext.releaseLock(context, 'Key has already been finalized or aborted');
    },

    abort(context: ObjectContext) {
        VisitorContext.assertDoesntHaveScratch(context, 'Visited a key but aborted');
        VisitorContext.releaseLock(context, 'Key has already been finalized or aborted');
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

export type NoMetadataArrayVisitor = AbstractArrayVisitor<ArrayContext, any>;
const NoMetadataArrayVisitor: NoMetadataArrayVisitor = {
    _C: null!,

    initialize() {
        return {
            ...VisitorContext.new(),
            value: [],
        };
    },

    pushInvisible() {},
    setMetadata() {},

    finalize(context: ArrayContext) {
        VisitorContext.assertIsNotSet(context, 'Already finalized this array');
        VisitorContext.set(context);

        return context.value;
    },

    visitValue(context: ArrayContext, value: any) {
        context.value.push(value);
    },

    markNextValue() {},
};

const visitors: Visitors = {
    root: NoMetadataRootVisitor,
    object: NoMetadataObjectVisitor,
    objectKey: NoMetadataObjectKeyVisitor,
    array: NoMetadataArrayVisitor,
};

export default visitors;
