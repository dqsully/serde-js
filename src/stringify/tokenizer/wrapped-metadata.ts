import { TokenizerReturn, TokenType } from './abstract';
import { WrappedObject, WrappedArray, WrappedAny } from '../../parse/visitor/wrapped-metadata';

function isArray(input: WrappedAny): input is WrappedArray {
    return input.contents.type === 'array';
}

function isObject(input: WrappedAny): input is WrappedObject {
    return input.contents.type === 'object';
}

interface ObjectFrame {
    isArray: false;

    data: WrappedObject;

    keys: IterableIterator<string>;
    first: boolean;
}

interface ArrayFrame {
    isArray: true;

    data: WrappedArray;

    index: number;
}

type StackFrame = ObjectFrame | ArrayFrame;

export default function* wrappedMetadataTokenizer(data: WrappedAny): TokenizerReturn {
    const stack: StackFrame[] = [];
    let frame: StackFrame | undefined;

    let subKey;
    let subData;

    if (data.metaBefore) {
        for (const entry of data.metaBefore) {
            yield {
                type: TokenType.Invisible,
                kind: entry.kind,
                data: entry.value,
            };
        }
    }

    if (isArray(data)) {
        frame = {
            isArray: true,
            data,
            index: 0,
        };

        yield {
            type: TokenType.Array,
            meta: data.meta,
        };
    } else if (isObject(data)) {
        frame = {
            isArray: false,
            data,
            keys: data.contents.children.keys(),
            first: true,
        };

        yield {
            type: TokenType.Object,
            meta: data.meta,
        };
    } else {
        // Nothing to traverse, yield the data and quit

        yield {
            type: TokenType.Value,
            value: data.contents.value,
            meta: data.meta,
        };

        if (data.metaAfter) {
            for (const entry of data.metaAfter) {
                yield {
                    type: TokenType.Invisible,
                    kind: entry.kind,
                    data: entry.value,
                };
            }
        }
    }

    while (frame !== undefined) {
        if (frame.isArray) {
            if (frame.index >= frame.data.contents.children.length) {
                // We've reached the end of the array, signal the end and pop
                // the stack

                yield {
                    type: TokenType.ArrayEnd,
                };

                // Yield trailing invisibles if there were any
                if (frame.data.metaAfter) {
                    for (const entry of frame.data.metaAfter) {
                        yield {
                            type: TokenType.Invisible,
                            kind: entry.kind,
                            data: entry.value,
                        };
                    }
                }

                frame = stack.pop();
            } else {
                if (frame.index > 0) {
                    yield {
                        type: TokenType.Separator,
                    };
                }

                subData = frame.data.contents.children[frame.index];

                frame.index += 1;

                // Yield leading invisibles if there was any
                if (subData.metaBefore) {
                    for (const entry of subData.metaBefore) {
                        yield {
                            type: TokenType.Invisible,
                            kind: entry.kind,
                            data: entry.value,
                        };
                    }
                }

                if (isArray(subData)) {
                    stack.push(frame);

                    frame = {
                        isArray: true,
                        data: subData,
                        index: 0,
                    };

                    yield {
                        type: TokenType.Array,
                        meta: subData.meta,
                    };
                } else if (isObject(subData)) {
                    stack.push(frame);

                    frame = {
                        isArray: false,
                        data: subData,
                        keys: subData.contents.children.keys(),
                        first: true,
                    };

                    yield {
                        type: TokenType.Object,
                        meta: subData.meta,
                    };
                } else {
                    yield {
                        type: TokenType.Value,
                        value: subData.contents.value,
                        meta: subData.meta,
                    };

                    // Yield trailing invisibles if there was any
                    if (subData.metaAfter) {
                        for (const entry of subData.metaAfter) {
                            yield {
                                type: TokenType.Invisible,
                                kind: entry.kind,
                                data: entry.value,
                            };
                        }
                    }
                }
            }
        } else {
            const nextKey = frame.keys.next();

            if (nextKey.done) {
                // We've reached the end of the object, signal the end and pop
                // the stack

                yield {
                    type: TokenType.ObjectEnd,
                };

                // Yield trailing invisibles if there were any
                if (frame.data.metaAfter) {
                    for (const entry of frame.data.metaAfter) {
                        yield {
                            type: TokenType.Invisible,
                            kind: entry.kind,
                            data: entry.value,
                        };
                    }
                }

                frame = stack.pop();
            } else {
                if (frame.first) {
                    frame.first = false;
                } else {
                    yield {
                        type: TokenType.Separator,
                    };
                }

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const kv = frame.data.contents.children.get(nextKey.value)!;
                subKey = kv.key;
                subData = kv.value;

                // Yield leading invisibles for key if there were any
                if (subKey.metaBefore) {
                    for (const entry of subKey.metaBefore) {
                        yield {
                            type: TokenType.Invisible,
                            kind: entry.kind,
                            data: entry.value,
                        };
                    }
                }

                yield {
                    type: TokenType.Value,
                    value: subKey.contents.value,
                    meta: subKey.meta,
                };

                // Yield trailing invisibles for key if there were any
                if (subKey.metaAfter) {
                    for (const entry of subKey.metaAfter) {
                        yield {
                            type: TokenType.Invisible,
                            kind: entry.kind,
                            data: entry.value,
                        };
                    }
                }

                yield {
                    type: TokenType.Separator,
                };

                // Yield leading invisibles if there was any
                if (subData.metaBefore) {
                    for (const entry of subData.metaBefore) {
                        yield {
                            type: TokenType.Invisible,
                            kind: entry.kind,
                            data: entry.value,
                        };
                    }
                }

                if (isArray(subData)) {
                    stack.push(frame);

                    frame = {
                        isArray: true,
                        data: subData,
                        index: 0,
                    };

                    yield {
                        type: TokenType.Array,
                        meta: subData.meta,
                    };
                } else if (isObject(subData)) {
                    stack.push(frame);

                    frame = {
                        isArray: false,
                        data: subData,
                        keys: subData.contents.children.keys(),
                        first: true,
                    };

                    yield {
                        type: TokenType.Object,
                        meta: subData.meta,
                    };
                } else {
                    yield {
                        type: TokenType.Value,
                        value: subData.contents.value,
                        meta: subData.meta,
                    };

                    // Yield trailing invisibles if there was any
                    if (subData.metaAfter) {
                        for (const entry of subData.metaAfter) {
                            yield {
                                type: TokenType.Invisible,
                                kind: entry.kind,
                                data: entry.value,
                            };
                        }
                    }
                }
            }
        }
    }
}
