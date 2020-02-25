import { Visitor, Visitors, AbstractRootVisitor } from '../visitor/abstract';
import {
    AbstractFeature, AbstractFeatureParseReturn, ParseChild, FeatureResult,
} from '../features/abstract';
import { Index, ParseError } from '../error';

interface StackFrame {
    visitor: Visitor,
    features: AbstractFeature[],
    featureIndex: number,
    liveFeature: AbstractFeatureParseReturn,
    whitespaceMode: boolean,
}

enum ParseCharResult {
    Next,
    CommitAndNext,
    CommitAndRetry,
    Rewind,
}

function* parseChars(
    rootVisitor: Visitor<AbstractRootVisitor<any>>,
    rootFeatures: AbstractFeature[],
    visitors: Visitors,
) {
    const index = new Index();
    const stack: StackFrame[] = [];

    let visitor: Visitor = rootVisitor;
    let features = rootFeatures;
    let featureIndex = 0;
    let liveFeature: AbstractFeatureParseReturn | undefined;
    let errors: (() => string)[] = [];
    let committed = false;

    let char: string | undefined;
    let nextYield: ParseCharResult = ParseCharResult.Next;
    let featureReturn: IteratorResult<
        true | ParseChild | undefined,
        FeatureResult | (() => string)
    >;
    let whitespaceMode: boolean = false;

    while (true) {
        // console.log(`yield: ${ParseCharResult[nextYield]}`);
        // console.log(`index: ${index}`);

        char = yield nextYield;
        nextYield = ParseCharResult.Next;

        // console.log(`char: ${char}`);

        if (liveFeature === undefined) {
            if (char === undefined && !whitespaceMode) {
                // TODO: Should this be an error, or should it be allowed?
                throw new ParseError(
                    index,
                    'Found end of file while instantiating feature',
                );
            }

            if (featureIndex >= features.length || char === undefined) {
                if (whitespaceMode) {
                    const frame = stack.pop();

                    if (frame === undefined) {
                        if (char !== undefined) {
                            throw new ParseError(
                                index,
                                `Completed parsing early, unexpected '${char}'`,
                            );
                        }

                        // The root stack frame has completed, stop parsing
                        break;
                    }

                    // The stack that just completed may have had side effects, so
                    // just assume that it did
                    committed = true;
                    errors = [];

                    ({
                        visitor,
                        features,
                        featureIndex,
                        liveFeature,
                        whitespaceMode,
                    } = frame);

                    featureReturn = liveFeature.next(char);
                } else if (features.length === 0) {
                    throw new ParseError(
                        index,
                        'No parser features supplied',
                    );
                } else {
                    // All features have been tested and failed, throw all their
                    // errors at once
                    const errorsStr = errors
                        .map((fn) => `\n   ${fn()}`)
                        .join('');

                    throw new ParseError(
                        index,
                        `Unable to parse features:${errorsStr}`,
                    );
                }
            } else {
                // Initialize the new feature
                liveFeature = features[featureIndex].parse(char, visitor, visitors);

                // Generators don't use yielded arguments on the first `next` call
                featureReturn = liveFeature.next();
            }
        } else {
            featureReturn = liveFeature.next(char);
        }

        // console.log(`feature: ${features[featureIndex].constructor.name}`);

        if (featureReturn.done) {
            // The feature returned something

            if (typeof featureReturn.value === 'function') {
                // The feature returned an error

                if (committed) {
                    // The feature has made a side effect, so throw its error
                    // instead of testing other features in the list
                    throw new ParseError(
                        index,
                        `Parse error after side effect: ${featureReturn.value()}`,
                    );
                }

                if (!whitespaceMode) {
                    errors.push(featureReturn.value);
                }

                // We hit an error, so rewind and try the next feature
                nextYield = ParseCharResult.Rewind;
                featureIndex += 1;
                liveFeature = undefined;
            } else {
                // The feature completed

                switch (featureReturn.value) {
                    case FeatureResult.Commit: {
                        nextYield = ParseCharResult.CommitAndNext;
                        break;
                    }

                    case FeatureResult.CommitUntilLast: {
                        nextYield = ParseCharResult.CommitAndRetry;
                        break;
                    }

                    case FeatureResult.Ignore: {
                        nextYield = ParseCharResult.Rewind;
                        break;
                    }

                    default: {
                        throw new Error('Unexpected feature return value');
                    }
                }

                if (whitespaceMode) {
                    // We are restarting the stack, so we can't rewind into side
                    // effects yet
                    committed = false;
                    errors = [];

                    featureIndex = 0;
                    liveFeature = undefined;
                } else {
                    const frame = stack.pop();

                    if (frame === undefined) {
                        if (nextYield === ParseCharResult.Rewind && char !== undefined) {
                            // TODO: Make this error message much clearer
                            throw new ParseError(
                                index,
                                `Completed parsing on rewind - stopped at '${char}'`,
                            );
                        }

                        char = yield ParseCharResult.CommitAndNext;

                        index.step(char);

                        if (char !== undefined) {
                            throw new ParseError(
                                index,
                                `Completed parsing early, unexpected '${char}'`,
                            );
                        }

                        // The root stack frame has completed, stop parsing
                        break;
                    }

                    // The stack that just completed may have had side effects, so
                    // just assume that it did
                    committed = true;
                    errors = [];

                    ({
                        visitor,
                        features,
                        featureIndex,
                        liveFeature,
                        whitespaceMode,
                    } = frame);
                }
            }
        } else if (featureReturn.value === true) {
            // The feature yielded true

            nextYield = ParseCharResult.CommitAndNext;
            committed = true;
        } else if (featureReturn.value !== undefined) {
            // The feature yielded a sub-feature

            stack.push({
                visitor,
                features,
                featureIndex,
                liveFeature,
                whitespaceMode,
            });

            let commitUntilNow;

            ({
                visitor,
                features,
                commitUntilNow,
                whitespaceMode = false,
            } = featureReturn.value);
            featureIndex = 0;
            liveFeature = undefined;

            // Regardless of what the parent feature chooses, we are starting a
            // new frame with no inherent side effects yet
            committed = false;
            errors = [];

            if (commitUntilNow) {
                // Committing will not affect the new frame's purity, so don't
                // set `committed` to true
                nextYield = ParseCharResult.CommitAndNext;
            } else {
                nextYield = ParseCharResult.Rewind;
            }
        }

        if (nextYield === ParseCharResult.CommitAndRetry) {
            index.commit();
        } else {
            index.step(char);
        }

        if (
            nextYield === ParseCharResult.CommitAndNext
            || nextYield === ParseCharResult.CommitAndRetry
        ) {
            index.commit();
        } else if (nextYield === ParseCharResult.Rewind) {
            index.rewind();
        }
    }

    // if (char !== undefined) {
    //     throw new Error('Did not parse entire document');
    // }

    return rootVisitor.impl.finalize(rootVisitor.context);
}

export default function* parseStrings(
    firstIterator: Iterator<string>,
    rootVisitor: Visitor<AbstractRootVisitor<any>>,
    rootFeatures: AbstractFeature[],
    visitors: Visitors,
) {
    const parser = parseChars(rootVisitor, rootFeatures, visitors);
    let parseResult: IteratorResult<ParseCharResult, any>;

    let iterator: Iterator<string> | undefined = firstIterator;
    let iteratorResult: IteratorResult<string> | undefined;
    let char: string | undefined;

    const uncommitted: string[] = [];
    let uncommittedStart = 0;

    while (true) {
        parseResult = parser.next(char);

        if (parseResult.done) {
            return parseResult.value;
        }

        if (parseResult.value === ParseCharResult.Rewind) {
            if (char !== undefined) {
                uncommitted.push(char);
            }

            const uncommittedEnd = uncommitted.length;

            for (let i = uncommittedStart; i < uncommittedEnd; i += 1) {
                char = uncommitted[i];

                parseResult = parser.next(char);

                if (parseResult.done) {
                    return parseResult.value;
                }

                if (parseResult.value === ParseCharResult.Rewind) {
                    i = uncommittedStart - 1;
                } else if (parseResult.value === ParseCharResult.CommitAndNext) {
                    uncommittedStart = i + 1;
                } else if (parseResult.value === ParseCharResult.CommitAndRetry) {
                    uncommittedStart = i;
                    i -= 1;
                }
            }
        } else if (
            parseResult.value === ParseCharResult.CommitAndNext
            || parseResult.value === ParseCharResult.CommitAndRetry
        ) {
            uncommitted.length = 0;
            uncommittedStart = 0;
        } else if (char !== undefined) {
            uncommitted.push(char);
        }

        if (parseResult.value !== ParseCharResult.CommitAndRetry) {
            if (iteratorResult === undefined || !iteratorResult.done) {
                iteratorResult = iterator.next();

                while (iteratorResult.done) {
                    const nextIterator: Iterator<string> | undefined = yield;

                    if (nextIterator === undefined) {
                        // There's no more iterators to consume. All subsequent values
                        // will be `undefined`
                        break;
                    }

                    iterator = nextIterator;
                    iteratorResult = iterator.next();
                }
            }

            char = iteratorResult.value;
        }
    }
}
