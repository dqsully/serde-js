import {
    AbstractRootVisitor,
    AbstractObjectVisitor,
    AbstractArrayVisitor,
    Visitors,
    AbstractObjectKeyVisitor,
} from './abstract';
import { VisitorContext } from './context';
import { MetadataValue, MetadataRecord, MetadataMap } from '../../types/metadata';

export interface AstBaseNode {
    metaBefore?: MetadataRecord[];
    metaAfter?: MetadataRecord[];
    meta?: MetadataMap;
}

export interface AstValueNode extends AstBaseNode {
    type?: undefined;
}

export interface AstObjectEntry {
    key: AstValueNode;
    value: AstNode;
}

export interface AstObjectNode extends AstBaseNode {
    type: 'object';

    childMeta?: Map<string, AstObjectEntry>;
    metaTail?: MetadataRecord[];
}

export interface AstArrayNode extends AstBaseNode {
    type: 'array';

    childMeta?: AstNode[];
    metaTail?: MetadataRecord[];
}

export type AstNode = AstValueNode | AstObjectNode | AstArrayNode;

interface RootContext extends VisitorContext {
    tmpNode: AstNode | AstBaseNode;

    value?: any;
}

interface ObjectContext extends VisitorContext {
    node: AstObjectNode;
    tmpKeyNode: AstBaseNode;
    tmpNode: AstNode | AstBaseNode;

    value: {[key: string]: any};
    key: string | undefined;
}

interface ArrayContext extends VisitorContext {
    node: AstArrayNode;
    tmpNode: AstNode | AstBaseNode;

    value: any[];
}

type AnyContext = RootContext | ObjectContext | ArrayContext;

export type AstMetadataRootVisitor = AbstractRootVisitor<RootContext>;
const AstMetadataRootVisitor: AstMetadataRootVisitor = {
    _C: null!,

    initialize() {
        return {
            ...VisitorContext.new(),
            tmpNode: {},
        };
    },

    pushInvisible(context: RootContext, kind: string, value: MetadataValue) {
        if (!VisitorContext.isSet(context)) {
            if (context.tmpNode.metaBefore === undefined) {
                context.tmpNode.metaBefore = [];
            }

            context.tmpNode.metaBefore.push({ kind, value });
        } else {
            if (context.tmpNode.metaAfter === undefined) {
                context.tmpNode.metaAfter = [];
            }

            context.tmpNode.metaAfter.push({ kind, value });
        }
    },
    setMetadata(context: RootContext, kind: string, value: MetadataValue) {
        if (context.tmpNode.meta === undefined) {
            context.tmpNode.meta = {};
        }

        context.tmpNode.meta[kind] = value;
    },

    finalize(context: RootContext) {
        VisitorContext.assertIsSet(context, 'Did not visit a value');

        return [context.value, context.tmpNode];
    },

    visitValue(context: RootContext, value: any) {
        VisitorContext.assertIsNotSet(context, 'Already visited a value');
        VisitorContext.set(context);

        context.value = value;
    },
};

export type AstMetadataObjectVisitor = AbstractObjectVisitor<ObjectContext, AnyContext>;
const AstMetadataObjectVisitor: AstMetadataObjectVisitor = {
    _C: null!,

    initialize(parent: AnyContext) {
        const node = parent.tmpNode as AstObjectNode;

        node.type = 'object';

        return {
            ...VisitorContext.new(),

            node,
            tmpKeyNode: {},
            tmpNode: {},

            value: {},
            key: undefined,
        };
    },

    pushInvisible(context: ObjectContext, kind: string, value: MetadataValue) {
        VisitorContext.assertNotLocked(context, 'Currently visiting a key, invisibles should be sent there');

        if (VisitorContext.hasScratch(context)) {
            if (context.tmpNode.metaBefore === undefined) {
                context.tmpNode.metaBefore = [];
            }

            context.tmpNode.metaBefore.push({ kind, value });
        } else {
            if (context.tmpNode.metaAfter === undefined) {
                context.tmpNode.metaAfter = [];
            }

            context.tmpNode.metaAfter.push({ kind, value });
        }
    },
    setMetadata(context: ObjectContext, kind: string, value: MetadataValue) {
        if (context.tmpNode.meta === undefined) {
            context.tmpNode.meta = {};
        }

        context.tmpNode.meta[kind] = value;
    },

    finalize(context: ObjectContext) {
        VisitorContext.assertIsNotSet(context, 'Already finalized this object');
        VisitorContext.assertDoesntHaveScratch(context, 'Unfinished object key visit');
        VisitorContext.set(context);

        if (!VisitorContext.isEmpty(context) && context.key !== undefined) {
            // Record metadata for previous value

            if (context.node.childMeta === undefined) {
                context.node.childMeta = new Map();
            }

            context.node.childMeta.set(context.key, {
                key: context.tmpKeyNode,
                value: context.tmpNode,
            });
        }

        return context.value;
    },

    visitValue(context: ObjectContext, value: any) {
        VisitorContext.assertHasScratch(context, 'Not visiting a key yet');
        VisitorContext.clearHasScratch(context);
        VisitorContext.setNotEmpty(context);

        context.value[context.key!] = value;
    },

    seedKey(context: ObjectContext) {
        VisitorContext.getLock(context, 'Already seeding a key');

        if (!VisitorContext.isEmpty(context)) {
            // Record metadata for previous value

            if (context.node.childMeta === undefined) {
                context.node.childMeta = new Map();
            }

            context.node.childMeta.set(context.key!, {
                key: context.tmpKeyNode,
                value: context.tmpNode,
            });

            context.tmpKeyNode = {};
            context.tmpNode = {};
        }

        context.key = undefined;

        return {
            context,
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            impl: AstMetadataObjectKeyVisitor,
        };
    },
};

export type AstMetadataObjectKeyVisitor = AbstractObjectKeyVisitor<ObjectContext>;
const AstMetadataObjectKeyVisitor: AstMetadataObjectKeyVisitor = {
    _C: null!,

    pushInvisible(context: ObjectContext, kind: string, value: MetadataValue) {
        if (!VisitorContext.hasScratch(context)) {
            if (context.tmpKeyNode.metaBefore === undefined) {
                context.tmpKeyNode.metaBefore = [];
            }

            context.tmpKeyNode.metaBefore.push({ kind, value });
        } else {
            if (context.tmpKeyNode.metaAfter === undefined) {
                context.tmpKeyNode.metaAfter = [];
            }

            context.tmpKeyNode.metaAfter.push({ kind, value });
        }
    },
    setMetadata(context: ObjectContext, kind: string, value: MetadataValue) {
        if (context.tmpKeyNode.meta === undefined) {
            context.tmpKeyNode.meta = {};
        }

        context.tmpKeyNode.meta[kind] = value;
    },

    finalize(context: ObjectContext) {
        VisitorContext.assertHasScratch(context, 'Did not visit a key');
        VisitorContext.releaseLock(context, 'Key has already been finalized or aborted');
    },
    abort(context: ObjectContext) {
        VisitorContext.assertDoesntHaveScratch(context, 'Visited a key but aborted');
        VisitorContext.releaseLock(context, 'Key has already been finalized or aborted');

        if (context.tmpKeyNode.metaBefore !== undefined) {
            context.node.metaTail = context.tmpKeyNode.metaBefore;
        }
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

export type AstMetadataArrayVisitor = AbstractArrayVisitor<ArrayContext, AnyContext>;
const AstMetadataArrayVisitor: AstMetadataArrayVisitor = {
    _C: null!,

    initialize(parent: AnyContext) {
        const node = parent.tmpNode as AstArrayNode;

        node.type = 'array';

        return {
            ...VisitorContext.new(),

            node,
            tmpNode: {},

            value: [],
            key: undefined,
        };
    },

    pushInvisible(context: ArrayContext, kind: string, value: MetadataValue) {
        if (!VisitorContext.hasLock(context)) {
            if (context.tmpNode.metaBefore === undefined) {
                context.tmpNode.metaBefore = [];
            }

            context.tmpNode.metaBefore.push({ kind, value });
        } else {
            if (context.tmpNode.metaAfter === undefined) {
                context.tmpNode.metaAfter = [];
            }

            context.tmpNode.metaAfter.push({ kind, value });
        }
    },
    setMetadata(context: ArrayContext, kind: string, value: MetadataValue) {
        if (context.tmpNode.meta === undefined) {
            context.tmpNode.meta = {};
        }

        context.tmpNode.meta[kind] = value;
    },

    finalize(context: ArrayContext) {
        VisitorContext.assertIsNotSet(context, 'Already finalized this array');
        VisitorContext.set(context);

        if (VisitorContext.hasLock(context) && !VisitorContext.isEmpty(context)) {
            VisitorContext.releaseLock(context, 'Unreachable');

            if (context.node.childMeta === undefined) {
                context.node.childMeta = [];
            }

            context.node.childMeta.push(context.tmpNode);
        }

        if (context.tmpNode.metaBefore !== undefined) {
            context.node.metaTail = context.tmpNode.metaBefore;
        }

        return context.value;
    },

    visitValue(context: ArrayContext, value: any) {
        VisitorContext.getLock(context, 'Never finalized the array value');
        VisitorContext.setNotEmpty(context);

        context.value.push(value);
    },

    markNextValue(context: ArrayContext) {
        VisitorContext.releaseLock(context, 'Next value has already been marked');

        if (context.node.childMeta === undefined) {
            context.node.childMeta = [];
        }

        context.node.childMeta.push(context.tmpNode);
        context.tmpNode = {};
    },
};

const visitors: Visitors = {
    root: AstMetadataRootVisitor,
    object: AstMetadataObjectVisitor,
    objectKey: AstMetadataObjectKeyVisitor,
    array: AstMetadataArrayVisitor,
};

export default visitors;
