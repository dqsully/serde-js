import { ValueToken } from '../../tokenizer/abstract';
import { escape } from '../../../util/escape';

export function doubleQuotedStringDefaultFeature(token: ValueToken) {
    if (typeof token.value !== 'string') {
        return undefined;
    }

    return `"${escape(token.value, '"')}"`;
}

export function doubleQuotedStringFeature(token: ValueToken) {
    if (token.meta?.['string.type'] !== 'double-quoted') {
        return undefined;
    }

    return doubleQuotedStringDefaultFeature(token);
}
