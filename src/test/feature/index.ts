import { inspect } from 'util';
import { AbstractFeature, AbstractFeatureParseReturn, FeatureAction } from '../../parse/features/abstract';
import { MetadataMap, MetadataValue } from '../../types/metadata';
import createVisitors, { VisitorEvent } from './visitor';
import parseString from '../../parse/source/string';
import ProxyFeature from './proxy';
import DummyFeature from './dummy';
import { ParseError } from '../../parse/error';

export type LogEntry = {
    type: 'visit';
    visitorId?: string | undefined;

    // TODO: value param?
} | {
    type: 'invisible';
    visitorId?: string | undefined;

    kind: string;
    value: MetadataValue;
} | {
    type: 'init-array-visitor';
    storeAsId: string;
    parentId?: string | undefined;
} | {
    type: 'init-object-visitor';
    storeAsId: string;
    parentId?: string | undefined;
} | {
    type: 'seed-object-key';
    storeAsId: string;
    objectVisitorId: string;
} | {
    type: 'mark-next-value';
    arrayVisitorId: string;
} | {
    type: 'finalize';
    visitorId?: string;

    meta?: MetadataMap;
    // TODO: value param?
} | {
    type: 'abort';
    objectVisitorId: string;
} | {
    type: 'error';

    message: string;
} | {
    type: 'child';

    dummyId: symbol;
    whitespace?: boolean;
}; // TODO: peekers

export interface TestResultOk {
    finished: true;
    value: any;
}

export interface TestResultErr {
    finished: false;
    error: ParseError;
}

type TestResult = TestResultOk | TestResultErr;

export function testFeatureWithLog(
    feature: AbstractFeature,
    input: string,
    expectedLog: LogEntry[],
): TestResult {
    let index = -1;

    function getEntry(event: unknown) {
        const entry = expectedLog[index];

        if (entry === undefined) {
            // eslint-disable-next-line no-console
            console.log('Event:', event);
            throw new Error('Encountered more events than in the expected log');
        }

        return entry;
    }

    function initCallback() {
        const entry = getEntry({
            type: 'init-or-seed',
        });

        if ('storeAsId' in entry) {
            return entry.storeAsId;
        } else {
            throw new Error(`Unexpected initialization at index ${index}`);
        }
    }
    function eventCallback(event: VisitorEvent) {
        index += 1;

        const entry = getEntry(event);

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

                const message = value.value();

                const entry = getEntry({
                    type: 'error',
                    message,
                });

                if (entry.type !== 'error') {
                    throw new Error(`Expected event of type '${entry.type}' but got type 'error' instead at ${index}`);
                }

                if (entry.message !== message) {
                    throw new Error(`Expected error message '${entry.message}' but got '${message}' at index ${index}`);
                }
            }
        } else {
            if (typeof value.value === 'object') {
                if (value.value.action === FeatureAction.ParseChild) {
                    index += 1;

                    const childFeature = value.value.features[0];

                    if (!(childFeature instanceof DummyFeature)) {
                        throw new Error(`Expected child feature to be an instance of DummyFeature at ${index}`);
                    }

                    const entry = getEntry({
                        type: 'child',
                        dummyId: childFeature.settings.id,
                        whitespace: value.value.whitespaceMode || false,
                    });

                    if (entry.type !== 'child') {
                        throw new Error(`Expected event of type '${entry.type}' but got type 'child' instead at ${index}`);
                    }

                    if (value.value.features.length > 1) {
                        throw new Error(`Expected only one child feature at index ${index}`);
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

    try {
        const value = parseString(
            input,
            {
                context: visitors.root.initialize(),
                impl: visitors.root,
            },
            [rootFeature],
            visitors,
        );

        return {
            finished: true,
            value,
        };
    } catch (error) {
        if (error instanceof ParseError) {
            return {
                finished: false,
                error,
            };
        } else {
            throw error;
        }
    }
}
