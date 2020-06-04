/* eslint-disable no-param-reassign */
import { MetadataRecord, MetadataMap, MetadataValue } from '../../types/metadata';
import { VisitorContext } from './context';
import {
    AbstractRootVisitor,
    AbstractObjectVisitor,
    AbstractObjectKeyVisitor,
    AbstractArrayVisitor,
    Visitors,
} from './abstract';

const isWrapped = Symbol('is wrapped');

export interface WrappedBaseMetadata {
    metaBefore?: MetadataRecord[];
    metaAfter?: MetadataRecord[];
    meta?: MetadataMap;
}

export interface WrappedValue extends WrappedBaseMetadata {
    contents: ParsedValue;
}

export interface WrappedObject extends WrappedBaseMetadata {
    contents: ParsedObject;
}

export interface WrappedArray extends WrappedBaseMetadata {
    contents: ParsedArray;
}

export type WrappedAny = WrappedValue | WrappedObject | WrappedArray;

interface MarkedWrapped {
    [isWrapped]: true;
}

export interface ParsedValue {
    type?: undefined;

    value: any;
}

export interface ParsedObjectEntry {
    key: WrappedValue;
    value: WrappedAny;
}

export interface ParsedObject {
    type: 'object';

    children: Map<string, ParsedObjectEntry>;
    metaTail?: MetadataRecord[];
}

export interface ParsedArray {
    type: 'array';

    children: WrappedAny[];
    metaTail?: MetadataRecord[];
}

type ParsedAny = ParsedValue | ParsedObject | ParsedArray;

interface RootContext extends VisitorContext {
    meta: WrappedBaseMetadata;

    value: ParsedAny & MarkedWrapped | undefined;
}

interface ObjectContext extends VisitorContext {
    value: ParsedObject & MarkedWrapped;

    tmpKeyMeta: WrappedBaseMetadata;
    tmpMeta: WrappedBaseMetadata;

    tmpKey: string | undefined;
    tmp: ParsedAny | undefined;
}

interface ArrayContext extends VisitorContext {
    value: ParsedArray & MarkedWrapped;

    tmpMeta: WrappedBaseMetadata;

    tmp: ParsedAny | undefined;
}

type AnyContext = RootContext | ObjectContext | ArrayContext;

export type WrappedMetadataRootVisitor = AbstractRootVisitor<RootContext>;
const WrappedMetadataRootVisitor: WrappedMetadataRootVisitor = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    _C: null!,

    initialize() {
        return {
            ...VisitorContext.new(),
            meta: {},
            value: undefined,
        };
    },

    pushInvisible(context: RootContext, kind: string, value: MetadataValue) {
        if (!VisitorContext.isSet(context)) {
            if (context.meta.metaBefore === undefined) {
                context.meta.metaBefore = [];
            }

            context.meta.metaBefore.push({ kind, value });
        } else {
            if (context.meta.metaAfter === undefined) {
                context.meta.metaAfter = [];
            }

            context.meta.metaAfter.push({ kind, value });
        }
    },
    setMetadata(context: RootContext, kind: string, value: MetadataValue) {
        if (context.meta.meta === undefined) {
            context.meta.meta = {};
        }

        context.meta.meta[kind] = value;
    },

    finalize(context: RootContext) {
        VisitorContext.assertIsSet(context, 'Did not visit a value');

        const wrapped = context.meta as WrappedAny;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        wrapped.contents = context.value!;

        return wrapped;
    },

    visitValue(context: RootContext, value: any) {
        VisitorContext.assertIsNotSet(context, 'Already visited a value');
        VisitorContext.set(context);

        if (typeof value === 'object' && value !== null && value[isWrapped]) {
            delete value[isWrapped];
            context.value = value;
        } else {
            context.value = {
                [isWrapped]: true,
                value,
            };
        }
    },
};

export type WrappedMetadataObjectVisitor = AbstractObjectVisitor<ObjectContext, AnyContext>;
const WrappedMetadataObjectVisitor: WrappedMetadataObjectVisitor = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    _C: null!,

    initialize() {
        return {
            ...VisitorContext.new(),

            value: {
                [isWrapped]: true,
                type: 'object',
                children: new Map(),
            },

            tmpKeyMeta: {},
            tmpMeta: {},

            tmpKey: undefined,
            tmp: undefined,
        };
    },

    pushInvisible(context: ObjectContext, kind: string, value: MetadataValue) {
        VisitorContext.assertNotLocked(context, 'Currently visiting a key, invisibles should be sent there');

        if (VisitorContext.hasScratch(context)) {
            if (context.tmpMeta.metaBefore === undefined) {
                context.tmpMeta.metaBefore = [];
            }

            context.tmpMeta.metaBefore.push({ kind, value });
        } else {
            if (context.tmpMeta.metaAfter === undefined) {
                context.tmpMeta.metaAfter = [];
            }

            context.tmpMeta.metaAfter.push({ kind, value });
        }
    },
    setMetadata(context: ObjectContext, kind: string, value: MetadataValue) {
        if (context.tmpMeta.meta === undefined) {
            context.tmpMeta.meta = {};
        }

        context.tmpMeta.meta[kind] = value;
    },

    finalize(context: ObjectContext) {
        VisitorContext.assertIsNotSet(context, 'Already finalized this object');
        VisitorContext.assertDoesntHaveScratch(context, 'Unfinished object key visit');
        VisitorContext.set(context);

        if (!VisitorContext.isEmpty(context) && context.tmpKey !== undefined) {
            // Record metadata for previous value

            const key = context.tmpKeyMeta as WrappedValue;
            const value = context.tmpMeta as WrappedAny;

            key.contents = { value: context.tmpKey };
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            value.contents = context.tmp!;

            context.value.children.set(context.tmpKey, { key, value });
        }

        return context.value;
    },

    visitValue(context: ObjectContext, value: any) {
        VisitorContext.assertHasScratch(context, 'Not visiting a key yet');
        VisitorContext.clearHasScratch(context);
        VisitorContext.setNotEmpty(context);

        if (typeof value === 'object' && value !== null && value[isWrapped]) {
            delete value[isWrapped];
            context.tmp = value;
        } else {
            context.tmp = { value };
        }
    },

    seedKey(context: ObjectContext) {
        VisitorContext.getLock(context, 'Already seeding a key');

        if (!VisitorContext.isEmpty(context)) {
            // Record metadata for previous value

            const key = context.tmpKeyMeta as WrappedValue;
            const value = context.tmpMeta as WrappedAny;

            key.contents = { value: context.tmpKey };
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            value.contents = context.tmp!;

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            context.value.children.set(context.tmpKey!, { key, value });

            context.tmpKeyMeta = {};
            context.tmpMeta = {};
        }

        context.tmpKey = undefined;

        return {
            context,
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            impl: WrappedMetadataObjectKeyVisitor,
        };
    },
};

export type WrappedMetadataObjectKeyVisitor = AbstractObjectKeyVisitor<ObjectContext>;
const WrappedMetadataObjectKeyVisitor: WrappedMetadataObjectKeyVisitor = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    _C: null!,

    pushInvisible(context: ObjectContext, kind: string, value: MetadataValue) {
        if (!VisitorContext.hasScratch(context)) {
            if (context.tmpKeyMeta.metaBefore === undefined) {
                context.tmpKeyMeta.metaBefore = [];
            }

            context.tmpKeyMeta.metaBefore.push({ kind, value });
        } else {
            if (context.tmpKeyMeta.metaAfter === undefined) {
                context.tmpKeyMeta.metaAfter = [];
            }

            context.tmpKeyMeta.metaAfter.push({ kind, value });
        }
    },
    setMetadata(context: ObjectContext, kind: string, value: MetadataValue) {
        if (context.tmpKeyMeta.meta === undefined) {
            context.tmpKeyMeta.meta = {};
        }

        context.tmpKeyMeta.meta[kind] = value;
    },

    finalize(context: ObjectContext) {
        VisitorContext.assertHasScratch(context, 'Did not visit a key');
        VisitorContext.releaseLock(context, 'Key has already been finalized or aborted');
    },
    abort(context: ObjectContext) {
        VisitorContext.assertDoesntHaveScratch(context, 'Visited a key but aborted');
        VisitorContext.releaseLock(context, 'Key has already been finalized or aborted');

        if (context.tmpKeyMeta.metaBefore !== undefined) {
            context.value.metaTail = context.tmpKeyMeta.metaBefore;
        }
    },

    visitValue(context: ObjectContext, value: any) {
        if (typeof value !== 'string') {
            throw new Error('Cannot visit a key that isn\'t a string');
        }

        VisitorContext.assertDoesntHaveScratch(context, 'Already visited a key');
        VisitorContext.setHasScratch(context);

        context.tmpKey = value;
    },
};

export type WrappedMetadataArrayVisitor = AbstractArrayVisitor<ArrayContext, AnyContext>;
const WrappedMetadataArrayVisitor: WrappedMetadataArrayVisitor = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    _C: null!,

    initialize() {
        return {
            ...VisitorContext.new(),

            value: {
                [isWrapped]: true,
                type: 'array',
                children: [],
            },

            tmpMeta: {},

            tmp: undefined,
        };
    },

    pushInvisible(context: ArrayContext, kind: string, value: MetadataValue) {
        if (!VisitorContext.hasLock(context)) {
            if (context.tmpMeta.metaBefore === undefined) {
                context.tmpMeta.metaBefore = [];
            }

            context.tmpMeta.metaBefore.push({ kind, value });
        } else {
            if (context.tmpMeta.metaAfter === undefined) {
                context.tmpMeta.metaAfter = [];
            }

            context.tmpMeta.metaAfter.push({ kind, value });
        }
    },
    setMetadata(context: ArrayContext, kind: string, value: MetadataValue) {
        if (context.tmpMeta.meta === undefined) {
            context.tmpMeta.meta = {};
        }

        context.tmpMeta.meta[kind] = value;
    },

    finalize(context: ArrayContext) {
        VisitorContext.assertIsNotSet(context, 'Already finalized this array');
        VisitorContext.set(context);

        if (VisitorContext.hasLock(context) && !VisitorContext.isEmpty(context)) {
            VisitorContext.releaseLock(context, 'Unreachable');

            const value = context.tmpMeta as WrappedAny;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            value.contents = context.tmp!;

            context.value.children.push(value);
            context.tmpMeta = {};
        }

        if (context.tmpMeta.metaBefore !== undefined) {
            context.value.metaTail = context.tmpMeta.metaBefore;
        }

        return context.value;
    },

    visitValue(context: ArrayContext, value: any) {
        VisitorContext.getLock(context, 'Never finalized the array value');
        VisitorContext.setNotEmpty(context);

        if (typeof value === 'object' && value !== null && value[isWrapped]) {
            delete value[isWrapped];
            context.tmp = value;
        } else {
            context.tmp = { value };
        }
    },

    markNextValue(context: ArrayContext) {
        VisitorContext.releaseLock(context, 'Next value has already been marked');

        const value = context.tmpMeta as WrappedAny;
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        value.contents = context.tmp!;

        context.value.children.push(value);

        context.tmpMeta = {};
    },
};

const visitors: Visitors = {
    root: WrappedMetadataRootVisitor,
    object: WrappedMetadataObjectVisitor,
    objectKey: WrappedMetadataObjectKeyVisitor,
    array: WrappedMetadataArrayVisitor,
};

export default visitors;
