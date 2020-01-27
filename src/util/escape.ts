function isHex(char: string) {
    return /[0-9a-fA-F]/.test(char);
}

// eslint-disable-next-line import/prefer-default-export
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
                        if (!isHex(char)) {
                            throw new Error(`Unexpected '${char}' in hexadecimal escape sequence`);
                        }

                        scratch = char;

                        char = yield true;

                        if (char === undefined) {
                            throw new Error('Unfinished hexadecimal escape sequence');
                        }
                        if (!isHex(char)) {
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
                                if (!isHex(char)) {
                                    throw new Error(`Unexpected '${char}' in unicode escape sequence`);
                                }

                                scratch += char;
                            }

                            output += String.fromCodePoint(parseInt(scratch, 16));
                        } else {
                            if (!isHex(char)) {
                                throw new Error(`Unexpected '${char}' in unicode escape sequence`);
                            }

                            scratch = char;

                            for (let i = 0; i < 3; i += 1) {
                                char = yield true;

                                if (char === undefined) {
                                    throw new Error('Unfinished unicode escape sequence');
                                }
                                if (!isHex(char)) {
                                    throw new Error(`Unexpected '${char}' in unicode escape sequence`);
                                }
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
// export function parseEscape(escape: string) {
//     switch (escape) {
//         case 'b':
//             return '\b';
//         case 'f':
//             return '\f';
//         case 'n':
//             return '\n';
//         case 'r':
//             return '\r';
//         case 't':
//             return '\t';
//         case 'v':
//             return '\v';
//         case '0':
//             return '\0';
//         default:
//     }

//     if (/x[0-9a-fA-F]{2}/)

//     throw new Error(`Unknown escape sequence: '\\${escape}'`);
// }
