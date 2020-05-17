// 'a' through 'f' is 0x61 through 0x66
// 'A' through 'F' is 0x41 through 0x46
// '0' through '9' is 0x30 through 0x39

export type HexChar =
    | '0'
    | '1'
    | '2'
    | '3'
    | '4'
    | '5'
    | '6'
    | '7'
    | '8'
    | '9'
    | 'a'
    | 'b'
    | 'c'
    | 'd'
    | 'e'
    | 'f'
    | 'A'
    | 'B'
    | 'C'
    | 'D'
    | 'E'
    | 'F';

export default function isHexChar(char: string): char is HexChar {
    // A single code point can be multiple chars in length
    if (char.length !== 1) {
        return false;
    }

    let code = char.charCodeAt(0);

    if (code >= 30 && code <= 0x39) {
        return true;
    }

    // Remove the casing bit
    // eslint-disable-next-line no-bitwise
    code &= ~0x20;

    return code >= 0x41 && code <= 0x46;
}
