/* eslint-disable no-bitwise */
import { Visitor, Visitors, AbstractRootVisitor } from '../visitor/abstract';
import {
    AbstractFeature,
    AbstractFeatureParseReturn,
    ParseChild,
    FeatureResult,
    PeekAhead,
    FeatureAction,
    AbstractFeaturePeekReturn,
} from '../features/abstract';
import { Index, ParseError, IndexRef } from '../error';

interface StackFrame {
    visitor: Visitor;
    features: AbstractFeature[];
    featureIndex: number;
    liveFeature: AbstractFeatureParseReturn;
    whitespaceMode: boolean;
    peekFinalizers: PeekAhead | undefined;
}

enum ParseCharResult {
    Next = 0b0000,

    Rewind = 0b0001,
    Retry = 0b0010,
    BeginPeek = 0b0100,
    Commit = 0b1000,

    // Commit and Rewind are mutually exclusive
    // BeginPeek and Rewind are mutually exclusive
    // Rewind and Retry are mutually exclusive
    // The only one left is CommitAndBeginPeek, which is unused

    BeginPeekAndRetry = 0b0110,
    CommitAndRetry = 0b1010,
}

interface ParseErrorRaw {
    location: IndexRef;
    message: () => string;
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
    let errors: ParseErrorRaw[] = [];
    let committed = false;

    let char: string | undefined;
    let nextYield: ParseCharResult = ParseCharResult.Next;
    let featureReturn: IteratorResult<
        true | ParseChild | PeekAhead | undefined,
        FeatureResult | (() => string)
    >;
    let whitespaceMode = false;
    let peekFinalizers: PeekAhead | undefined;

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
                        peekFinalizers,
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
                        .map((err) => `\n    at ${err.location} ${err.message()}`)
                        .join('');

                    throw new ParseError(
                        index,
                        `Unable to parse features:${errorsStr}`,
                    );
                }
            } else {
                // Initialize the new feature
                liveFeature = features[featureIndex].parse(
                    char,
                    visitor,
                    visitors,
                    peekFinalizers,
                );

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
                    errors.push({
                        location: index.ref(),
                        message: featureReturn.value,
                    });
                }

                // We hit an error, so rewind and try the next feature
                nextYield = ParseCharResult.Rewind;
                featureIndex += 1;
                liveFeature = undefined;
            } else {
                // The feature completed

                switch (featureReturn.value) {
                    case FeatureResult.Commit: {
                        nextYield = ParseCharResult.Commit;
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

                        char = yield ParseCharResult.Commit;

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
                        peekFinalizers,
                    } = frame);
                }
            }
        } else if (featureReturn.value === true) {
            // The feature yielded true

            nextYield = ParseCharResult.Commit;
            committed = true;
        } else if (featureReturn.value !== undefined) {
            if (featureReturn.value.action === FeatureAction.ParseChild) {
                // The feature yielded a sub-feature

                stack.push({
                    visitor,
                    features,
                    featureIndex,
                    liveFeature,
                    whitespaceMode,
                    peekFinalizers,
                });

                let commitUntilNow;

                ({
                    visitor,
                    features,
                    commitUntilNow,
                    whitespaceMode = false,
                    peekFinalizers,
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
                    nextYield = ParseCharResult.Commit;
                } else {
                    nextYield = ParseCharResult.Rewind;
                }
            } else {
                // The feature yielded a peek ahead case

                const { finalizers, fillers } = featureReturn.value;

                type ActivePeeker = AbstractFeaturePeekReturn | undefined;
                const currentFinalizers: ActivePeeker[] = new Array(finalizers.length);
                const currentFillers: ActivePeeker[] = new Array(fillers.length);

                let resetPeekers = true;
                let retry = true;
                let done = false;
                const peekErrors: ParseErrorRaw[] = [];

                let i;
                let peeker;
                let result: IteratorResult<undefined, boolean | (() => string)>;
                let foundActivePeeker;

                // Take the next char and start peeking, but tell the loop not
                // to get another char by setting `retry` to true
                char = yield ParseCharResult.BeginPeek;

                while (!done) {
                    if (!retry) {
                        char = yield ParseCharResult.Next;

                        index.step(char);
                    } else {
                        retry = false;
                    }

                    if (resetPeekers) {
                        // One of the peekers completed, or we need to
                        // initialize them

                        if (char === undefined) {
                            throw new ParseError(
                                index,
                                'Found end of file while instantiating peeker',
                            );
                        }

                        for (i = 0; i < finalizers.length; i += 1) {
                            currentFinalizers[i] = finalizers[i].peek(char);
                        }
                        for (i = 0; i < fillers.length; i += 1) {
                            currentFillers[i] = fillers[i].peek(char);
                        }
                    }

                    foundActivePeeker = false;

                    // Test all the finalizers first
                    for (i = 0; i < finalizers.length; i += 1) {
                        peeker = currentFinalizers[i];

                        if (peeker !== undefined) {
                            foundActivePeeker = true;
                            result = peeker.next(char);

                            if (result.done) {
                                if (typeof result.value === 'function') {
                                    peekErrors.push({
                                        location: index.ref(),
                                        message: result.value,
                                    });
                                    currentFinalizers[i] = undefined;
                                } else {
                                    if (result.value) {
                                        nextYield = ParseCharResult.Commit;
                                    } else {
                                        nextYield = ParseCharResult.CommitAndRetry;
                                    }

                                    done = true;
                                    break;
                                }
                            }
                        }
                    }

                    // Break if a finalizer finished
                    if (done) {
                        break;
                    }

                    // Test all the fillers
                    for (i = 0; i < fillers.length; i += 1) {
                        peeker = currentFillers[i];

                        if (peeker !== undefined) {
                            foundActivePeeker = true;
                            result = peeker.next(char);

                            if (result.done) {
                                if (typeof result.value === 'function') {
                                    peekErrors.push({
                                        location: index.ref(),
                                        message: result.value,
                                    });
                                    currentFillers[i] = undefined;
                                } else {
                                    retry = !result.value;
                                    resetPeekers = true;
                                    break;
                                }
                            }
                        }
                    }

                    // If no peekers are still active, add the errors to the
                    // list and rewind to run the next feature
                    if (!foundActivePeeker) {
                        if (committed) {
                            // The feature that requested to peek had already
                            // committed chars, so we can't rewind far enough
                            const errorsStr = peekErrors
                                .map((err) => `\n    at ${err.location} ${err.message()}`)
                                .join('');

                            throw new ParseError(
                                index,
                                `Peek errors after side effect:${errorsStr}`,
                            );
                        }

                        // Commit the peek errors to the feature errors list
                        errors.push(...peekErrors);

                        // Rewind and run the next feature
                        nextYield = ParseCharResult.Rewind;
                        featureIndex += 1;
                        liveFeature = undefined;
                        break;
                    }
                }
            }
        }

        if (nextYield & ParseCharResult.Rewind) {
            index.rewind();
        } else {
            if (!(nextYield & ParseCharResult.Retry)) {
                index.step(char);
            }

            if (nextYield & ParseCharResult.Commit) {
                index.commit();
            }
        }
    }

    // if (char !== undefined) {
    //     throw new Error('Did not parse entire document');
    // }

    return rootVisitor.impl.finalize(rootVisitor.context);
}

export function* parseStringsWithParser(
    firstIterator: Iterator<string>,
    parser: ReturnType<typeof parseChars>,
) {
    let parseResult: IteratorResult<ParseCharResult, any>;

    let iterator: Iterator<string> | undefined = firstIterator;
    let iteratorResult: IteratorResult<string> | undefined;
    let char: string | undefined;

    // uncommitted indicies refer to the first char of any state
    const uncommitted: string[] = [];
    let uncommittedStart = 0;
    let peekStart: number | undefined;

    while (true) {
        parseResult = parser.next(char);

        if (parseResult.done) {
            return parseResult.value;
        }

        if (
            parseResult.value & ParseCharResult.Rewind
            || (
                (parseResult.value & ParseCharResult.Commit)
                && peekStart !== undefined
            )
        ) {
            // We are rewinding to either the uncommitted start or the peek start

            if (char !== undefined) {
                // Make sure the current char is saved
                uncommitted.push(char);
            }

            if (peekStart !== undefined) {
                // Rewind and commit to peek start
                uncommittedStart = peekStart;

                // Stop peeking
                peekStart = undefined;

                // Ignore the retry flag
            }

            const uncommittedEnd = uncommitted.length;

            // Loop over all the uncommitted characters
            for (let i = uncommittedStart; i < uncommittedEnd; i += 1) {
                char = uncommitted[i];

                parseResult = parser.next(char);

                if (parseResult.done) {
                    return parseResult.value;
                }

                if (
                    peekStart !== undefined
                    && parseResult.value & ParseCharResult.BeginPeek
                    && !(parseResult.value & ParseCharResult.Commit)
                ) {
                    throw new Error('Already peeking');
                }

                if (parseResult.value & ParseCharResult.Rewind) {
                    if (peekStart !== undefined) {
                        // Cancel peek and rewind all the way
                        peekStart = undefined;
                    }

                    i = uncommittedStart - 1;
                } else {
                    if (
                        peekStart !== undefined
                        && parseResult.value & ParseCharResult.Commit
                    ) {
                        // Cancel peek and rewind to peek start, ignoring retry flag
                        i = peekStart - 1;
                        peekStart = undefined;
                    } else if (parseResult.value & ParseCharResult.Retry) {
                        // Rewind one character
                        i -= 1;
                    }

                    if (parseResult.value & ParseCharResult.Commit) {
                        // Commit all including the current character
                        uncommittedStart = i + 1;
                    }

                    if (parseResult.value & ParseCharResult.BeginPeek) {
                        // Begin peeking with the next character
                        peekStart = i + 1;
                    }
                }
            }
        } else {
            if (parseResult.value & ParseCharResult.Commit) {
                // We must not be peeking because of an earlier if clause, so
                // go ahead and clear out the uncommitted buffer
                uncommitted.length = 0;
                uncommittedStart = 0;
            } else if (
                char !== undefined
                && !(parseResult.value & ParseCharResult.Retry)
            ) {
                // If we aren't retrying, go ahead and push the char to the
                // uncommitted stack
                uncommitted.push(char);
            }

            if (parseResult.value & ParseCharResult.BeginPeek) {
                if (peekStart !== undefined) {
                    throw new Error('Already peeking');
                }

                // Begin peeking with the next character
                peekStart = uncommitted.length;
            }
        }

        if (!(parseResult.value & ParseCharResult.Retry)) {
            if (iteratorResult === undefined || !iteratorResult.done) {
                iteratorResult = iterator.next();

                while (iteratorResult.done) {
                    const nextIterator: Iterator<string> | undefined = yield;

                    if (nextIterator === undefined) {
                        // There will be no more iterators to consume. All
                        // subsequent values will be `undefined`
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

export default function parseStrings(
    firstIterator: Iterator<string>,
    rootVisitor: Visitor<AbstractRootVisitor<any>>,
    rootFeatures: AbstractFeature[],
    visitors: Visitors,
) {
    const parser = parseChars(rootVisitor, rootFeatures, visitors);

    return parseStringsWithParser(firstIterator, parser);
}
