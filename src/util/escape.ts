import isUnprintable from './printable';
import isGraphemeExtend from './grapheme-extend';
import isHexChar from './is-hex';

export function* unescape() {
    let output = '';

    let char: string | undefined;
    let scratch: string;
    let escaped = false;

    while (true) {
        char = yield escaped;

        if (char === undefined) {
            return output;
        }

        if (escaped) {
            switch (char) {
                case 'b':
                    output += '\b';
                    break;

                case 'f':
                    output += '\f';
                    break;

                case 'n':
                    output += '\n';
                    break;

                case 'r':
                    output += '\r';
                    break;

                case 't':
                    output += '\t';
                    break;

                case 'v':
                    output += '\v';
                    break;

                case '0':
                    output += '\0';
                    break;

                default:
                    if (char === 'x') {
                        char = yield true;

                        if (char === undefined) {
                            throw new Error('Unfinished hexadecimal escape sequence');
                        }
                        if (!isHexChar(char)) {
                            throw new Error(`Unexpected '${char}' in hexadecimal escape sequence`);
                        }

                        scratch = char;

                        char = yield true;

                        if (char === undefined) {
                            throw new Error('Unfinished hexadecimal escape sequence');
                        }
                        if (!isHexChar(char)) {
                            throw new Error(`Unexpected '${char}' in hexadecimal escape sequence`);
                        }

                        scratch += char;

                        output += String.fromCharCode(parseInt(scratch, 16));
                    } else if (char === 'u') {
                        char = yield true;

                        if (char === undefined) {
                            throw new Error('Unfinished unicode escape sequence');
                        }
                        if (char === '{') {
                            scratch = '';
                            char = yield true;

                            while (char !== '}') {
                                if (char === undefined) {
                                    throw new Error('Unfinished unicode escape sequence');
                                }
                                if (!isHexChar(char)) {
                                    throw new Error(`Unexpected '${char}' in unicode escape sequence`);
                                }

                                scratch += char;
                            }

                            output += String.fromCodePoint(parseInt(scratch, 16));
                        } else {
                            if (!isHexChar(char)) {
                                throw new Error(`Unexpected '${char}' in unicode escape sequence`);
                            }

                            scratch = char;

                            for (let i = 0; i < 3; i += 1) {
                                char = yield true;

                                if (char === undefined) {
                                    throw new Error('Unfinished unicode escape sequence');
                                }
                                if (!isHexChar(char)) {
                                    throw new Error(`Unexpected '${char}' in unicode escape sequence`);
                                }

                                scratch += char;
                            }

                            output += String.fromCharCode(parseInt(scratch, 16));
                        }
                    } else {
                        output += char;
                    }
            }

            escaped = false;
        } else if (char === '\'') {
            escaped = true;
        } else {
            output += char;
        }
    }
}

function padHex(n: number, len: number) {
    return n.toString(16).padStart(len, '0');
}

// Heavily inspired by rust's char::escape_debug_ext(self, false)
export function escape(string: string, quote?: string) {
    let output = '';
    let lastIndex = 0;

    let i = 0;
    let char;
    let codepoint;

    for (char of string) {
        if (char === '\t') {
            output += string.slice(lastIndex, i);
            output += '\\t';
            lastIndex = i + 1;
        } else if (char === '\r') {
            output += string.slice(lastIndex, i);
            output += '\\r';
            lastIndex = i + 1;
        } else if (char === '\n') {
            output += string.slice(lastIndex, i);
            output += '\\n';
            lastIndex = i + 1;
        } else if (char === '\\') {
            output += string.slice(lastIndex, i);
            output += '\\\\';
            lastIndex = i + 1;
        } else if (char === quote) {
            output += string.slice(lastIndex, i);
            output += `\\${quote}`;
            lastIndex = i + 1;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            codepoint = char.codePointAt(0)!;

            if (isUnprintable(codepoint) || isGraphemeExtend(codepoint)) {
                output += string.slice(lastIndex, i);

                if (codepoint <= 0xff) {
                    output += `\\x${padHex(codepoint, 2)}`;
                } else {
                    if (codepoint > 0xffff) {
                        // eslint-disable-next-line no-bitwise
                        output += `\\u${padHex(codepoint >> 16, 4)}`;
                    }

                    // eslint-disable-next-line no-bitwise
                    output += `\\u${padHex(codepoint & 0xffff, 4)}`;
                }

                // Unicode code points can be multiple "chars";
                lastIndex = i + char.length;
            }
        }

        // Unicode code points can be multiple "chars"
        i += char.length;
    }

    // Fast case
    if (lastIndex === 0) {
        return string;
    }

    if (lastIndex !== i) {
        output += string.slice(lastIndex, i);
    }

    return output;
}
