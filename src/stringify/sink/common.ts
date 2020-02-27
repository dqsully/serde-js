import {
    TokenizerReturn,
    TokenType,
    DataPlaceholderToken,
    KeyPlaceholderToken,
} from '../tokenizer/abstract';

import {
    ValueFeature, ObjectFeature, RootFeature, ArrayFeature,
} from '../features/abstract';

export interface TokenFeatures {
    root: RootFeature;
    value: ValueFeature[];
    object: ObjectFeature[];
    array: ArrayFeature[];
}

enum FrameType {
    Root,
    Object,
    Array,
}

interface RootFrame {
    type: FrameType.Root;

    feature: ReturnType<RootFeature>,
}

interface ObjectFrame {
    type: FrameType.Object;

    feature: NonNullable<ReturnType<ObjectFeature>>,
    isKey: boolean;
    isSeparator: boolean;
    foundData: boolean;
}

interface ArrayFrame {
    type: FrameType.Array;

    feature: NonNullable<ReturnType<ArrayFeature>>,
    isSeparator: boolean;
    foundData: boolean;
}

type StackFrame = RootFrame | ObjectFrame | ArrayFrame;

function testResult(
    result: IteratorResult<string, string | undefined>,
    message: string,
): result is IteratorYieldResult<string> {
    if (result.done) {
        throw new Error(message);
    } else {
        return result.value.length > 0;
    }
}

const dataPlaceholderToken: DataPlaceholderToken = {
    type: TokenType.DataPlaceholder,
};
const keyPlaceholderToken: KeyPlaceholderToken = {
    type: TokenType.KeyPlaceholder,
};

// eslint-disable-next-line import/prefer-default-export
export function* stringifyTokens(
    tokenStream: TokenizerReturn,
    features: TokenFeatures,
): Generator<
    string,
    void,
    void
> {
    const stack: StackFrame[] = [];

    let frame: StackFrame | undefined = {
        type: FrameType.Root,
        feature: features.root(),
    };

    let featureResult: IteratorResult<string, string | undefined>;
    let tokenResult = tokenStream.next();
    let token;

    // Initialize the root feature, and yield the string it returns, if any
    featureResult = frame.feature.next();

    if (testResult(featureResult, 'Root feature ended immediately')) {
        yield featureResult.value;
    }

    while (!tokenResult.done) {
        token = tokenResult.value;

        switch (frame.type) {
            case FrameType.Root: {
                switch (token.type) {
                    case TokenType.Invisible: {
                        // Let the current feature handle the invisible
                        featureResult = frame.feature.next(token);

                        if (testResult(
                            featureResult,
                            'Root feature ended early on an invisible token',
                        )) {
                            yield featureResult.value;
                        }

                        break;
                    }

                    case TokenType.Value:
                    case TokenType.Object:
                    case TokenType.Array: {
                        // Let the current feature know data is about to be stringified
                        featureResult = frame.feature.next(dataPlaceholderToken);

                        if (testResult(
                            featureResult,
                            'Root feature ended early on a data placeholder token',
                        )) {
                            yield featureResult.value;
                        }

                        break;
                    }

                    default: {
                        throw new Error(`Invalid token type for root feature '${TokenType[token.type]}'`);
                    }
                }

                break;
            }

            case FrameType.Object: {
                switch (token.type) {
                    case TokenType.Invisible: {
                        // Let the current feature handle the invisible
                        featureResult = frame.feature.next(token);

                        if (testResult(
                            featureResult,
                            'Object feature ended early on an invisible token',
                        )) {
                            yield featureResult.value;
                        }

                        break;
                    }

                    case TokenType.Separator: {
                        if (!frame.isSeparator) {
                            throw new Error(
                                'Expected a data or invisible token, got a separator token',
                            );
                        }

                        // Notify the current feature of the separator
                        featureResult = frame.feature.next(token);

                        frame.isSeparator = false;

                        if (testResult(
                            featureResult,
                            'Object feature ended early on a separator token',
                        )) {
                            yield featureResult.value;
                        }

                        break;
                    }

                    case TokenType.Value:
                    case TokenType.Object:
                    case TokenType.Array: {
                        if (frame.isSeparator) {
                            if (frame.isKey) {
                                throw new Error(
                                    'Expected a separator, invisible, or object end token, got a data token',
                                );
                            } else {
                                throw new Error(
                                    'Expected a separator or invisible token, got a data token',
                                );
                            }
                        }

                        // Let the current feature know data is about to be stringified
                        if (frame.isKey) {
                            featureResult = frame.feature.next(keyPlaceholderToken);
                        } else {
                            featureResult = frame.feature.next(dataPlaceholderToken);
                        }

                        frame.isSeparator = true;
                        frame.foundData = true;
                        frame.isKey = !frame.isKey;

                        if (testResult(
                            featureResult,
                            'Object feature ended early on a key/data placeholder token',
                        )) {
                            yield featureResult.value;
                        }

                        break;
                    }

                    case TokenType.ObjectEnd: {
                        if (frame.foundData) {
                            if (!frame.isSeparator) {
                                throw new Error(
                                    'Expected a data or invisible token, got an object end token',
                                );
                            } else if (!frame.isKey) {
                                throw new Error(
                                    'Expected a separator or invisible token, got an object end token',
                                );
                            }
                        }

                        featureResult = frame.feature.next(token);

                        if (!featureResult.done) {
                            throw new Error('Object feature did not end on an object end token');
                        }

                        if (featureResult.value !== undefined) {
                            yield featureResult.value;
                        }

                        frame = stack.pop();

                        break;
                    }

                    default: {
                        throw new Error(`Invalid token type for object feature '${TokenType[token.type]}'`);
                    }
                }

                break;
            }

            case FrameType.Array: {
                switch (token.type) {
                    case TokenType.Invisible: {
                        // Let the current feature handle the invisible
                        featureResult = frame.feature.next(token);

                        if (testResult(
                            featureResult,
                            'Array feature ended early on an invisible token',
                        )) {
                            yield featureResult.value;
                        }

                        break;
                    }

                    case TokenType.Separator: {
                        if (!frame.isSeparator) {
                            throw new Error(
                                'Expected a data or invisible token, got a separator token',
                            );
                        }

                        // Notify the current feature of the separator
                        featureResult = frame.feature.next(token);

                        frame.isSeparator = false;

                        if (testResult(
                            featureResult,
                            'Array feature ended early on a separator token',
                        )) {
                            yield featureResult.value;
                        }

                        break;
                    }

                    case TokenType.Value:
                    case TokenType.Object:
                    case TokenType.Array: {
                        if (frame.isSeparator) {
                            throw new Error(
                                'Expected a separator or invisible token, got a data token',
                            );
                        }

                        // Let the current feature know data is about to be stringified
                        featureResult = frame.feature.next(dataPlaceholderToken);

                        frame.foundData = true;
                        frame.isSeparator = true;

                        if (testResult(
                            featureResult,
                            'Array feature ended early on a data placeholder token',
                        )) {
                            yield featureResult.value;
                        }

                        break;
                    }

                    case TokenType.ArrayEnd: {
                        if (frame.foundData) {
                            if (!frame.isSeparator) {
                                throw new Error(
                                    'Expected a data or invisible token, got an array end token',
                                );
                            }
                        }

                        featureResult = frame.feature.next(token);

                        if (!featureResult.done) {
                            throw new Error('Array feature did not end on an array end token');
                        }

                        if (featureResult.value !== undefined) {
                            yield featureResult.value;
                        }

                        frame = stack.pop();

                        break;
                    }

                    default: {
                        throw new Error(`Invalid token type for array feature '${TokenType[token.type]}'`);
                    }
                }

                break;
            }

            default: {
                throw new Error('Unreachable switch case');
            }
        }

        // If we're out of stack frames, exit the loop early
        if (frame === undefined) {
            break;
        }

        // If the token was a data type, handle it
        switch (token.type) {
            case TokenType.Value: {
                let result: string | undefined;

                for (const feature of features.value) {
                    result = feature(token);

                    if (result !== undefined) {
                        break;
                    }
                }

                if (result === undefined) {
                    throw new Error('No value features handled a value token');
                }

                if (result.length > 0) {
                    yield result;
                }

                break;
            }

            case TokenType.Object: {
                stack.push(frame);

                let acceptedFeature: ReturnType<ObjectFeature>;
                let result: IteratorResult<string, string | undefined> | undefined;

                for (const feature of features.object) {
                    acceptedFeature = feature(token);

                    if (acceptedFeature !== undefined) {
                        result = acceptedFeature.next();

                        if (!result.done) {
                            break;
                        }
                    }
                }

                if (acceptedFeature === undefined || result === undefined || result.done) {
                    throw new Error('No object features handled an object token');
                }

                if (result.value.length > 0) {
                    yield result.value;
                }

                frame = {
                    type: FrameType.Object,
                    feature: acceptedFeature,
                    isKey: true,
                    isSeparator: false,
                    foundData: false,
                };

                break;
            }

            case TokenType.Array: {
                stack.push(frame);

                let acceptedFeature: ReturnType<ArrayFeature>;
                let result: IteratorResult<string, string | undefined> | undefined;

                for (const feature of features.array) {
                    acceptedFeature = feature(token);

                    if (acceptedFeature !== undefined) {
                        result = acceptedFeature.next();

                        if (!result.done) {
                            break;
                        }
                    }
                }

                if (acceptedFeature === undefined || result === undefined || result.done) {
                    throw new Error('No array features handled an array token');
                }

                if (result.value.length > 0) {
                    yield result.value;
                }

                frame = {
                    type: FrameType.Array,
                    feature: acceptedFeature,
                    isSeparator: false,
                    foundData: false,
                };

                break;
            }

            default: break;
        }

        tokenResult = tokenStream.next();
    }

    if (stack.length !== 0) {
        throw new Error('Tokenizer stopped early');
    }
}
