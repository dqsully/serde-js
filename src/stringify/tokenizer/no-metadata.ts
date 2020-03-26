import { TokenizerReturn, TokenType } from './abstract';

function isObject(data: any): data is {[key: string]: any} {
    return typeof data === 'object' && data !== null;
}

interface ObjectFrame {
    isArray: false;

    data: {[key: string]: any};

    keys: string[];
    index: number;
}

interface ArrayFrame {
    isArray: true;

    data: any[];

    index: number;
}

type StackFrame = ObjectFrame | ArrayFrame;

export default function* noMetadataTokenizer(data: any): TokenizerReturn {
    const stack: StackFrame[] = [];
    let frame: StackFrame | undefined;

    let subKey;
    let subData;

    if (data instanceof Array) {
        frame = {
            isArray: true,
            data,
            index: 0,
        };

        // console.debug('start root array');

        yield {
            type: TokenType.Array,
        };
    } else if (isObject(data)) {
        frame = {
            isArray: false,
            data,
            keys: Object.keys(data),
            index: 0,
        };

        // console.debug('start root object');

        yield {
            type: TokenType.Object,
        };
    } else {
        // Nothing to traverse, yield the data and quit

        // console.debug('visit root value');

        yield {
            type: TokenType.Value,
            value: data,
        };
    }


    while (frame !== undefined) {
        if (frame.isArray) {
            if (frame.index >= frame.data.length) {
                // We've reached the end of the array, signal the end and pop
                // the stack

                // console.debug('end array');

                yield {
                    type: TokenType.ArrayEnd,
                };

                frame = stack.pop();
            } else {
                if (frame.index > 0) {
                    // console.debug('array separator');

                    yield {
                        type: TokenType.Separator,
                    };
                }

                subData = frame.data[frame.index];

                // console.debug(`at index ${frame.index}`);

                frame.index += 1;

                if (subData instanceof Array) {
                    stack.push(frame);

                    frame = {
                        isArray: true,
                        data: subData,
                        index: 0,
                    };

                    // console.debug('start array');

                    yield {
                        type: TokenType.Array,
                    };
                } else if (isObject(subData)) {
                    stack.push(frame);

                    frame = {
                        isArray: false,
                        data: subData,
                        keys: Object.keys(subData),
                        index: 0,
                    };

                    // console.debug('start object');

                    yield {
                        type: TokenType.Object,
                    };
                } else {
                    // console.debug('visit value');

                    yield {
                        type: TokenType.Value,
                        value: subData,
                    };
                }
            }
        } else {
            if (frame.index >= frame.keys.length) {
                // We've reached the end of the object, signal the end and pop
                // the stack

                // console.debug('end object');

                yield {
                    type: TokenType.ObjectEnd,
                };

                frame = stack.pop();
            } else {
                if (frame.index > 0) {
                    // console.debug('object separator');
                    yield {
                        type: TokenType.Separator,
                    };
                }

                subKey = frame.keys[frame.index];
                subData = frame.data[subKey];

                // console.debug(`visit key ${subKey} (index ${frame.index})`);

                frame.index += 1;

                yield {
                    type: TokenType.Value,
                    value: subKey,
                };

                // console.debug('object key separator');

                yield {
                    type: TokenType.Separator,
                };

                if (subData instanceof Array) {
                    stack.push(frame);

                    frame = {
                        isArray: true,
                        data: subData,
                        index: 0,
                    };

                    // console.debug('start array');

                    yield {
                        type: TokenType.Array,
                    };
                } else if (isObject(subData)) {
                    stack.push(frame);

                    frame = {
                        isArray: false,
                        data: subData,
                        keys: Object.keys(subData),
                        index: 0,
                    };

                    // console.debug('start object');

                    yield {
                        type: TokenType.Object,
                    };
                } else {
                    // console.debug('visit value');

                    yield {
                        type: TokenType.Value,
                        value: subData,
                    };
                }
            }
        }
    }
}
