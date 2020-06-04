import { inspect } from 'util';
import { AbstractFeature, AbstractFeatureParseReturn, FeatureAction } from '../../parse/features/abstract';
import { MetadataMap, MetadataValue } from '../../types/metadata';
import createVisitors, { VisitorEvent } from './visitor';
import parseString from '../../parse/source/string';
import ProxyFeature from './proxy';
import DummyFeature from './dummy';

export type LogEntry = {
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
    storeAsId: string;
    parentId: string | undefined;
} | {
    type: 'init-object-visitor';
    storeAsId: string;
    parentId: string | undefined;
} | {
    type: 'seed-object-key';
    storeAsId: string;
    objectVisitorId: string | undefined;
} | {
    type: 'mark-next-value';
    arrayVisitorId: string;
} | {
    type: 'finalize';
    visitorId: string;

    meta: MetadataMap;
    // TODO: value param?
} | {
    type: 'abort';
    visitorId: string;
} | {
    type: 'error';

    message: string;
} | {
    type: 'child';

    dummyId: symbol;
    whitespace?: boolean;
}; // TODO: peekers

const noop = () => {};

export function testFeature(
    feature: AbstractFeature,
    input: string,
): any {
    let i = 0;

    const visitors = createVisitors(
        () => {
            i += 1;
            return i.toString();
        },
        noop,
    );
    const rootFeature = new ProxyFeature({
        callback: noop,
        feature,
    });

    return parseString(
        input,
        {
            context: visitors.root.initialize(),
            impl: visitors.root,
        },
        [rootFeature],
        visitors,
    );
}

export function testFeatureWithLog(
    feature: AbstractFeature,
    input: string,
    expectedLog: LogEntry[],
): any {
    let index = -1;

    function initCallback() {
        const entry = expectedLog[index];

        if (entry === undefined) {
            throw new Error('Encountered more events than in the expected log');
        }

        if ('storeAsId' in entry) {
            return entry.storeAsId;
        } else {
            throw new Error(`Unexpected initialization at index ${index}`);
        }
    }
    function eventCallback(event: VisitorEvent) {
        index += 1;

        const entry = expectedLog[index];

        if (entry === undefined) {
            throw new Error('Encountered more events than in the expected log');
        }

        if (event.type !== entry.type) {
            throw new Error(`Expected event of type '${entry.type}' but got type '${event.type}' at index ${index}`);
        }

        for (const key of Object.keys(event) as (keyof VisitorEvent)[]) {
            if (entry[key] !== event[key]) {
                throw new Error(`Mismatched values for key '${key}': expected ${inspect(entry[key])} but got ${inspect(event[key])} at ${index}`);
            }
        }
    }
    function proxyCallback(value: ReturnType<AbstractFeatureParseReturn['next']>) {
        if (value.done) {
            if (typeof value.value === 'function') {
                index += 1;

                const entry = expectedLog[index];

                if (entry === undefined) {
                    throw new Error('Encountered more events than in the expected log');
                }

                if (entry.type !== 'error') {
                    throw new Error(`Expected event of type '${entry.type}' but got type 'error' instead at ${index}`);
                }

                const message = value.value();
                if (entry.message !== message) {
                    throw new Error(`Expected error message '${entry.message}' but got '${message}' at index ${index}`);
                }
            }
        } else {
            if (typeof value.value === 'object') {
                if (value.value.action === FeatureAction.ParseChild) {
                    index += 1;

                    const entry = expectedLog[index];

                    if (entry === undefined) {
                        throw new Error('Encountered more events than in the expected log');
                    }

                    if (entry.type !== 'child') {
                        throw new Error(`Expected event of type '${entry.type}' but got type 'child' instead at ${index}`);
                    }

                    if (value.value.features.length > 1) {
                        throw new Error(`Expected only one child feature at index ${index}`);
                    }

                    const childFeature = value.value.features[0];

                    if (!(childFeature instanceof DummyFeature)) {
                        throw new Error(`Expected child feature to be an instance of DummyFeature at ${index}`);
                    }

                    if (childFeature.settings.id !== entry.dummyId) {
                        throw new Error(`Mismatched dummy id: expected ${inspect(entry.dummyId)} got ${inspect(childFeature.settings.id)} at index ${index}`);
                    }

                    if (entry.whitespace && !value.value.whitespaceMode) {
                        throw new Error(`Expected whitespace mode to be enabled at ${index}`);
                    } else if (!entry.whitespace && value.value.whitespaceMode) {
                        throw new Error(`Expected whitespace mode to be disabled at ${index}`);
                    }
                }
                // TODO: peekers
            }
        }
    }

    const visitors = createVisitors(
        initCallback,
        eventCallback,
    );
    const rootFeature = new ProxyFeature({
        callback: proxyCallback,
        feature,
    });

    return parseString(
        input,
        {
            context: visitors.root.initialize(),
            impl: visitors.root,
        },
        [rootFeature],
        visitors,
    );
}
