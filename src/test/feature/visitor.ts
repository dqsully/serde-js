/* eslint-disable no-param-reassign */
import { MetadataMap, MetadataValue } from '../../types/metadata';
import {
    Visitors,
    AbstractRootVisitor,
    AbstractObjectVisitor,
    AbstractObjectKeyVisitor,
    AbstractArrayVisitor,
} from '../../parse/visitor/abstract';
import { VisitorContext } from '../../parse/visitor/context';

export type VisitorEvent = {
    type: 'visit';
    visitorId: string | undefined;

    // TODO: value param?
} | {
    type: 'invisible';
    visitorId: string | undefined;

    kind: string;
    value: MetadataValue;
} | {
    type: 'init-array-visitor';
    parentId: string | undefined;
} | {
    type: 'init-object-visitor';
    parentId: string | undefined;
} | {
    type: 'seed-object-key';
    objectVisitorId: string;
} | {
    type: 'mark-next-value';
    arrayVisitorId: string;
} | {
    type: 'finalize';
    visitorId: string | undefined;

    meta: MetadataMap | undefined;
    // TODO: value param?
} | {
    type: 'abort';
    objectVisitorId: string;
};

interface RootContext extends VisitorContext {
    id?: undefined;
    value?: any;

    meta?: MetadataMap;
}
interface ObjectContext extends VisitorContext {
    id: string;
    keyId?: string;
    value: {[key: string]: any};
    key: string | undefined;

    meta?: MetadataMap;
    keyMeta?: MetadataMap;
}
interface ArrayContext extends VisitorContext {
    id: string;
    value: any[];

    meta?: MetadataMap;
}

type AnyContext = RootContext | ObjectContext | ArrayContext;

type RootVisitor = AbstractRootVisitor<RootContext>;
type ObjectVisitor = AbstractObjectVisitor<ObjectContext, AnyContext>;
type ObjectKeyVisitor = AbstractObjectKeyVisitor<ObjectContext>;
type ArrayVisitor = AbstractArrayVisitor<ArrayContext, AnyContext>;

export default function createVisitors(
    initCallback: () => string,
    eventCallback: (entry: VisitorEvent) => void,
): Visitors {
    let rootInitialized = false;


    const root: RootVisitor = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        _C: null!,

        initialize() {
            if (rootInitialized) {
                throw new Error('Root visitor has already been used once');
            } else {
                rootInitialized = true;
            }

            return VisitorContext.new();
        },

        pushInvisible(_context: RootContext, kind: string, value: MetadataValue) {
            eventCallback({
                type: 'invisible',
                kind,
                value,
                visitorId: undefined,
            });
        },
        setMetadata(context: RootContext, kind: string, value: MetadataValue) {
            if (context.meta === undefined) {
                context.meta = {};
            }

            context.meta[kind] = value;
        },

        finalize(context: RootContext) {
            VisitorContext.assertIsSet(context, 'Did not visit a value');

            eventCallback({
                type: 'finalize',
                visitorId: undefined,
                meta: context.meta,
            });

            return context.value;
        },
        visitValue(context: RootContext, value: any) {
            VisitorContext.assertIsNotSet(context, 'Already visited a value');
            VisitorContext.set(context);

            context.value = value;

            eventCallback({
                type: 'visit',
                visitorId: undefined,
            });
        },
    };

    const object: ObjectVisitor = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        _C: null!,

        initialize(parent: AnyContext) {
            eventCallback({
                type: 'init-object-visitor',
                parentId: parent.id,
            });

            return {
                ...VisitorContext.new(),

                id: initCallback(),

                value: {},
                key: undefined,
            };
        },

        pushInvisible(context: ObjectContext, kind: string, value: MetadataValue) {
            VisitorContext.assertNotLocked(context, 'Currently visiting a key, invisibles should be sent there');

            eventCallback({
                type: 'invisible',
                kind,
                value,
                visitorId: context.id,
            });
        },
        setMetadata(context: ObjectContext, kind: string, value: MetadataValue) {
            if (context.meta === undefined) {
                context.meta = {};
            }

            context.meta[kind] = value;
        },

        finalize(context: ObjectContext) {
            VisitorContext.assertIsNotSet(context, 'Already finalized this object');
            VisitorContext.assertDoesntHaveScratch(context, 'Unfinished object key visit');
            VisitorContext.set(context);

            eventCallback({
                type: 'finalize',
                meta: context.meta,
                visitorId: context.id,
            });

            return context.value;
        },

        visitValue(context: ObjectContext, value: any) {
            VisitorContext.assertHasScratch(context, 'Not visiting a key yet');
            VisitorContext.clearHasScratch(context);
            VisitorContext.setNotEmpty(context);

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            context.value[context.key!] = value;

            eventCallback({
                type: 'visit',
                visitorId: context.id,
            });
        },

        seedKey(context: ObjectContext) {
            VisitorContext.getLock(context, 'Already seeding a key');

            eventCallback({
                type: 'seed-object-key',
                objectVisitorId: context.id,
            });

            context.key = undefined;
            context.keyId = initCallback();

            return {
                context,
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                impl: objectKey,
            };
        },
    };

    const objectKey: ObjectKeyVisitor = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        _C: null!,

        pushInvisible(context: ObjectContext, kind: string, value: MetadataValue) {
            eventCallback({
                type: 'invisible',
                kind,
                value,
                visitorId: context.keyId,
            });
        },
        setMetadata(context: ObjectContext, kind: string, value: MetadataValue) {
            if (context.keyMeta === undefined) {
                context.keyMeta = {};
            }

            context.keyMeta[kind] = value;
        },

        finalize(context: ObjectContext) {
            VisitorContext.assertHasScratch(context, 'Did not visit a key');
            VisitorContext.releaseLock(context, 'Key has already been finalized or aborted');

            eventCallback({
                type: 'finalize',
                meta: context.keyMeta,
                visitorId: context.keyId,
            });
        },
        abort(context: ObjectContext) {
            VisitorContext.assertDoesntHaveScratch(context, 'Visited a key but aborted');
            VisitorContext.releaseLock(context, 'Key has already been finaliuzed or aborted');

            eventCallback({
                type: 'abort',
                objectVisitorId: context.id,
            });
        },

        visitValue(context: ObjectContext, value: any) {
            VisitorContext.assertDoesntHaveScratch(context, 'Already visited a key');
            VisitorContext.setHasScratch(context);

            context.key = value;

            eventCallback({
                type: 'visit',
                visitorId: context.keyId,
            });
        },
    };

    const array: ArrayVisitor = {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        _C: null!,

        initialize(parent: AnyContext) {
            eventCallback({
                type: 'init-array-visitor',
                parentId: parent.id,
            });

            return {
                ...VisitorContext.new(),

                id: initCallback(),

                value: [],
            };
        },

        pushInvisible(context: ArrayContext, kind: string, value: MetadataValue) {
            eventCallback({
                type: 'invisible',
                kind,
                value,
                visitorId: context.id,
            });
        },
        setMetadata(context: ArrayContext, kind: string, value: MetadataValue) {
            if (context.meta === undefined) {
                context.meta = {};
            }

            context.meta[kind] = value;
        },

        finalize(context: ArrayContext) {
            VisitorContext.assertIsNotSet(context, 'Already finalized this array');
            VisitorContext.set(context);

            if (VisitorContext.hasLock(context) && !VisitorContext.isEmpty(context)) {
                VisitorContext.releaseLock(context, 'Unreachable');
            }

            eventCallback({
                type: 'finalize',
                meta: context.meta,
                visitorId: context.id,
            });

            return context.value;
        },

        visitValue(context: ArrayContext, value: any) {
            VisitorContext.getLock(context, 'Never finalized the array value');
            VisitorContext.setNotEmpty(context);

            context.value.push(value);

            eventCallback({
                type: 'visit',
                visitorId: context.id,
            });
        },

        markNextValue(context: ArrayContext) {
            VisitorContext.releaseLock(context, 'Next value has already been marked');

            eventCallback({
                type: 'mark-next-value',
                arrayVisitorId: context.id,
            });
        },
    };

    return {
        root,
        object,
        objectKey,
        array,
    };
}
